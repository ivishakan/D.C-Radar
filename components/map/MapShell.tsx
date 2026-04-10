"use client";

import { useMemo, useState } from "react";
import type { Layer } from "@/types";
import { getEntity } from "@/lib/placeholder-data";
import SidePanel from "@/components/panel/SidePanel";
import Breadcrumb, { type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import WorldMap from "./WorldMap";
import NorthAmericaMap from "./NorthAmericaMap";
import USStatesMap from "./USStatesMap";

const BREADCRUMBS: Record<Layer, BreadcrumbItem[]> = {
  world: [{ label: "World", layer: "world" }],
  na: [
    { label: "World", layer: "world" },
    { label: "North America", layer: "na" },
  ],
  us: [
    { label: "World", layer: "world" },
    { label: "North America", layer: "na" },
    { label: "United States", layer: "us" },
  ],
};

export default function MapShell() {
  const [layer, setLayer] = useState<Layer>("world");
  const [selectedGeoId, setSelectedGeoId] = useState<string | null>(null);

  const selectedEntity = useMemo(
    () => (selectedGeoId ? getEntity(selectedGeoId, layer) : null),
    [selectedGeoId, layer],
  );

  const handleSelectEntity = (geoId: string) => setSelectedGeoId(geoId);
  const handleDrillDown = (next: Layer) => {
    setLayer(next);
    setSelectedGeoId(null);
  };
  const handleViewStates = () => {
    setLayer("us");
    setSelectedGeoId(null);
  };
  const handleBreadcrumb = (next: Layer) => {
    setLayer(next);
    setSelectedGeoId(null);
  };

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <SidePanel entity={selectedEntity} onViewStates={handleViewStates} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 pb-0">
          <Breadcrumb items={BREADCRUMBS[layer]} onNavigate={handleBreadcrumb} />
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0 p-4">
          {layer === "world" && (
            <WorldMap
              onSelectEntity={handleSelectEntity}
              onDrillDown={handleDrillDown}
              selectedGeoId={selectedGeoId}
            />
          )}
          {layer === "na" && (
            <NorthAmericaMap
              onSelectEntity={handleSelectEntity}
              onDrillDown={handleDrillDown}
              selectedGeoId={selectedGeoId}
            />
          )}
          {layer === "us" && (
            <USStatesMap
              onSelectEntity={handleSelectEntity}
              selectedGeoId={selectedGeoId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
