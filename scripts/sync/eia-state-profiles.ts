/**
 * EIA State Electricity Profiles → data/energy/state-profiles.json.
 *
 * Pulls summary (total capacity + total generation) and source-disposition
 * (per-fuel generation) per state, collapses to a single most-recent year.
 * Reads plant counts from the already-written power-plants.json.
 */

import "../env";
import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  FuelType,
  PowerPlant,
  StateEnergyProfile,
} from "../../types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const OUT_PATH = join(ROOT, "data/energy/state-profiles.json");
const PLANTS_PATH = join(ROOT, "data/energy/power-plants.json");

const API_KEY = process.env.EIA_API_KEY;
if (!API_KEY) {
  console.error("EIA_API_KEY is not set in .env.local");
  process.exit(1);
}

const USPS_TO_NAME: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

// electric-power-operational-data fueltypeid → our FuelType.
const EIA_SOURCE_MAP: Record<string, FuelType> = {
  NG: "natural-gas",
  COW: "coal", COL: "coal", BIT: "coal", SUB: "coal", LIG: "coal",
  NUC: "nuclear",
  HYC: "hydro", HPS: "hydro",
  SUN: "solar", SPV: "solar", STH: "solar",
  WND: "wind",
  WWW: "biomass", WOB: "biomass", BIO: "biomass", MSB: "biomass", ORW: "biomass", WAS: "biomass",
  GEO: "geothermal",
  DFO: "oil", RFO: "oil", PEL: "oil", PET: "oil", POC: "oil", WOO: "oil",
  OOG: "other", OTH: "other", ALL: "other",
};

interface SummaryRow {
  period: string;
  stateID: string;
  stateDescription: string;
  "net-generation": string | number | null;
  "net-summer-capacity": string | number | null;
}

interface SourceRow {
  period: string;
  location: string;
  fueltypeid: string;
  generation: string | number | null;
}

interface EIAResponse<T> {
  response: { data?: T[] };
}

async function fetchSummary(): Promise<SummaryRow[]> {
  const url = new URL(
    "https://api.eia.gov/v2/electricity/state-electricity-profiles/summary/data/",
  );
  url.searchParams.set("api_key", API_KEY!);
  url.searchParams.set("frequency", "annual");
  url.searchParams.append("data[0]", "net-generation");
  url.searchParams.append("data[1]", "net-summer-capacity");
  url.searchParams.append("sort[0][column]", "period");
  url.searchParams.append("sort[0][direction]", "desc");
  url.searchParams.set("length", "5000");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`EIA summary ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as EIAResponse<SummaryRow>;
  return json.response.data ?? [];
}

async function fetchSourceAll(): Promise<SourceRow[]> {
  // electric-power-operational-data: generation by state × fueltype, annual.
  // Filter to sectorid "99" (all sectors) server-side so rows aren't triplicated.
  const rows: SourceRow[] = [];
  let offset = 0;
  let latestPeriod: string | null = null;
  while (true) {
    const url = new URL(
      "https://api.eia.gov/v2/electricity/electric-power-operational-data/data/",
    );
    url.searchParams.set("api_key", API_KEY!);
    url.searchParams.set("frequency", "annual");
    url.searchParams.append("data[0]", "generation");
    url.searchParams.append("facets[sectorid][]", "99");
    url.searchParams.append("sort[0][column]", "period");
    url.searchParams.append("sort[0][direction]", "desc");
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("length", "5000");
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`EIA source ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as EIAResponse<SourceRow>;
    const page = json.response.data ?? [];
    if (page.length === 0) break;
    if (!latestPeriod) latestPeriod = page[0].period;
    const kept = page.filter((r) => r.period === latestPeriod);
    rows.push(...kept);
    console.log(
      `[EIA profiles] period=${latestPeriod} offset=${offset} page=${page.length} kept=${kept.length} total=${rows.length}`,
    );
    if (kept.length < page.length) break;
    if (page.length < 5000) break;
    offset += 5000;
    await new Promise((r) => setTimeout(r, 200));
  }
  return rows;
}

