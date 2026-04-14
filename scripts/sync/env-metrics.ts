/**
 * Environmental metrics enrichment script.
 *
 * Two data sources:
 *
 *  1. Operator-level sustainability data (WUE, PUE, renewable %)
 *     from `data/datacenters/wue-lookup.json` — curated from annual
 *     sustainability reports published by Google, Microsoft, Meta,
 *     Amazon, and Apple. These are global fleet averages.
 *
 *  2. EPA Envirofacts — queries the EPA Greenhouse Gas Reporting
 *     Program (GHGRP) `PUB_DIM_FACILITY` table by lat/lng bounding box
 *     for each facility. Note: most data centers fall below the 25,000
 *     MT/year direct-emission threshold for mandatory GHGRP reporting,
 *     so matches are sparse. When found, the nearby EPA-registered
 *     facility is surfaced as-is.
 *
 * Output: data/datacenters/env-metrics.json
 * Run:    npm run env:sync
 */

import "../env.js";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

interface Facility {
  id: string;
  operator: string;
  lat: number;
  lng: number;
  country?: string;
  state?: string;
  location?: string;
}

interface WueLookupEntry {
  matchTerms: string[];
  wueLPerKwh: number;
  pue: number;
  renewablePct: number;
  reportYear: number;
  source: string;
  sourceUrl: string;
}

interface WueLookup {
  operators: Record<string, WueLookupEntry>;
}

interface EpaGhgrpFacility {
  facility_name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  naics_code: string;
  year: number;
  frs_id: string;
  parent_company: string | null;
  facility_types: string | null;
}

export interface FacilityEnvMetrics {
  epa?: {
    facilityName: string;
    frsId: string;
    city: string;
    state: string;
    naicsCode: string;
    year: number;
    parentCompany: string | null;
    facilityTypes: string | null;
    distanceMi: number;
  } | null;
  sustainability?: {
    wueLPerKwh: number;
    wueLabel: string;
    pue: number;
    pueLabel: string;
    renewablePct: number;
    reportYear: number;
    source: string;
    sourceUrl: string;
  } | null;
}

