# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

An interactive US midterm-elections tracker: district/state maps colored by partisan lean and race ratings, a 270toWin-style scenario builder (click a seat to flip its projected winner and watch the seat count recompute), and small widgets for generic ballot, presidential approval, inflation, and unemployment. Personal project, meant to be shareable via a public link, built to run at $0/month.

## Stack

React + TypeScript + Vite + Tailwind. Mapping via `react-simple-maps` (wraps `d3-geo`/`topojson-client`). Deployed to Netlify's free tier.

**Map projection gotcha:** `us-atlas` ships both unprojected (`states-10m.json`) and pre-projected (`states-albers-10m.json`) topology. `ComposableMap projection="geoAlbersUsa"` expects the *unprojected* file — feeding it the pre-projected one double-projects coordinates and renders garbage (hit this once already; see git history).

## Current state (scaffold)

- **House map is district-level**, using real 119th Congress (2025-2027) boundaries from the Census Bureau's cartographic boundary file `cb_2024_us_cd119_20m`, converted to TopoJSON via `mapshaper` and filtered to the 435 voting districts (DC/PR non-voting seats dropped). File: `src/data/congressional-districts-119.json`, parsed in `src/data/districtTopology.ts`.
  - **Redistricting-currency caveat:** several states redrew congressional maps mid-decade in 2025 (litigation-driven, e.g. TX/MO/NC/OH/CA and others). This snapshot reflects what Census had on file when `cb_2024_us_cd119_20m` was published. Before relying on this for real 2026 race calls, verify against a currently-maintained source (Dave's Redistricting App is actively updated for exactly this kind of mid-decade change) and re-run the conversion pipeline below if boundaries have moved. Don't hand-patch specific states from memory — verify against a live source first.
  - To refresh: download the current `cb_YYYY_us_cd119_20m.zip` from `https://www2.census.gov/geo/tiger/GENZYYYY/shp/`, then `mapshaper -i <shp> -filter 'STATEFP!="11" && STATEFP!="72"' -filter-fields STATEFP,CD119FP,GEOID -o format=topojson congressional-districts-119.json`, drop into `src/data/`.
- Senate map stays state-level (`src/components/map/USMap.tsx`) — correct, since Senate seats are per-state.
- `src/data/districtRaceData.ts` and `src/data/stateRaceData.ts` have **placeholder `partisanLean` values only** — hand-typed state baselines, with per-district values being the state baseline plus a deterministic fake jitter so districts visually vary. None of this is sourced from a real rating service; treat every color on the map as fake until phase 2 lands.
- `houseSeats` per state and `TOTAL_HOUSE_DISTRICTS` (435) are derived from the real district topology, not hand-typed — so they'll self-correct if the topology file is refreshed.
- Scenario builder: House view flips individual districts, Senate view flips individual states; both recompute their seat tally live. Toggle "Scenario mode" to enable clicking.
- Widgets (`IndicatorWidgets.tsx`) are static placeholder cards, not wired to any data source yet.

## Build roadmap

1. ~~District-level House map~~ — done (see above).
2. **Data pipeline** — a weekly GitHub Action (same shape as `~/legislation-tracker`'s Congress.gov poller) that scrapes/curates:
   - Race ratings from Cook Political Report / Sabato's Crystal Ball / Inside Elections / 270toWin public pages. **Check each site's robots.txt/ToS before automating** — this is the one part of the pipeline with real legal-gray-area risk since it's non-official data.
   - Partisan lean baseline from Dave's Redistricting App (freely reusable, changes rarely, and is the best currently-maintained source for verifying district boundaries too — see caveat above).
   - Generic ballot + presidential approval from a public polling aggregator.
   - Inflation (CPI) and unemployment (UNRATE) from the FRED API — free, official, no scraping needed.
   The action commits updated JSON to the repo, which triggers a Netlify rebuild. No server, no database.
3. **Scenario builder polish** — encode scenario state in the URL (shareable links, 270toWin-style).
4. **Indicator widgets** — wire `IndicatorWidgets.tsx` to real data with small trend charts (sparklines) instead of static numbers.
5. **Polish** — mobile layout, legend, zoom/pan for dense urban districts, dark mode (Tailwind `darkMode: 'media'` already configured), an About/Methodology page crediting every data source (important once this is a public link).

## Maintenance model

Weekly scrape runs unattended via GitHub Actions. Manual work is limited to: noticing if a scraper silently breaks (source site changed its markup), double-checking marquee races near election day since a weekly cadence lags fast-moving calls, and periodically re-verifying district boundaries in any state under active redistricting litigation.
