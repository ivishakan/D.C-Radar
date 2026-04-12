"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { NEUTRAL_FILL, NEUTRAL_STROKE, type SetTooltip } from "@/lib/map-utils";
import {
  getMunicipalitiesByState,
  getMunicipalityByFips,
} from "@/lib/municipal-data";
import { STATE_FIPS, type DataCenter, type MunicipalActionStatus } from "@/types";
import { US_FACILITIES } from "@/lib/datacenters";
import { DcDot } from "./DataCenterDots";

interface CountyMapProps {
  stateName: string;
  onSelectCounty: (fips: string) => void;
  selectedCountyFips: string | null;
  setTooltip: SetTooltip;
  showDataCenters?: boolean;
  onHoverFacility?: (
    dc: DataCenter,
    x: number,
    y: number,
    clusterSize: number,
  ) => void;
  onLeaveFacility?: () => void;
  onSelectFacility?: (dc: DataCenter) => void;
}

const COUNTIES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

type CountyFeature = Feature<Geometry, { name?: string }>;
type CountyCollection = FeatureCollection<Geometry, { name?: string }>;

// Module-level cache so multiple mounts share one fetch.
let countiesPromise: Promise<CountyCollection> | null = null;
let statesPromise: Promise<CountyCollection> | null = null;

function loadCounties(): Promise<CountyCollection> {
  if (!countiesPromise) {
    countiesPromise = fetch(COUNTIES_URL)
      .then((r) => r.json())
      .then((topo: Topology) => {
        const counties = feature(
          topo,
          topo.objects.counties as GeometryCollection,
        ) as unknown as CountyCollection;
        return counties;
      });
  }
  return countiesPromise;
}

function loadStates(): Promise<CountyCollection> {
  if (!statesPromise) {
    statesPromise = fetch(STATES_URL)
      .then((r) => r.json())
      .then((topo: Topology) => {
        const states = feature(
          topo,
          topo.objects.states as GeometryCollection,
        ) as unknown as CountyCollection;
        return states;
      });
  }
  return statesPromise;
}

function statusFill(status: MunicipalActionStatus | null): string {
  if (status === "enacted") return "var(--color-stance-restrictive)";
  if (status === "under-review") return "var(--color-stance-concerning)";
  if (status === "proposed") return "var(--color-stance-review)";
  if (status === "failed") return "var(--color-stance-none)";
  return NEUTRAL_FILL;
}

function dominantStatus(
  statuses: MunicipalActionStatus[],
): MunicipalActionStatus | null {
  const order: MunicipalActionStatus[] = [
    "enacted",
    "under-review",
    "proposed",
    "failed",
  ];
  for (const s of order) {
    if (statuses.includes(s)) return s;
  }
  return null;
}

const VIEWBOX_W = 960;
const VIEWBOX_H = 600;
// Inset so the state doesn't touch the edges.
const INSET = 56;

