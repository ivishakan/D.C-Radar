/**
 * Fetch Epoch AI's Frontier Data Centers dataset (CC-BY) and write it as
 * a consolidated JSON file for the map overlay.
 *
 * Source: https://epoch.ai/data/data_centers/data_centers.zip
 * Output: data/datacenters/epoch-ai.json
 *
 * The raw CSV only provides addresses; we geocode each via OpenStreetMap's
 * Nominatim API (1 req/sec per their usage policy). Geocoded coordinates
 * are cached locally to avoid re-hitting Nominatim on subsequent runs.
 */

import "../env.js";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const DATA_DIR = join(ROOT, "data/datacenters");
const GEO_CACHE = join(ROOT, "data/raw/nominatim-cache.json");
const ZIP_PATH = join(ROOT, "data/raw/epoch-dc.zip");
const EXTRACT_DIR = join(ROOT, "data/raw/epoch-dc");

const ZIP_URL = "https://epoch.ai/data/data_centers/data_centers.zip";

interface EpochRow {
  Name: string;
  "Current H100 equivalents"?: string;
  "Current power (MW)"?: string;
  "Current total capital cost (2025 USD billions)"?: string;
  Owner?: string;
  Users?: string;
  Notes?: string;
  Project?: string;
  Country?: string;
  Address?: string;
}

interface DataCenter {
  id: string;
  operator: string;
  location: string;
  state?: string;
  country?: string;
  lat: number;
  lng: number;
  capacityMW?: number;
  status: "proposed" | "under-construction" | "operational";
  notes?: string;
  source: "epoch-ai";
  primaryUser?: string;
  computeH100e?: number;
  costUSD?: number;
}

interface GeoCache {
  [address: string]: { lat: number; lng: number; state?: string } | null;
}

function loadGeoCache(): GeoCache {
  if (!existsSync(GEO_CACHE)) return {};
  return JSON.parse(readFileSync(GEO_CACHE, "utf8")) as GeoCache;
}

function saveGeoCache(cache: GeoCache) {
  mkdirSync(dirname(GEO_CACHE), { recursive: true });
  writeFileSync(GEO_CACHE, JSON.stringify(cache, null, 2));
}

async function downloadAndExtract() {
  mkdirSync(dirname(ZIP_PATH), { recursive: true });
  if (!existsSync(ZIP_PATH)) {
    console.log("[epoch] downloading zip...");
    const res = await fetch(ZIP_URL);
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(ZIP_PATH, buf);
  }
  mkdirSync(EXTRACT_DIR, { recursive: true });
  execSync(`unzip -o "${ZIP_PATH}" -d "${EXTRACT_DIR}"`, {
    stdio: "ignore",
  });
}

function parseCsv(path: string): EpochRow[] {
  const text = readFileSync(path, "utf8");
  const rows: EpochRow[] = [];
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        current.push(field);
        field = "";
      } else if (c === "\n") {
        current.push(field);
        lines.push(current);
        current = [];
        field = "";
      } else if (c === "\r") {
        // ignore
      } else {
        field += c;
      }
    }
  }
  if (field.length || current.length) {
    current.push(field);
    lines.push(current);
  }
  if (!lines.length) return [];
  const header = lines[0];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 1 && row[0] === "") continue;
    const obj: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = row[j] ?? "";
    }
    rows.push(obj as unknown as EpochRow);
  }
  return rows;
}

async function geocode(
  address: string,
  cache: GeoCache,
): Promise<{ lat: number; lng: number; state?: string } | null> {
  if (address in cache) return cache[address];
  if (!address) {
    cache[address] = null;
    return null;
  }
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "gov-index/1.0 (data-center-map-ingest)" },
  });
  if (!res.ok) {
    cache[address] = null;
    return null;
  }
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    address?: { state?: string };
  }>;
  if (!data.length) {
    cache[address] = null;
    return null;
  }
  const hit = data[0];
  const result = {
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    state: hit.address?.state,
  };
  cache[address] = result;
  saveGeoCache(cache);
  // Nominatim policy: 1 req/sec
  await new Promise((r) => setTimeout(r, 1100));
  return result;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stripConfidence(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/#confident|#planned|#proposed|#tbd/gi, "").trim();
}

function deriveStatus(row: EpochRow): DataCenter["status"] {
  const blob = [row.Notes, row.Project, row.Owner, row.Users]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/\b(planned|proposed|announced|will be built)\b/.test(blob)) {
    return "proposed";
  }
  if (/\b(under construction|constructing|groundbreak|breaking ground)\b/.test(blob)) {
    return "under-construction";
  }
  return "operational";
}

function firstSentence(s: string | undefined, max = 200): string | undefined {
  if (!s) return undefined;
  const clean = s.replace(/\s+/g, " ").trim();
  const dot = clean.indexOf(". ");
  const cut = dot > 0 && dot < max ? dot + 1 : Math.min(clean.length, max);
  return clean.slice(0, cut).trim();
}

async function main() {
  await downloadAndExtract();
  const rows = parseCsv(join(EXTRACT_DIR, "data_centers.csv"));
  console.log(`[epoch] parsed ${rows.length} rows`);

  const cache = loadGeoCache();
  const out: DataCenter[] = [];

  for (const row of rows) {
    const address = row.Address?.trim();
    const name = row.Name?.trim();
    if (!name) continue;
    const geo = address ? await geocode(address, cache) : null;
    if (!geo) {
      console.warn(`[epoch] skipping ${name} — no geo for "${address}"`);
      continue;
    }
    const capacityMW = row["Current power (MW)"]
      ? parseFloat(row["Current power (MW)"])
      : undefined;
    const computeH100e = row["Current H100 equivalents"]
      ? parseFloat(row["Current H100 equivalents"])
      : undefined;
    const costUSD = row["Current total capital cost (2025 USD billions)"]
      ? parseFloat(row["Current total capital cost (2025 USD billions)"]) *
        1_000_000_000
      : undefined;
    out.push({
      id: `epoch-${slugify(name)}`,
      operator: stripConfidence(row.Owner) || name,
      location: address ?? name,
      state: geo.state,
      country: row.Country || "United States",
      lat: geo.lat,
      lng: geo.lng,
      capacityMW,
      status: deriveStatus(row),
      notes: firstSentence(row.Notes),
      source: "epoch-ai",
      primaryUser: stripConfidence(row.Users) || undefined,
      computeH100e,
      costUSD,
    });
    console.log(
      `[epoch] ${name} → ${geo.lat.toFixed(3)}, ${geo.lng.toFixed(3)} (${capacityMW ?? "?"} MW)`,
    );
  }

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    join(DATA_DIR, "epoch-ai.json"),
    JSON.stringify(
      {
        source: "Epoch AI Frontier Data Centers (CC-BY)",
        sourceUrl: ZIP_URL,
        fetchedAt: new Date().toISOString(),
        count: out.length,
        facilities: out,
      },
      null,
      2,
    ),
  );
  console.log(`[epoch] wrote ${out.length} facilities → data/datacenters/epoch-ai.json`);
}

main().catch((e) => {
  console.error("[epoch] fatal:", e.message);
  process.exit(1);
});
