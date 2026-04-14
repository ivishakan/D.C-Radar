import type { FacilityEnvMetrics } from "@/types";

// Loaded at build time. Run `npm run env:sync` to refresh.
let metricsData: {
  generatedAt: string;
  epaNote: string;
  sustainabilityNote: string;
  metrics: Record<string, FacilityEnvMetrics>;
} | null = null;

function load() {
  if (metricsData) return metricsData;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    metricsData = require("@/data/datacenters/env-metrics.json");
  } catch {
    metricsData = { generatedAt: "", epaNote: "", sustainabilityNote: "", metrics: {} };
  }
  return metricsData!;
}

export function getEnvMetrics(facilityId: string): FacilityEnvMetrics | null {
  const data = load();
  return data.metrics[facilityId] ?? null;
}

export function getEnvMetaNotes(): { epaNote: string; sustainabilityNote: string } {
  const data = load();
  return { epaNote: data.epaNote, sustainabilityNote: data.sustainabilityNote };
}
