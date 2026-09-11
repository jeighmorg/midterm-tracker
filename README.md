# 2026 Midterms Tracker

An interactive map and scenario-builder for the 2026 US House and Senate races, inspired by 270toWin. Built to run on a $0/month budget: static React app on Netlify, no backend, no paid data APIs.

## Status

House map renders real 119th Congress district boundaries (Census cartographic boundary file); Senate map is state-level. Both have a working click-to-flip scenario builder with a live seat-count tally. Race ratings, generic ballot, presidential approval, and inflation/unemployment are pulled from real sources by the data pipeline (all 35 2026 Senate races, ~150 competitive House districts, and the two economic indicators); remaining House districts fall back to placeholder lean data until a full-district source is added. See [CLAUDE.md](./CLAUDE.md) for the full build roadmap, data-source details, and the redistricting-currency caveat.

## Getting started

```bash
npm install
npm run dev
```

## Refreshing data

```bash
npm run fetch-data
```

Pulls race ratings from Wikipedia, generic ballot/approval polling averages from Wikipedia, and inflation/unemployment from FRED — writes to `src/data/generated/*.json`. A GitHub Action runs this weekly once the repo is on GitHub (see `.github/workflows/update-data.yml`).

## Stack

React + TypeScript + Vite + Tailwind, mapping via `react-simple-maps`/`d3-geo`/`topojson-client`, deployed to Netlify.