export default function CountyMap({
  stateName,
  onSelectCounty,
  selectedCountyFips,
  setTooltip,
  showDataCenters = false,
  onHoverFacility,
  onLeaveFacility,
  onSelectFacility,
}: CountyMapProps) {
  const statePrefix = STATE_FIPS[stateName];
  const [counties, setCounties] = useState<CountyCollection | null>(null);
  const [states, setStates] = useState<CountyCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCounties().then((c) => {
      if (!cancelled) setCounties(c);
    });
    loadStates().then((s) => {
      if (!cancelled) setStates(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive the state's county features + a per-state zoomed projection.
  // Same base projection as usProjection so the US-wide → state zoom lines up.
  const {
    stateFeatures,
    stateOutline,
    zoomedPaths,
    countryPaths,
    countyScreen,
    bbox,
  } = useMemo(() => {
    if (!counties || !statePrefix) {
      return {
        stateFeatures: [] as CountyFeature[],
        stateOutline: null as Feature | null,
        zoomedPaths: [] as string[],
        countryPaths: [] as string[],
        countyScreen: [] as Array<{ fips: string; name: string; cx: number; cy: number }>,
        bbox: null as [[number, number], [number, number]] | null,
      };
    }
    const filtered = counties.features.filter((f) =>
      String(f.id).startsWith(statePrefix),
    );
    const stateFeatureEl =
      states?.features.find((f) => String(f.id) === statePrefix) ?? null;

    // Fresh projection per state so we can fitExtent cleanly.
    const projection = geoAlbersUsa();
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: filtered,
    };
    projection.fitExtent(
      [
        [INSET, INSET],
        [VIEWBOX_W - INSET, VIEWBOX_H - INSET],
      ],
      collection,
    );
    const path = geoPath(projection);
    const paths = filtered.map((f) => path(f) ?? "");

    const nationalPaths = stateFeatureEl ? [path(stateFeatureEl) ?? ""] : [];

    // Centroids for click-target expansion
    const screen = filtered.map((f) => {
      const [cx, cy] = path.centroid(f);
      return {
        fips: String(f.id).padStart(5, "0"),
        name: (f.properties as { name?: string })?.name ?? "",
        cx,
        cy,
      };
    });

    // Also compute the state's bbox in US-wide projection space
    // for the zoom-in animation starting point.
    const usProj = geoAlbersUsa().scale(900).translate([480, 300]);
    const usPath = geoPath(usProj);
    const b =
      stateFeatureEl !== null
        ? (usPath.bounds(stateFeatureEl) as [[number, number], [number, number]])
        : null;

    return {
      stateFeatures: filtered,
      stateOutline: stateFeatureEl as Feature | null,
      zoomedPaths: paths,
      countryPaths: nationalPaths,
      countyScreen: screen,
      bbox: b,
    };
  }, [counties, states, statePrefix]);

  void stateFeatures;
  void stateOutline;
  void countyScreen;

  // Transform-based zoom animation.
  // At mount: start from the small "US-wide" rect the state would occupy,
  // then slide to identity (which, because our projection is already
  // fit-to-state, means "full viewbox").
  const [animateReady, setAnimateReady] = useState(false);
  const firstMountRef = useRef(true);

  useEffect(() => {
    if (zoomedPaths.length === 0) return;
    setAnimateReady(false);
    // Defer one frame so the initial (un-zoomed) transform paints first,
    // then the class change triggers the CSS transition.
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, [stateName, zoomedPaths.length]);

  useEffect(() => {
    firstMountRef.current = false;
  }, []);

  // Compute the "from" transform: scale + translate to move the viewbox
  // so the state's US-wide bbox maps onto the same screen rect that the
  // fitted projection now covers. We zoom from there → identity.
  const fromTransform = useMemo(() => {
    if (!bbox) return "translate(480 300) scale(0.3) translate(-480 -300)";
    const [[x0, y0], [x1, y1]] = bbox;
    const bw = x1 - x0;
    const bh = y1 - y0;
    if (bw <= 0 || bh <= 0)
      return "translate(480 300) scale(0.3) translate(-480 -300)";
    // The state's bbox in US-wide pixels → the fitted viewport rect [INSET, VIEWBOX-INSET].
    // We want an initial transform T such that applying T to the fitted features
    // visually places them where they would be in US-wide space.
    const scale = Math.min(bw / (VIEWBOX_W - 2 * INSET), bh / (VIEWBOX_H - 2 * INSET));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const tx = cx - (VIEWBOX_W / 2) * scale;
    const ty = cy - (VIEWBOX_H / 2) * scale;
    return `translate(${tx} ${ty}) scale(${scale})`;
  }, [bbox]);

  if (!statePrefix) {
    return (
      <div className="flex items-center justify-center text-sm text-muted">
        Counties not available for {stateName}
      </div>
    );
  }

  if (!counties) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-muted">
        Loading counties…
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full"
      onMouseMove={(e) =>
        setTooltip((current) =>
          current ? { ...current, x: e.clientX, y: e.clientY } : current,
        )
      }
      onMouseLeave={() => setTooltip(null)}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%" }}
      >
        <g
          style={{
            transform: animateReady ? "none" : fromTransform,
            transformOrigin: "0 0",
            transition:
              "transform 650ms cubic-bezier(0.32, 0.72, 0, 1), opacity 400ms ease",
            opacity: animateReady ? 1 : 0.85,
          }}
        >
          {/* State silhouette underlay — gives the outer edge a clean cut */}
          {countryPaths.map((d, i) => (
            <path
              key={`outline-${i}`}
              d={d}
              fill={NEUTRAL_FILL}
              stroke={NEUTRAL_STROKE}
              strokeWidth={1.5}
            />
          ))}

          {zoomedPaths.map((d, i) => {
            const f = stateFeatures[i];
            const fips = String(f.id).padStart(5, "0");
            const countyName =
              (f.properties as { name?: string })?.name ?? fips;
            const municipality = getMunicipalityByFips(fips);
            const statuses: MunicipalActionStatus[] =
              municipality?.actions.map((a) => a.status) ?? [];
            const dominant = dominantStatus(statuses);
            const hasData = !!municipality;
            const isSelected = selectedCountyFips === fips;
            const fill = hasData ? statusFill(dominant) : NEUTRAL_FILL;
            const stroke = isSelected ? "#1D1D1F" : NEUTRAL_STROKE;
            const strokeWidth = isSelected ? 2 : 0.5;
            return (
              <path
                key={fips}
                d={d}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                style={{
                  cursor: hasData ? "pointer" : "default",
                  transition:
                    "stroke 200ms, stroke-width 200ms, filter 200ms",
                  filter: isSelected
                    ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                    : undefined,
                  outline: "none",
                }}
                onMouseEnter={(e) =>
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    label: hasData
                      ? `${countyName} — ${municipality!.actions.length} local action${
                          municipality!.actions.length === 1 ? "" : "s"
                        }`
                      : countyName,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
                onClick={() => hasData && onSelectCounty(fips)}
              />
            );
          })}

          {showDataCenters && onHoverFacility && onLeaveFacility && (
            <DataCenterDotsZoomed
              facilities={US_FACILITIES.filter(
                (f) => f.state === stateName,
              )}
              onHoverFacility={onHoverFacility}
              onLeaveFacility={onLeaveFacility}
              onSelectFacility={onSelectFacility}
              projectionFeatures={counties}
              statePrefix={statePrefix}
            />
          )}
        </g>
      </svg>
    </div>
  );
}

/**
 * Data center dots that share the CountyMap's fitted projection.
 * We recompute a projection locally so the dots align with the counties.
 */
function DataCenterDotsZoomed({
  facilities,
  onHoverFacility,
  onLeaveFacility,
  onSelectFacility,
  projectionFeatures,
  statePrefix,
}: {
  facilities: DataCenter[];
  onHoverFacility: (
    dc: DataCenter,
    x: number,
    y: number,
    clusterSize: number,
  ) => void;
  onLeaveFacility: () => void;
  onSelectFacility?: (dc: DataCenter) => void;
  projectionFeatures: CountyCollection;
  statePrefix: string;
}) {
  const points = useMemo(() => {
    const filtered = projectionFeatures.features.filter((f) =>
      String(f.id).startsWith(statePrefix),
    );
    const projection = geoAlbersUsa();
    projection.fitExtent(
      [
        [INSET, INSET],
        [VIEWBOX_W - INSET, VIEWBOX_H - INSET],
      ],
      { type: "FeatureCollection", features: filtered } as FeatureCollection,
    );
    return facilities
      .map((f) => {
        const p = projection([f.lng, f.lat]);
        return p ? { dc: f, x: p[0], y: p[1] } : null;
      })
      .filter(
        (p): p is { dc: DataCenter; x: number; y: number } => Boolean(p),
      );
  }, [facilities, projectionFeatures, statePrefix]);

  return (
    <g>
      {points.map(({ dc, x, y }) => {
        const r = Math.min(
          9,
          Math.max(3.2, Math.log10((dc.capacityMW ?? 30) + 1) * 2.4),
        );
        return (
          <g key={dc.id}>
            <DcDot
              x={x}
              y={y}
              r={r}
              status={dc.status}
              onMouseEnter={(e) => onHoverFacility(dc, e.clientX, e.clientY, 1)}
              onMouseMove={(e) => onHoverFacility(dc, e.clientX, e.clientY, 1)}
              onMouseLeave={() => onLeaveFacility()}
              onClick={
                onSelectFacility ? () => onSelectFacility(dc) : undefined
              }
              interactive={!!onSelectFacility}
            />
          </g>
        );
      })}
    </g>
  );
}
