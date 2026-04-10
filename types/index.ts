export type Layer = "world" | "na" | "us";

export type Stage =
  | "Filed"
  | "Committee"
  | "Floor"
  | "Enacted"
  | "Carried Over"
  | "Dead";

export type StanceType =
  | "restrictive"
  | "review"
  | "favorable"
  | "concerning"
  | "none";

export type GovLevel = "federal" | "state" | "bloc";

export interface Legislation {
  id: string;
  billCode: string;
  title: string;
  summary: string;
  stage: Stage;
  tags: string[];
  sourceUrl?: string;
}

export interface Legislator {
  id: string;
  name: string;
  role: string;
  party: string;
  stance: StanceType;
  quote?: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  date: string;
  url: string;
}

export interface Entity {
  id: string;
  geoId: string;
  name: string;
  level: GovLevel;
  layer: Layer;
  stance: StanceType;
  contextBlurb: string;
  legislation: Legislation[];
  keyFigures: Legislator[];
  news: NewsItem[];
  canDrillDown?: boolean;
}
