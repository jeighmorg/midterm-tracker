# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

An interactive US midterm-elections tracker: district/state maps colored by partisan lean and race ratings, a 270toWin-style scenario builder (click a seat to flip its projected winner and watch the seat count recompute), and small widgets for generic ballot, presidential approval, inflation, and unemployment. Personal project, meant to be shareable via a public link, built to run at $0/month.

## Stack

React + TypeScript + Vite + Tailwind. Mapping via `react-simple-maps` (wraps `d3-geo`/`topojson-client`). Deployed to Netlify's free tier.

**Map projection gotcha:** `us-atlas` ships both unprojected (`states-10m.json`) and pre-projected (`states-albers-10m.json`) topology. `ComposableMap projection="geoAlbersUsa"` expects the *unprojected* file — feeding it the pre-projected one double-projects coordinates and renders garbage (hit this once already; see git history).

## Current state (scaffold)

- Renders all 50 states (not congressional districts) via `us-atlas` TopoJSON.
- `src/data/stateRaceData.ts` has real House-seat counts (2020 apportionment) and real Senate Class 2 up-for-2026 flags, but **placeholder/mock `partisanLean` values** — hand-typed, not sourced from any rating service. Treat any rating/lean shown in the UI as fake until phase 2 lands.
- Scenario builder works at state granularity: toggle "Scenario mode," click a state to cycle its rating through the 7-point scale, tally recomputes live.
- Widgets (`IndicatorWidgets.tsx`) are static placeholder cards, not wired to any data source yet.

## Build roadmap

1. **District-level House map** — replace state polygons with actual congressional district boundaries (current biggest unknown). Candidate source: `unitedstates/districts` on GitHub (public GeoJSON boundaries per Congress, no account needed) or Census TIGER/Line cartographic boundary files run through `mapshaper` to TopoJSON. Filter Senate view to only states with a Class 2 seat up (already modeled correctly at state level).
2. **Data pipeline** — a weekly GitHub Action (same shape as `~/legislation-tracker`'s Congress.gov poller) that scrapes/curates:
   - Race ratings from Cook Political Report / Sabato's Crystal Ball / Inside Elections / 270toWin public pages. **Check each site's robots.txt/ToS before automating** — this is the one part of the pipeline with real legal-gray-area risk since it's non-official data.
   - Partisan lean baseline from Dave's Redistricting App (freely reusable, changes rarely).
   - Generic ballot + presidential approval from a public polling aggregator.
   - Inflation (CPI) and unemployment (UNRATE) from the FRED API — free, official, no scraping needed.
   The action commits updated JSON to the repo, which triggers a Netlify rebuild. No server, no database.
3. **Scenario builder polish** — encode scenario state in the URL (shareable links, 270toWin-style), extend click-to-flip to district granularity.
4. **Indicator widgets** — wire `IndicatorWidgets.tsx` to real data with small trend charts (sparklines) instead of static numbers.
5. **Polish** — mobile layout, legend, dark mode (Tailwind `darkMode: 'media'` already configured), an About/Methodology page crediting every data source (important once this is a public link).

## Maintenance model

Weekly scrape runs unattended via GitHub Actions. Manual work is limited to: noticing if a scraper silently breaks (source site changed its markup) and double-checking marquee races near election day since a weekly cadence lags fast-moving calls.
