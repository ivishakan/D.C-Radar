import type { Entity, Layer } from "@/types";

export const ENTITIES: Entity[] = [
  // ─────────── LAYER 1 — World ───────────
  {
    id: "eu-bloc",
    geoId: "eu",
    name: "European Union",
    level: "bloc",
    layer: "world",
    stance: "favorable",
    contextBlurb:
      "The EU AI Act represents the world's first comprehensive legal framework for artificial intelligence, establishing risk-based requirements for AI systems and strict limits on data center energy consumption.",
    legislation: [
      {
        id: "eu-ai-act",
        billCode: "Reg. 2024/1689",
        title: "Artificial Intelligence Act",
        summary:
          "Risk-based regulation prohibiting unacceptable AI uses, requiring conformity assessments for high-risk systems, and transparency obligations for general-purpose AI models.",
        stage: "Enacted",
        tags: ["AI", "risk-tier", "GPAI"],
      },
      {
        id: "eu-edd",
        billCode: "Dir. 2023/1791",
        title: "Energy Efficiency Directive (recast)",
        summary:
          "Mandatory reporting and efficiency standards for data centers above 500 kW, including PUE disclosure and waste-heat reuse requirements.",
        stage: "Enacted",
        tags: ["data centers", "energy", "reporting"],
      },
    ],
    keyFigures: [
      {
        id: "eu-vestager",
        name: "Margrethe Vestager",
        role: "Former EVP, Digital Age",
        party: "ALDE",
        stance: "favorable",
        quote:
          "Trustworthy AI requires guardrails — not after harm is done, but before products reach the market.",
      },
      {
        id: "eu-breton",
        name: "Thierry Breton",
        role: "Former Commissioner, Internal Market",
        party: "Renaissance",
        stance: "favorable",
      },
    ],
    news: [
      {
        id: "eu-news-1",
        headline: "EU AI Office issues first guidance on general-purpose models",
        source: "Politico EU",
        date: "2026-03-12",
        url: "#",
      },
      {
        id: "eu-news-2",
        headline: "Member states diverge on data center reporting deadlines",
        source: "Euractiv",
        date: "2026-02-28",
        url: "#",
      },
    ],
  },
  {
    id: "asia-region",
    geoId: "asia",
    name: "Asia",
    level: "bloc",
    layer: "world",
    stance: "review",
    contextBlurb:
      "AI governance across Asia varies widely. China maintains strict sovereign data requirements while Japan and South Korea pursue innovation-first frameworks with emerging environmental standards.",
    legislation: [
      {
        id: "cn-genai",
        billCode: "CAC 2023-07",
        title: "Interim Measures for Generative AI Services",
        summary:
          "Requires security assessments, content labeling, and licensed providers for public-facing generative AI services in China.",
        stage: "Enacted",
        tags: ["China", "GenAI", "licensing"],
      },
      {
        id: "kr-ai-bf",
        billCode: "Bill 2206128",
        title: "AI Basic Act",
        summary:
          "Korean framework establishing high-impact AI categories, sandbox provisions, and a national AI safety institute.",
        stage: "Enacted",
        tags: ["Korea", "framework"],
      },
    ],
    keyFigures: [],
    news: [
      {
        id: "asia-news-1",
        headline: "Japan METI updates voluntary AI guidelines for foundation models",
        source: "Nikkei Asia",
        date: "2026-03-22",
        url: "#",
      },
      {
        id: "asia-news-2",
        headline: "Singapore IMDA opens consultation on data center water use",
        source: "The Straits Times",
        date: "2026-03-04",
        url: "#",
      },
    ],
  },

  // ─────────── LAYER 2 — North America ───────────
  {
    id: "us-federal",
    geoId: "840",
    name: "United States",
    level: "federal",
    layer: "na",
    stance: "review",
    canDrillDown: true,
    contextBlurb:
      "US federal AI and data center policy remains fragmented across agencies. No comprehensive national framework exists. The DOE, EPA, and FERC each regulate different aspects with overlapping and sometimes conflicting priorities.",
    legislation: [
      {
        id: "hr-9482",
        billCode: "H.R. 9482",
        title: "Federal Artificial Intelligence Risk Management Act",
        summary:
          "Directs NIST to operationalize the AI Risk Management Framework across federal agencies and procurement.",
        stage: "Committee",
        tags: ["AI", "NIST", "procurement"],
      },
      {
        id: "s-1304",
        billCode: "S. 1304",
        title: "Clean Energy for Data Centers Act",
        summary:
          "Establishes federal grants for renewable-powered data center retrofits and PUE benchmarks for federally leased facilities.",
        stage: "Floor",
        tags: ["data centers", "energy"],
      },
      {
        id: "hr-7213",
        billCode: "H.R. 7213",
        title: "AI Disclosure and Accountability Act",
        summary:
          "Requires disclosure when consumers interact with generative AI systems and mandates dataset provenance reporting.",
        stage: "Filed",
        tags: ["AI", "disclosure"],
      },
    ],
    keyFigures: [
      {
        id: "us-schumer",
        name: "Chuck Schumer",
        role: "Senate Majority Leader",
        party: "D-NY",
        stance: "review",
        quote:
          "Congress must act on AI — but we have to get the guardrails right without smothering innovation.",
      },
      {
        id: "us-cruz",
        name: "Ted Cruz",
        role: "Ranking Member, Commerce Committee",
        party: "R-TX",
        stance: "concerning",
      },
      {
        id: "us-klobuchar",
        name: "Amy Klobuchar",
        role: "Senator",
        party: "D-MN",
        stance: "favorable",
      },
    ],
    news: [
      {
        id: "us-news-1",
        headline: "FERC opens inquiry into co-located data center load",
        source: "Reuters",
        date: "2026-03-30",
        url: "#",
      },
      {
        id: "us-news-2",
        headline: "White House AI council pushes interagency efficiency standards",
        source: "The Washington Post",
        date: "2026-03-18",
        url: "#",
      },
    ],
  },
  {
    id: "canada-federal",
    geoId: "124",
    name: "Canada",
    level: "federal",
    layer: "na",
    stance: "favorable",
    contextBlurb:
      "Canada's proposed Artificial Intelligence and Data Act (AIDA) takes a risk-based approach to AI regulation with strong provincial consultation requirements.",
    legislation: [
      {
        id: "c-27",
        billCode: "C-27",
        title: "Digital Charter Implementation Act (AIDA)",
        summary:
          "Companion legislation creating obligations for high-impact AI systems and establishing an AI and Data Commissioner.",
        stage: "Committee",
        tags: ["AIDA", "AI", "privacy"],
      },
      {
        id: "c-72",
        billCode: "C-72",
        title: "Data Centre Sustainability Reporting Act",
        summary:
          "Requires federally regulated data center operators to report energy mix, water draw, and grid impact annually.",
        stage: "Filed",
        tags: ["data centers", "reporting"],
      },
    ],
    keyFigures: [
      {
        id: "ca-champagne",
        name: "François-Philippe Champagne",
        role: "Minister of Innovation, Science and Industry",
        party: "Liberal",
        stance: "favorable",
        quote:
          "We can lead on responsible AI while keeping Canada the best place to build AI companies.",
      },
      {
        id: "ca-rempel",
        name: "Michelle Rempel Garner",
        role: "MP, Industry Critic",
        party: "Conservative",
        stance: "review",
      },
    ],
    news: [
      {
        id: "ca-news-1",
        headline: "INDU committee holds final AIDA hearings ahead of report stage",
        source: "The Globe and Mail",
        date: "2026-03-25",
        url: "#",
      },
      {
        id: "ca-news-2",
        headline: "Quebec, Alberta press Ottawa on provincial AI carve-outs",
        source: "CBC News",
        date: "2026-03-08",
        url: "#",
      },
    ],
  },
  {
    id: "mexico-federal",
    geoId: "484",
    name: "Mexico",
    level: "federal",
    layer: "na",
    stance: "none",
    contextBlurb:
      "Mexico has no comprehensive AI or data center legislation at the federal level. The Federal Telecommunications Institute has begun preliminary review.",
    legislation: [
      {
        id: "mx-ift-2025",
        billCode: "IFT/2025-04",
        title: "Preliminary Inquiry on AI Service Providers",
        summary:
          "IFT consultation gathering public comment on potential regulatory scope for foundation model providers operating in Mexico.",
        stage: "Filed",
        tags: ["consultation", "AI"],
      },
    ],
    keyFigures: [],
    news: [
      {
        id: "mx-news-1",
        headline: "IFT extends comment period on AI provider inquiry",
        source: "El Universal",
        date: "2026-03-15",
        url: "#",
      },
    ],
  },

  // ─────────── LAYER 3 — US States ───────────
  {
    id: "virginia",
    geoId: "Virginia",
    name: "Virginia",
    level: "state",
    layer: "us",
    stance: "review",
    contextBlurb:
      "Virginia hosts over 35% of global internet traffic through its Northern Virginia data center corridor. HB 1515 proposes a moratorium while HB 2084 enacted a rate classification review.",
    legislation: [
      {
        id: "va-hb1515",
        billCode: "HB 1515",
        title: "Data Center Development Moratorium",
        summary:
          "Imposes a one-year moratorium on data center special-use permits in counties exceeding 5 GW of approved load.",
        stage: "Carried Over",
        tags: ["moratorium", "land use"],
      },
      {
        id: "va-hb2084",
        billCode: "HB 2084",
        title: "Data Center Rate Classification Review",
        summary:
          "Directs the State Corporation Commission to evaluate a separate retail rate class for hyperscale data center customers.",
        stage: "Enacted",
        tags: ["rates", "SCC"],
      },
    ],
    keyFigures: [
      {
        id: "va-subramanyam",
        name: "Suhas Subramanyam",
        role: "Delegate, HD-32",
        party: "D",
        stance: "review",
        quote:
          "Loudoun County families shouldn't subsidize the grid build-out for the largest server farms on Earth.",
      },
      {
        id: "va-reid",
        name: "David Reid",
        role: "Delegate, HD-28",
        party: "D",
        stance: "favorable",
      },
    ],
    news: [
      {
        id: "va-news-1",
        headline: "Loudoun supervisors freeze new data center rezonings",
        source: "Washington Business Journal",
        date: "2026-03-26",
        url: "#",
      },
      {
        id: "va-news-2",
        headline: "Dominion Energy files revised data center tariff with SCC",
        source: "Richmond Times-Dispatch",
        date: "2026-03-11",
        url: "#",
      },
    ],
  },
  {
    id: "texas",
    geoId: "Texas",
    name: "Texas",
    level: "state",
    layer: "us",
    stance: "concerning",
    contextBlurb:
      "Texas offers aggressive tax incentives for data center development with limited environmental safeguards. Water usage in drought-prone regions is a growing concern.",
    legislation: [
      {
        id: "tx-sb1308",
        billCode: "SB 1308",
        title: "Data Center Sales Tax Exemption Extension",
        summary:
          "Extends qualified data center sales-and-use tax exemptions through 2035 with reduced job creation thresholds.",
        stage: "Enacted",
        tags: ["tax", "incentives"],
      },
      {
        id: "tx-hb4422",
        billCode: "HB 4422",
        title: "Large Load Interconnection Standards Act",
        summary:
          "Establishes ERCOT interconnection rules for loads exceeding 75 MW, including curtailment obligations during scarcity events.",
        stage: "Floor",
        tags: ["ERCOT", "grid"],
      },
    ],
    keyFigures: [
      {
        id: "tx-king",
        name: "Phil King",
        role: "State Senator, SD-10",
        party: "R",
        stance: "concerning",
        quote:
          "Texas welcomes the data center boom — government should clear the path, not slow it down.",
      },
      {
        id: "tx-johnson",
        name: "Ann Johnson",
        role: "State Rep, HD-134",
        party: "D",
        stance: "review",
      },
    ],
    news: [
      {
        id: "tx-news-1",
        headline: "ERCOT warns of 152 GW long-term load forecast driven by AI",
        source: "Dallas Morning News",
        date: "2026-03-29",
        url: "#",
      },
      {
        id: "tx-news-2",
        headline: "West Texas counties weigh moratoriums amid water concerns",
        source: "Texas Tribune",
        date: "2026-03-14",
        url: "#",
      },
    ],
  },
  {
    id: "california",
    geoId: "California",
    name: "California",
    level: "state",
    layer: "us",
    stance: "favorable",
    contextBlurb:
      "California has enacted strong data center efficiency standards requiring renewable energy commitments and community benefit agreements for new developments.",
    legislation: [
      {
        id: "ca-sb253",
        billCode: "SB 253",
        title: "Climate Corporate Data Accountability Act",
        summary:
          "Requires large operators to disclose Scope 1, 2, and 3 emissions, including data center energy and embodied carbon.",
        stage: "Enacted",
        tags: ["disclosure", "emissions"],
      },
      {
        id: "ca-ab2013",
        billCode: "AB 2013",
        title: "Generative AI Training Data Transparency Act",
        summary:
          "Requires developers of generative AI to publish high-level summaries of datasets used to train consumer-facing models.",
        stage: "Enacted",
        tags: ["AI", "transparency"],
      },
    ],
    keyFigures: [
      {
        id: "ca-wiener",
        name: "Scott Wiener",
        role: "State Senator, SD-11",
        party: "D",
        stance: "favorable",
        quote:
          "California has always led on tech accountability, and AI is no exception.",
      },
      {
        id: "ca-irwin",
        name: "Jacqui Irwin",
        role: "Assemblymember, AD-42",
        party: "D",
        stance: "favorable",
      },
    ],
    news: [
      {
        id: "ca-news-1",
        headline: "CARB finalizes data center reporting rule under SB 253",
        source: "Los Angeles Times",
        date: "2026-03-21",
        url: "#",
      },
      {
        id: "ca-news-2",
        headline: "Newsom signs follow-on AI watermark bill",
        source: "CalMatters",
        date: "2026-03-03",
        url: "#",
      },
    ],
  },
  {
    id: "oregon",
    geoId: "Oregon",
    name: "Oregon",
    level: "state",
    layer: "us",
    stance: "restrictive",
    contextBlurb:
      "Oregon passed a moratorium on large-scale data center development near protected watershed areas following community opposition in the Columbia River Gorge.",
    legislation: [
      {
        id: "or-hb2816",
        billCode: "HB 2816",
        title: "Critical Watershed Data Center Moratorium",
        summary:
          "Prohibits new data center siting within designated critical watershed areas through 2030.",
        stage: "Enacted",
        tags: ["moratorium", "water"],
      },
      {
        id: "or-sb471",
        billCode: "SB 471",
        title: "Data Center Energy Source Disclosure",
        summary:
          "Requires annual public reporting of energy mix and water consumption for facilities above 10 MW.",
        stage: "Enacted",
        tags: ["disclosure", "water"],
      },
    ],
    keyFigures: [],
    news: [
      {
        id: "or-news-1",
        headline: "The Dalles weighs second moratorium on hyperscale projects",
        source: "Oregon Public Broadcasting",
        date: "2026-03-19",
        url: "#",
      },
      {
        id: "or-news-2",
        headline: "PGE forecasts 8 GW data center load by 2030",
        source: "The Oregonian",
        date: "2026-03-06",
        url: "#",
      },
    ],
  },
  {
    id: "new-york",
    geoId: "New York",
    name: "New York",
    level: "state",
    layer: "us",
    stance: "review",
    contextBlurb:
      "New York is actively reviewing data center energy demands amid grid strain concerns, particularly in regions dependent on fossil fuel peaker plants.",
    legislation: [
      {
        id: "ny-a8884",
        billCode: "A. 8884",
        title: "Data Center Grid Impact Study Act",
        summary:
          "Directs NYSERDA and the PSC to jointly study the grid impact of large data center loads in upstate New York.",
        stage: "Committee",
        tags: ["study", "grid"],
      },
      {
        id: "ny-s7422",
        billCode: "S. 7422",
        title: "Peaker Plant Replacement and Data Center Siting Act",
        summary:
          "Conditions data center siting approvals on co-investment in peaker plant retirement and storage replacement.",
        stage: "Filed",
        tags: ["peaker", "siting"],
      },
    ],
    keyFigures: [],
    news: [
      {
        id: "ny-news-1",
        headline: "PSC opens proceeding on large-load tariff design",
        source: "Albany Times Union",
        date: "2026-03-24",
        url: "#",
      },
      {
        id: "ny-news-2",
        headline: "Hochul administration mulls data center moratorium near peakers",
        source: "Politico New York",
        date: "2026-03-09",
        url: "#",
      },
    ],
  },
];

export function getEntity(geoId: string, layer: Layer): Entity | null {
  return (
    ENTITIES.find((e) => e.geoId === geoId && e.layer === layer) ?? null
  );
}

export function getEntitiesByLayer(layer: Layer): Entity[] {
  return ENTITIES.filter((e) => e.layer === layer);
}
