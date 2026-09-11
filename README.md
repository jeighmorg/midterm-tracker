# 2026 Midterms Tracker

An interactive map and scenario-builder for the 2026 US House and Senate races, inspired by 270toWin. Built to run on a $0/month budget: static React app on Netlify, no backend, no paid data APIs.

**Live:** https://midterm-tracker-2026-jm.netlify.app/

## Status

House map renders real 119th Congress district boundaries (Census cartographic boundary file); Senate map is state-level. Both have a working click-to-flip scenario builder with a live seat-count tally, and hovering a district or state shows its rating plus real candidate names. The Senate tally tracks full 100-seat chamber control — the 65 seats not up in 2026 at their real current party, plus the 35 contested races. All race/lean data is real, no placeholders: all 435 House districts carry real Cook PVI, ~150 competitive ones also carry a real multi-rater consensus rating, all 35 2026 Senate races carry real ratings, 435 House districts and 34 of 35 Senate races have real candidate names, and generic ballot/presidential approval/inflation/unemployment all come from live sources. See [CLAUDE.md](./CLAUDE.md) for the full build roadmap, data-source details, and the redistricting-currency caveat.

## Getting started

```bash
npm install
npm run dev
```

## Refreshing data

```bash
npm run fetch-data
```

Pulls race ratings, candidate names, and polling averages from Wikipedia, and inflation/unemployment from FRED — writes to `src/data/generated/*.json`. A GitHub Action runs this weekly and auto-commits changes (see `.github/workflows/update-data.yml`), which triggers a Netlify redeploy.

## Stack

React + TypeScript + Vite + Tailwind, mapping via `react-simple-maps`/`d3-geo`/`topojson-client`, deployed to Netlify.