// Haversine distance in miles
function distanceMi(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_DEG = 0.15; // ~10 miles bounding box

async function queryEpaGhgrp(
  lat: number,
  lng: number,
): Promise<EpaGhgrpFacility[]> {
  const latMin = (lat - RADIUS_DEG).toFixed(4);
  const latMax = (lat + RADIUS_DEG).toFixed(4);
  const lngMin = (lng - RADIUS_DEG).toFixed(4);
  const lngMax = (lng + RADIUS_DEG).toFixed(4);

  const url =
    `https://data.epa.gov/efservice/PUB_DIM_FACILITY` +
    `/LATITUDE/>${latMin}/LATITUDE/<${latMax}` +
    `/LONGITUDE/>${lngMin}/LONGITUDE/<${lngMax}` +
    `/1:20/JSON`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return [];
    const raw = await res.text();
    if (!raw.trim().startsWith("[")) return [];
    const data = JSON.parse(raw) as EpaGhgrpFacility[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function matchSustainability(
  operator: string,
  lookup: WueLookup,
): WueLookupEntry | null {
  const op = operator.toLowerCase();
  for (const entry of Object.values(lookup.operators)) {
    if (entry.matchTerms.some((t) => op.includes(t))) return entry;
  }
  return null;
}

// Pick the EPA facility nearest to the data center (within 2 miles), most recent year.
function pickBestEpaMatch(
  candidates: EpaGhgrpFacility[],
  lat: number,
  lng: number,
): (EpaGhgrpFacility & { distanceMi: number }) | null {
  const withDist = candidates
    .map((f) => ({
      ...f,
      distanceMi: distanceMi(lat, lng, Number(f.latitude), Number(f.longitude)),
    }))
    .filter((f) => f.distanceMi <= 2.0)
    .sort((a, b) => {
      // Prefer closest; break ties by most recent year.
      if (Math.abs(a.distanceMi - b.distanceMi) > 0.1) return a.distanceMi - b.distanceMi;
      return b.year - a.year;
    });
  return withDist[0] ?? null;
}

async function main() {
  const epochRaw = JSON.parse(
    readFileSync(join(ROOT, "data/datacenters/epoch-ai.json"), "utf8"),
  );
  const researchedRaw = JSON.parse(
    readFileSync(join(ROOT, "data/datacenters/researched.json"), "utf8"),
  );
  const internationalRaw = JSON.parse(
    readFileSync(join(ROOT, "data/datacenters/international.json"), "utf8"),
  );
  const lookup = JSON.parse(
    readFileSync(join(ROOT, "data/datacenters/wue-lookup.json"), "utf8"),
  ) as WueLookup;

  const allFacilities: Facility[] = [
    ...(epochRaw.facilities ?? []),
    ...(researchedRaw.facilities ?? []),
    ...(internationalRaw.facilities ?? []),
  ];

  // Deduplicate by id
  const seen = new Set<string>();
  const facilities: Facility[] = [];
  for (const f of allFacilities) {
    if (!seen.has(f.id)) {
      seen.add(f.id);
      facilities.push(f);
    }
  }

  console.log(`Processing ${facilities.length} facilities…`);

  const metrics: Record<string, FacilityEnvMetrics> = {};
  let epaHits = 0;
  let sustainHits = 0;

  for (let i = 0; i < facilities.length; i++) {
    const f = facilities[i];
    process.stdout.write(`\r  ${i + 1}/${facilities.length} — ${f.id.slice(0, 40).padEnd(40)}`);

    const m: FacilityEnvMetrics = {};

    // 1 — Sustainability lookup (instant, no network)
    const sus = matchSustainability(f.operator, lookup);
    if (sus) {
      sustainHits++;
      m.sustainability = {
        wueLPerKwh: sus.wueLPerKwh,
        wueLabel: `${sus.wueLPerKwh} L/kWh`,
        pue: sus.pue,
        pueLabel: sus.pue.toFixed(2),
        renewablePct: sus.renewablePct,
        reportYear: sus.reportYear,
        source: sus.source,
        sourceUrl: sus.sourceUrl,
      };
    }

    // 2 — EPA GHGRP bounding box (US only; skip international to save time)
    if (f.country === "United States" || !f.country) {
      await new Promise((r) => setTimeout(r, 250)); // ~4 req/sec
      const candidates = await queryEpaGhgrp(f.lat, f.lng);
      const best = pickBestEpaMatch(candidates, f.lat, f.lng);
      if (best) {
        epaHits++;
        m.epa = {
          facilityName: best.facility_name,
          frsId: best.frs_id,
          city: best.city,
          state: best.state,
          naicsCode: best.naics_code,
          year: best.year,
          parentCompany: best.parent_company,
          facilityTypes: best.facility_types,
          distanceMi: Math.round(best.distanceMi * 10) / 10,
        };
      } else {
        m.epa = null;
      }
    }

    if (m.epa !== undefined || m.sustainability) {
      metrics[f.id] = m;
    }
  }

  process.stdout.write("\n");
  console.log(
    `Done. Sustainability: ${sustainHits} / EPA GHGRP: ${epaHits} out of ${facilities.length} facilities.`,
  );

  const out = {
    generatedAt: new Date().toISOString(),
    epaNote:
      "Most data centers fall below the EPA GHGRP 25,000 MT/year direct-emission threshold. EPA records shown here are the nearest registered GHGRP facility within 2 miles, which may be a different facility (e.g. utility substation, industrial plant) rather than the data center itself.",
    sustainabilityNote:
      "WUE and PUE figures are global fleet averages from published annual sustainability reports. Individual facility performance varies by climate, cooling type, and utilisation.",
    metrics,
  };

  writeFileSync(
    join(ROOT, "data/datacenters/env-metrics.json"),
    JSON.stringify(out, null, 2),
  );
  console.log("Wrote data/datacenters/env-metrics.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
