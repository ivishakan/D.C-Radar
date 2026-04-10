"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from "react-simple-maps";
import type { Layer, StanceType } from "@/types";
import { worldProjection } from "@/lib/projections";

// react-simple-maps v3 returns a "function" projection prop as-is and feeds it
// to geoPath(). A d3 projection is callable and has .stream(), so passing the
// projection object directly works at runtime. The type cast satisfies the
// (incorrect) @types/react-simple-maps definition.
const worldProj = worldProjection as unknown as ProjectionFunction;
import { getEntity } from "@/lib/placeholder-data";

interface WorldMapProps {
  onSelectEntity: (geoId: string) => void;
  onDrillDown: (layer: Layer) => void;
  selectedGeoId: string | null;
}

const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const NA_CODES = new Set<number>([840, 124, 484]);
const EU_CODES = new Set<number>([
  40, 56, 100, 191, 196, 203, 208, 233, 246, 250, 276, 300, 348, 372, 380, 428,
  440, 442, 470, 528, 616, 620, 642, 703, 705, 724, 752, 756, 826,
]);
const ASIA_CODES = new Set<number>([
  4, 50, 64, 96, 104, 116, 156, 158, 356, 360, 364, 392, 400, 408, 410, 418,
  458, 462, 496, 524, 586, 608, 626, 702, 704, 764, 792, 860,
]);

type Region = "na" | "eu" | "asia" | null;

const REGION_NAMES: Record<Exclude<Region, null>, string> = {
  na: "North America",
  eu: "European Union",
  asia: "Asia",
};

const REGION_COLOR: Record<Exclude<Region, null>, string> = {
  na: "#C9B89E",
  eu: "#9CC4A8",
  asia: "#D4B889",
};

function regionFor(numId: number): Region {
  if (NA_CODES.has(numId)) return "na";
  if (EU_CODES.has(numId)) return "eu";
  if (ASIA_CODES.has(numId)) return "asia";
  return null;
}

function stanceColor(stance: StanceType): string {
  switch (stance) {
    case "restrictive":
      return "#E07D3C";
    case "review":
      return "#D4A843";
    case "favorable":
      return "#4A9B6F";
    case "concerning":
      return "#C0443A";
    default:
      return "#D9D4CC";
  }
}

export default function WorldMap({
  onSelectEntity,
  onDrillDown,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);

  return (
    <div
      className="relative w-full h-full"
      onMouseMove={(e) => {
        if (tooltip) setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => setTooltip(null)}
    >
      <ComposableMap
        width={960}
        height={560}
        projection={worldProj}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={WORLD_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const numId = parseInt(geo.id, 10);
              const region = regionFor(numId);
              const interactive = region !== null;

              let fill = "#E0DBD3";
              if (interactive && region) {
                // For NA countries, color by federal entity stance if known
                if (region === "na") {
                  const ent = getEntity(String(numId), "na");
                  fill = ent ? stanceColor(ent.stance) : REGION_COLOR.na;
                } else {
                  fill = REGION_COLOR[region];
                }
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    if (!interactive) return;
                    const label =
                      region === "na"
                        ? (geo.properties.name as string) ?? REGION_NAMES.na
                        : REGION_NAMES[region!];
                    setTooltip({ x: e.clientX, y: e.clientY, label });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => {
                    if (!interactive) return;
                    if (region === "na") onDrillDown("na");
                    else if (region === "eu") onSelectEntity("eu");
                    else if (region === "asia") onSelectEntity("asia");
                  }}
                  style={{
                    default: {
                      fill,
                      stroke: "#C9C3BB",
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: interactive ? "pointer" : "default",
                    },
                    hover: {
                      fill,
                      stroke: "#C9C3BB",
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: interactive ? "pointer" : "default",
                      filter: interactive ? "brightness(0.92)" : undefined,
                    },
                    pressed: {
                      fill,
                      stroke: "#C9C3BB",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="fixed bg-ink text-white text-xs px-2 py-1 rounded pointer-events-none z-50"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );
}
