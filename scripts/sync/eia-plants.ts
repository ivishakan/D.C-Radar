/**
 * EIA Operating Generator Capacity → data/energy/power-plants.json.
 *
 * Pulls every US generator at status OP, aggregates to plant level (summed
 * MW + dominant fuel), filters to ≥ 50 MW, writes a flat list.
 */

import "../env";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FuelType, PowerPlant } from "../../types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const OUT_PATH = join(ROOT, "data/energy/power-plants.json");

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

const FUEL_MAP: Record<string, FuelType> = {
  NG: "natural-gas",
  SUB: "coal", BIT: "coal", LIG: "coal", RC: "coal", ANT: "coal",
  NUC: "nuclear",
  WAT: "hydro", HPS: "hydro", PS: "hydro",
  SUN: "solar",
  WND: "wind",
  WDS: "biomass", BLQ: "biomass", OBL: "biomass", AB: "biomass", OBS: "biomass", MSW: "biomass", LFG: "biomass", OBG: "biomass",
  GEO: "geothermal",
  MWH: "battery",
  DFO: "oil", RFO: "oil", KER: "oil", JF: "oil", WO: "oil",
  OG: "other", OTH: "other", WH: "other", PC: "other", PG: "other",
};

interface EIARow {
  period: string;
  stateid: string;
  plantid: number;
  plantName: string;
  generatorid: string;
  technology: string;
  energy_source_code: string;
  "nameplate-capacity-mw": string | number | null;
  latitude: string | number | null;
  longitude: string | number | null;
  status: string;
}

interface EIAResponse {
  response: {
    total?: number | string;
    data?: EIARow[];
  };
}

async function fetchPage(offset: number): Promise<EIARow[]> {
  const url = new URL(
    "https://api.eia.gov/v2/electricity/operating-generator-capacity/data/",
  );
  url.searchParams.set("api_key", API_KEY!);
  url.searchParams.set("frequency", "monthly");
  url.searchParams.append("data[0]", "nameplate-capacity-mw");
  url.searchParams.append("data[1]", "latitude");
  url.searchParams.append("data[2]", "longitude");
  url.searchParams.append("facets[status][]", "OP");
  url.searchParams.append("sort[0][column]", "period");
  url.searchParams.append("sort[0][direction]", "desc");
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("length", "5000");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`EIA ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as EIAResponse;
  return json.response.data ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const allRows: EIARow[] = [];
  let offset = 0;
  let latestPeriod: string | null = null;
  while (true) {
    const rows = await fetchPage(offset);
    if (rows.length === 0) break;
    if (!latestPeriod) latestPeriod = rows[0].period;
    // Only keep the most recent month. Sorted desc, so once we pass it we stop.
    const kept = rows.filter((r) => r.period === latestPeriod);
    allRows.push(...kept);
    console.log(
      `[EIA] period=${latestPeriod} offset=${offset} page=${rows.length} kept=${kept.length} total=${allRows.length}`,
    );
    if (kept.length < rows.length) break;
    if (rows.length < 5000) break;
    offset += 5000;
    await sleep(200);
  }

  console.log(`[EIA] total generators: ${allRows.length}`);

  // Aggregate to plant level. Keep latest period per generator to avoid
  // double-counting when multiple years come back.
  interface GenKey {
    plantid: number;
    stateid: string;
    plantName: string;
    lat: number;
    lng: number;
    mwByGen: Map<string, { mw: number; fuel: string }>;
  }
  const plants = new Map<number, GenKey>();
  for (const r of allRows) {
    const mw = Number(r["nameplate-capacity-mw"]);
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    if (!Number.isFinite(mw) || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat === 0 && lng === 0) continue;
    const cur = plants.get(r.plantid) ?? {
      plantid: r.plantid,
      stateid: r.stateid,
      plantName: r.plantName,
      lat,
      lng,
      mwByGen: new Map(),
    };
    cur.mwByGen.set(r.generatorid, { mw, fuel: r.energy_source_code });
    plants.set(r.plantid, cur);
  }

  const out: PowerPlant[] = [];
  for (const p of plants.values()) {
    let totalMw = 0;
    const fuelSum = new Map<FuelType, number>();
    for (const g of p.mwByGen.values()) {
      totalMw += g.mw;
      const ft = FUEL_MAP[g.fuel] ?? "other";
      fuelSum.set(ft, (fuelSum.get(ft) ?? 0) + g.mw);
    }
    if (totalMw < 50) continue;
    let primaryFuel: FuelType = "other";
    let max = -1;
    for (const [ft, mw] of fuelSum) {
      if (mw > max) {
        max = mw;
        primaryFuel = ft;
      }
    }
    const stateCode = (p.stateid || "").toUpperCase();
    const state = USPS_TO_NAME[stateCode] ?? stateCode;
    out.push({
      id: `plant-${p.plantid}`,
      name: p.plantName,
      lat: p.lat,
      lng: p.lng,
      capacityMW: Math.round(totalMw * 10) / 10,
      fuelType: primaryFuel,
      state,
      stateCode,
    });
  }

  out.sort((a, b) => b.capacityMW - a.capacityMW);
  console.log(`[EIA] plants ≥50 MW: ${out.length}`);

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(
    OUT_PATH,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), count: out.length, plants: out },
      null,
      2,
    ),
  );
  console.log(`[EIA] wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
