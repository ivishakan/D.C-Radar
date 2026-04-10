"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from "react-simple-maps";
import type { StanceType } from "@/types";
import { usProjection } from "@/lib/projections";

const usProj = usProjection as unknown as ProjectionFunction;
import { getEntity } from "@/lib/placeholder-data";

interface USStatesMapProps {
  onSelectEntity: (geoId: string) => void;
  selectedGeoId: string | null;
}

const STATES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

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

export default function USStatesMap({
  onSelectEntity,
  selectedGeoId,
}: USStatesMapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  return (
    <div
      className="relative w-full h-full"
      onMouseMove={(e) => {
        if (tooltip) setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
      }}
      onMouseLeave={() => {
        setTooltip(null);
        setHoveredName(null);
      }}
    >
      <ComposableMap
        width={960}
        height={600}
        projection={usProj}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={STATES_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.name as string;
              const ent = getEntity(name, "us");
              const fill = ent ? stanceColor(ent.stance) : "#E0DBD3";
              const isSelected = selectedGeoId === name;
              const isHovered = hoveredName === name;

              const commonStyle = {
                fill,
                stroke: isSelected ? "#2C2825" : "#C9C3BB",
                strokeWidth: isSelected ? 1.5 : 0.5,
                outline: "none",
                cursor: "pointer",
                filter: isHovered ? "brightness(0.92)" : undefined,
              };

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => {
                    setHoveredName(name);
                    setTooltip({ x: e.clientX, y: e.clientY, label: name });
                  }}
                  onMouseLeave={() => {
                    setHoveredName(null);
                    setTooltip(null);
                  }}
                  onClick={() => onSelectEntity(name)}
                  style={{
                    default: commonStyle,
                    hover: { ...commonStyle, filter: "brightness(0.92)" },
                    pressed: commonStyle,
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
