# 2026 Midterms Tracker

An interactive map and scenario-builder for the 2026 US House and Senate races, inspired by 270toWin. Built to run on a $0/month budget: static React app on Netlify, no backend, no paid data APIs.

## Status

Early scaffold. Currently renders a **state-level** map (not congressional districts yet) colored by placeholder partisan-lean data, with a working click-to-flip scenario builder and seat-count tally. See [CLAUDE.md](./CLAUDE.md) for the full build roadmap and data-source plan.

**All ratings/lean data in this repo right now are illustrative placeholders**, not sourced from any rating service — see `src/data/stateRaceData.ts`.

## Getting started

```bash
npm install
npm run dev
```

## Stack

React + TypeScript + Vite + Tailwind, mapping via `react-simple-maps`/`d3-geo`/`topojson-client`, deployed to Netlify.
