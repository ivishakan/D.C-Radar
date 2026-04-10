# AI Policy Tracker

Interactive atlas of AI and data center policy across world, regional, and US state governments. Built with Next.js 16, TypeScript, Tailwind CSS v4, `react-simple-maps`, and `d3-geo`.

The map has three drill-down layers:

1. **World** — click NA / EU / Asia regions to drill or open the bloc panel
2. **North America** — click Canada, US, or Mexico to see federal info; the US drills further
3. **US States** — click any state to see state-level legislation and key figures

All data is hardcoded placeholder content (`lib/placeholder-data.ts`); there is no database.

## Quickstart

```bash
npm install --legacy-peer-deps
npm run dev
```

Then open http://localhost:3000.

`--legacy-peer-deps` is required because `react-simple-maps` declares React 18 as its peer dependency, while Next 16 ships React 19. The library works correctly with React 19 — only the peer-dep metadata is stale.
