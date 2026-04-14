/**
 * Natural Earth 10m rivers + lakes → data/energy/us-water.json.
 *
 * Uses pre-converted GeoJSON from the natural-earth-vector GitHub mirror so
 * we skip shapefile parsing. Filters to features whose bbox overlaps the
 * continental-US bounding box, keeps named rivers and non-tiny lakes, and
 * strips coordinates to 3 decimal places to stay under ~500KB.
 */

import "../env";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  FeatureCollection,
  Feature,
  Geometry,
  Position,
} from "geojson";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const OUT_PATH = join(ROOT, "data/energy/us-water.json");

const RIVERS_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson";
const LAKES_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson";

// Tight continental-US bbox — we check every coordinate against this,
// not just the feature's own bbox, so we drop rivers that technically
// overlap via a Canadian tributary but don't actually enter the US.
const US_REGIONS = [
  { lngMin: -124.85, lngMax: -66.9, latMin: 24.4, latMax: 49.4 }, // lower 48
  { lngMin: -170, lngMax: -130, latMin: 54, latMax: 71.5 }, // Alaska
  { lngMin: -160.3, lngMax: -154.8, latMin: 18.9, latMax: 22.3 }, // Hawaii
];

function pointInUS(lng: number, lat: number): boolean {
  for (const r of US_REGIONS) {
    if (lng >= r.lngMin && lng <= r.lngMax && lat >= r.latMin && lat <= r.latMax) {
      return true;
    }
  }
  return false;
}

function hasAnyUSPoint(f: Feature): boolean {
  let found = false;
  const walk = (c: unknown): void => {
    if (found || !Array.isArray(c)) return;
    if (typeof c[0] === "number") {
      const [lng, lat] = c as [number, number];
      if (pointInUS(lng, lat)) found = true;
      return;
    }
    for (const inner of c) {
      if (found) return;
      walk(inner);
    }
  };
  walk((f.geometry as Geometry & { coordinates?: unknown })?.coordinates);
  return found;
}

function roundCoords<T>(coords: T, digits = 2): T {
  const mult = Math.pow(10, digits);
  const walk = (c: unknown): unknown => {
    if (!Array.isArray(c)) return c;
    if (typeof c[0] === "number") {
      return (c as number[]).map((n) => Math.round(n * mult) / mult) as Position;
    }
    return c.map(walk);
  };
  return walk(coords) as T;
}

async function fetchGeoJSON(url: string): Promise<FeatureCollection> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as FeatureCollection;
}

async function main() {
  console.log("[water] fetching rivers…");
  const rivers = await fetchGeoJSON(RIVERS_URL);
  console.log(`[water] rivers: ${rivers.features.length}`);

  console.log("[water] fetching lakes…");
  const lakes = await fetchGeoJSON(LAKES_URL);
  console.log(`[water] lakes: ${lakes.features.length}`);

  const riverFeatures: Feature[] = [];
  for (const f of rivers.features) {
    const name = (f.properties?.name ?? "").toString().trim();
    if (!name) continue;
    // Drop tiniest rivers — strokeweig < 1 at 10m is usually a small
    // tributary that disappears visually at state zoom anyway.
    const weight = Number(f.properties?.strokeweig ?? 1);
    if (weight < 1) continue;
    if (!hasAnyUSPoint(f)) continue;
    const geom = f.geometry as Geometry & { coordinates?: unknown };
    if (!geom?.coordinates) continue;
    riverFeatures.push({
      type: "Feature",
      properties: {
        name,
        strokeweig: f.properties?.strokeweig ?? 1,
      },
      geometry: {
        ...(geom as Geometry),
        coordinates: roundCoords(geom.coordinates),
      } as Geometry,
    });
  }

  const lakeFeatures: Feature[] = [];
  for (const f of lakes.features) {
    const scalerank = Number(f.properties?.scalerank ?? 99);
    if (scalerank > 4) continue;
    if (!hasAnyUSPoint(f)) continue;
    const geom = f.geometry as Geometry & { coordinates?: unknown };
    if (!geom?.coordinates) continue;
    lakeFeatures.push({
      type: "Feature",
      properties: {
        name: f.properties?.name ?? null,
        scalerank,
      },
      geometry: {
        ...(geom as Geometry),
        coordinates: roundCoords(geom.coordinates),
      } as Geometry,
    });
  }

  console.log(
    `[water] kept ${riverFeatures.length} rivers, ${lakeFeatures.length} lakes`,
  );

  const out = {
    generatedAt: new Date().toISOString(),
    rivers: {
      type: "FeatureCollection" as const,
      features: riverFeatures,
    },
    lakes: {
      type: "FeatureCollection" as const,
      features: lakeFeatures,
    },
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out));
  const bytes = JSON.stringify(out).length;
  console.log(`[water] wrote ${OUT_PATH} (${(bytes / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