async function main() {
  const summaryRows = await fetchSummary();
  console.log(`[EIA profiles] summary rows: ${summaryRows.length}`);
  const sourceRows = await fetchSourceAll();

  // Plant counts per state from previously-synced plants file.
  const plantCountByState = new Map<string, number>();
  if (existsSync(PLANTS_PATH)) {
    const plantsFile = JSON.parse(readFileSync(PLANTS_PATH, "utf8")) as {
      plants: PowerPlant[];
    };
    for (const p of plantsFile.plants) {
      plantCountByState.set(
        p.stateCode,
        (plantCountByState.get(p.stateCode) ?? 0) + 1,
      );
    }
  } else {
    console.warn("[EIA profiles] power-plants.json not found; plantCount = 0");
  }

  // Pick the most recent period with summary data for each state.
  const latestPeriodByState = new Map<string, string>();
  for (const r of summaryRows) {
    const code = r.stateID?.toUpperCase();
    if (!code || code.length !== 2) continue;
    if (!USPS_TO_NAME[code]) continue;
    const cur = latestPeriodByState.get(code);
    if (!cur || r.period > cur) latestPeriodByState.set(code, r.period);
  }

  // Summary index: stateCode → latest row.
  const summaryByState = new Map<string, SummaryRow>();
  for (const r of summaryRows) {
    const code = r.stateID?.toUpperCase();
    if (!code) continue;
    if (latestPeriodByState.get(code) === r.period) {
      summaryByState.set(code, r);
    }
  }

  // Source generation for each state: latest period across the dataset.
  const sourcesByState = new Map<string, Map<FuelType, number>>();
  const sourceLatestByState = new Map<string, string>();
  for (const r of sourceRows) {
    const code = r.location?.toUpperCase();
    if (!code || !USPS_TO_NAME[code]) continue;
    // skip ALL/ALL fueltype aggregate rows
    const fuel = r.fueltypeid?.toUpperCase?.() ?? "";
    if (!fuel || fuel === "ALL") continue;
    const ft = EIA_SOURCE_MAP[fuel] ?? null;
    if (!ft) continue;
    const mwh = Number(r.generation);
    if (!Number.isFinite(mwh) || mwh <= 0) continue;
    sourceLatestByState.set(code, r.period);
    const bucket = sourcesByState.get(code) ?? new Map<FuelType, number>();
    bucket.set(ft, (bucket.get(ft) ?? 0) + mwh);
    sourcesByState.set(code, bucket);
  }

  const profiles: StateEnergyProfile[] = [];
  for (const [code, state] of Object.entries(USPS_TO_NAME)) {
    const summary = summaryByState.get(code);
    const sources = sourcesByState.get(code);
    if (!summary && !sources) continue;
    const totalGen = Number(summary?.["net-generation"] ?? 0);
    const totalCap = Number(summary?.["net-summer-capacity"] ?? 0);
    const mixTotal = sources
      ? Array.from(sources.values()).reduce((s, n) => s + n, 0)
      : 0;
    const energyMix = sources
      ? Array.from(sources.entries())
          .map(([source, generationMWh]) => ({
            source,
            generationMWh: Math.round(generationMWh),
            pct: mixTotal > 0 ? (generationMWh / mixTotal) * 100 : 0,
          }))
          .sort((a, b) => b.pct - a.pct)
      : [];
    const year = Number(summary?.period ?? sourceLatestByState.get(code) ?? 0);
    profiles.push({
      state,
      stateCode: code,
      totalCapacityMW: Math.round(totalCap),
      totalGenerationMWh: Math.round(totalGen),
      energyMix,
      plantCount: plantCountByState.get(code) ?? 0,
      year: Number.isFinite(year) ? year : 0,
    });
  }

  profiles.sort((a, b) => b.totalCapacityMW - a.totalCapacityMW);
  console.log(`[EIA profiles] wrote ${profiles.length} state profiles`);

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(
    OUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: profiles.length,
        profiles,
      },
      null,
      2,
    ),
  );
  console.log(`[EIA profiles] wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
