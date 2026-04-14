"use client";

import type { FuelType } from "@/types";
import { getStateProfile, plantsInState } from "@/lib/energy-data";
import { FUEL_COLOR, FUEL_LABEL, collapseFuel } from "@/lib/energy-colors";

interface EnergySectionProps {
  stateName: string;
}

function formatCapacity(mw: number): string {
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`;
  return `${Math.round(mw)} MW`;
}

export default function EnergySection({ stateName }: EnergySectionProps) {
  const profile = getStateProfile(stateName);
  const plants = plantsInState(stateName);

  if (!profile && plants.length === 0) {
    return (
      <p className="text-xs text-muted">No energy profile available.</p>
    );
  }

  const topPlants = plants
    .slice()
    .sort((a, b) => b.capacityMW - a.capacityMW)
    .slice(0, 3);

  // Merge oil into coal so the mix bar + legend read cleanly.
  const mergedMixMap = new Map<FuelType, { pct: number; generationMWh: number }>();
  for (const s of profile?.energyMix ?? []) {
    const key = collapseFuel(s.source as FuelType);
    const prev = mergedMixMap.get(key) ?? { pct: 0, generationMWh: 0 };
    mergedMixMap.set(key, {
      pct: prev.pct + s.pct,
      generationMWh: prev.generationMWh + s.generationMWh,
    });
  }
  const mergedMix = Array.from(mergedMixMap.entries())
    .map(([source, v]) => ({ source, ...v }))
    .sort((a, b) => b.pct - a.pct);

  const legendSources = mergedMix.filter((s) => s.pct >= 2);

  return (
    <div className="flex flex-col gap-5">
      {profile && profile.totalCapacityMW > 0 && (
        <div>
          <div className="text-2xl font-semibold text-ink tracking-tight">
            {formatCapacity(profile.totalCapacityMW)}
          </div>
          <div className="text-[11px] text-muted mt-0.5">
            Summer generating capacity{profile.year ? ` · ${profile.year}` : ""}
          </div>
        </div>
      )}

      {profile && profile.energyMix.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold tracking-tight text-muted mb-2">
            Generation mix
          </div>
          <div
            className="flex w-full h-2 rounded-full overflow-hidden"
            role="img"
            aria-label="Energy generation mix"
          >
            {mergedMix.map((source) => (
              <div
                key={source.source}
                style={{
                  width: `${source.pct}%`,
                  backgroundColor:
                    FUEL_COLOR[source.source] ?? FUEL_COLOR.other,
                }}
                title={`${FUEL_LABEL[source.source] ?? source.source}: ${source.pct.toFixed(1)}%`}
              />
            ))}
          </div>
          {legendSources.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {legendSources.map((source) => (
                <div
                  key={source.source}
                  className="flex items-center gap-2 text-[11px] text-ink"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        FUEL_COLOR[source.source] ?? FUEL_COLOR.other,
                    }}
                  />
                  <span className="flex-1 truncate text-muted">
                    {FUEL_LABEL[source.source] ?? source.source}
                  </span>
                  <span className="tabular-nums text-ink/80">
                    {source.pct.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {plants.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[11px] font-semibold tracking-tight text-muted">
              Largest power plants
            </div>
            <span className="text-[11px] text-muted/70">
              {plants.length} {plants.length === 1 ? "plant" : "plants"} · ≥ 50 MW
            </span>
          </div>
          <div className="flex flex-col">
            {topPlants.map((plant) => {
              const color = FUEL_COLOR[plant.fuelType] ?? FUEL_COLOR.other;
              return (
                <div
                  key={plant.id}
                  className="flex items-start gap-2.5 py-2 px-2 -mx-2"
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[7px]"
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-ink tracking-tight truncate">
                      {plant.name}
                    </span>
                    <span className="block text-[11px] text-muted truncate">
                      {FUEL_LABEL[plant.fuelType]} · {formatCapacity(plant.capacityMW)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
