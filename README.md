# 2026 Midterms Tracker

An interactive map and scenario-builder for the 2026 US House and Senate races, inspired by 270toWin. Built to run on a $0/month budget: static React app on Netlify, no backend, no paid data APIs.

**Live:** https://midterm-tracker-2026-jm.netlify.app/

## Status

House map renders real 119th Congress district boundaries (Census cartographic boundary file); Senate map is state-level. Both have a working click-to-flip scenario builder with a live seat-count tally, and hovering a district or state shows its rating, real candidate names with real FEC fundraising totals, and (Senate map) statewide presidential approval where polled. Below the tallies, two NYT/270toWin-style needles show House and Senate control — a transparent, deterministic read of the same seat-rating data (no invented win probabilities). The Senate tally tracks full 100-seat chamber control — the 65 seats not up in 2026 at their real current party, plus the 35 contested races. All race/lean data is real, no placeholders: all 435 House districts carry real Cook PVI, ~150 competitive ones also carry a real multi-rater consensus rating, all 35 2026 Senate races carry real ratings, 435 House districts and 34 of 35 Senate races have real candidate names (95%/98% of those also have real fundraising totals), 17 states have real presidential approval polling, and generic ballot/national approval/inflation/unemployment all come from live sources. See [CLAUDE.md](./CLAUDE.md) for the full build roadmap, data-source details, and the redistricting-currency caveat.

## Getting started

```bash
npm install
npm run dev
```

## Refreshing data

```bash
npm run fetch-data
```

Pulls race ratings, candidate names, and polling averages from Wikipedia, inflation/unemployment from FRED, and candidate fundraising totals from the FEC — writes to `src/data/generated/*.json`. A GitHub Action runs this weekly and auto-commits changes (see `.github/workflows/update-data.yml`), which triggers a Netlify redeploy.

The fundraising fetcher needs a free FEC API key (`FEC_API_KEY`) — get one instantly at [api.data.gov/signup](https://api.data.gov/signup/), no approval wait. It's set as a GitHub Actions repo secret for CI; set it as a local env var to run `fetch-fundraising.mjs` yourself, or just skip it — every other fetcher runs fine without it.

## Stack

React + TypeScript + Vite + Tailwind, mapping via `react-simple-maps`/`d3-geo`/`topojson-client`, deployed to Netlify.
