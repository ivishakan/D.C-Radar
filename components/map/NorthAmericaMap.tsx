"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from "react-simple-maps";
import type { Layer, StanceType } from "@/types";
import { naProjection, usPath } from "@/lib/projections";

const naProj = naProjection as unknown as ProjectionFunction;
import { getEntity } from "@/lib/placeholder-data";

interface NorthAmericaMapProps {
  onSelectEntity: (geoId: string) => void;
  onDrillDown: (layer: Layer) => void;
  selectedGeoId: string | null;
}

const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const NA_IDS = new Set(["840", "124", "484"]);

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

export default function NorthAmericaMap({
  onSelectEntity,
  onDrillDown,
  selectedGeoId,
}: NorthAmericaMapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      className="relative w-full h-full"
      onMouseMove={(e) => {
        if (tooltip) setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => {
        setTooltip(null);
        setHoveredId(null);
      }}
    >
      <ComposableMap
        width={960}
        height={600}
        projection={naProj}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={WORLD_URL}>
          {({ geographies }) => {
            const naFeatures = geographies.filter((g) => NA_IDS.has(g.id));
            return naFeatures.map((geo) => {
              const id = geo.id as string;
              const ent = getEntity(id, "na");
              const fill = ent ? stanceColor(ent.stance) : "#E0DBD3";
              const isSelected = selectedGeoId === id;
              const isHovered = hoveredId === id;

              const commonStyle = {
                fill,
                stroke: isSelected ? "#2C2825" : "#C9C3BB",
                strokeWidth: isSelected ? 1.5 : 0.5,
                outline: "none",
                cursor: "pointer",
                filter: isHovered ? "brightness(0.92)" : undefined,
              };

              if (id === "840") {
                // Render US with usProjection so it aligns with USStatesMap.
                const d = usPath(geo) ?? undefined;
                return (
                  <path
                    key={geo.rsmKey ?? id}
                    d={d}
                    style={commonStyle}
                    onMouseEnter={(e) => {
                      setHoveredId(id);
                      setTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        label: "United States",
                      });
                    }}
                    onMouseLeave={() => {
                      setHoveredId(null);
                      setTooltip(null);
                    }}
                    onClick={() => {
                      onSelectEntity("840");
                      onDrillDown("us");
                    }}
                  />
                );
              }

              const label =
                id === "124" ? "Canada" : id === "484" ? "Mexico" : geo.properties.name;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    setHoveredId(id);
                    setTooltip({ x: e.clientX, y: e.clientY, label });
                  }}
                  onMouseLeave={() => {
                    setHoveredId(null);
                    setTooltip(null);
                  }}
                  onClick={() => onSelectEntity(id)}
                  style={{
                    default: commonStyle,
                    hover: { ...commonStyle, filter: "brightness(0.92)" },
                    pressed: commonStyle,
                  }}
                />
              );
            });
          }}
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
