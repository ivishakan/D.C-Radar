import type { FuelType } from "@/types";

/** Muted earth-tone palette — designed to read as terrain beside the
 *  stance choropleth and saturated data-center icons, not compete. Oil
 *  and coal share one bucket visually because they're both fossil base
 *  load and keeping them separate left the legend unbalanced. */
export const FUEL_COLOR: Record<FuelType, string> = {
  "natural-gas": "#8E8E93",
  coal: "#636366",
  nuclear: "#AF52DE",
  hydro: "#64D2FF",
  solar: "#FFD60A",
  wind: "#30D158",
  biomass: "#A2845E",
  geothermal: "#FF6961",
  battery: "#BF5AF2",
  oil: "#636366",
  other: "#AEAEB2",
};

export const FUEL_LABEL: Record<FuelType, string> = {
  "natural-gas": "Natural gas",
  coal: "Coal & oil",
  nuclear: "Nuclear",
  hydro: "Hydroelectric",
  solar: "Solar",
  wind: "Wind",
  biomass: "Biomass",
  geothermal: "Geothermal",
  battery: "Battery storage",
  oil: "Coal & oil",
  other: "Other",
};

/** Collapse the oil bucket into coal so mixes and legends render as a
 *  tidy grid. Keeps the raw fuel type on individual plant records. */
export function collapseFuel(ft: FuelType): FuelType {
  return ft === "oil" ? "coal" : ft;
}

export function plantRadius(mw: number): number {
  if (mw >= 1000) return 7;
  if (mw >= 500) return 5;
  if (mw >= 200) return 3.5;
  return 2.5;
}
