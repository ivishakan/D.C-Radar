import { geoAlbersUsa, geoMercator, geoPath } from "d3-geo";

// Shared by NorthAmericaMap (US outline) and USStatesMap (state shapes).
// Same scale + translate is what makes the US shape align across layers.
export const usProjection = geoAlbersUsa().scale(900).translate([480, 300]);

export const naProjection = geoMercator()
  .center([-96, 56])
  .scale(300)
  .translate([480, 300]);

export const worldProjection = geoMercator().scale(140).translate([480, 280]);

export const usPath = geoPath(usProjection);
export const naPath = geoPath(naProjection);
export const worldPath = geoPath(worldProjection);
