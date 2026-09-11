# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

An interactive US midterm-elections tracker: district/state maps colored by partisan lean and race ratings, a 270toWin-style scenario builder (click a seat to flip its projected winner and watch the seat count recompute), and small widgets for generic ballot, presidential approval, inflation, and unemployment. Personal project, meant to be shareable via a public link, built to run at $0/month.

## Stack

React + TypeScript + Vite + Tailwind. Mapping via `react-simple-maps` (wraps `d3-geo`/`topojson-client`). Deployed to Netlify's free tier.

**Map projection gotcha:** `us-atlas` ships both unprojected (`states-10m.json`) and pre-projected (`states-albers-10m.json`) topology. `ComposableMap projection="geoAlbersUsa"` expects the *unprojected* file — feeding it the pre-projected one double-projects coordinates and renders garbage (hit this once already; see git history).

## Current state

- **House map is district-level**, using real 119th Congress (2025-2027) boundaries from the Census Bureau's cartographic boundary file `cb_2024_us_cd119_20m`, converted to TopoJSON via `mapshaper` and filtered to the 435 voting districts (DC/PR non-voting seats dropped). File: `src/data/congressional-districts-119.json`, parsed in `src/data/districtTopology.ts`.
  - **Redistricting-currency caveat:** several states redrew congressional maps mid-decade in 2025 (litigation-driven, e.g. TX/MO/NC/OH/CA and others). This snapshot reflects what Census had on file when `cb_2024_us_cd119_20m` was published. Before relying on this for real 2026 race calls, verify against a currently-maintained source (Dave's Redistricting App is actively updated for exactly this kind of mid-decade change) and re-run the conversion pipeline below if boundaries have moved. Don't hand-patch specific states from memory — verify against a live source first.
  - To refresh: download the current `cb_YYYY_us_cd119_20m.zip` from `https://www2.census.gov/geo/tiger/GENZYYYY/shp/`, then `mapshaper -i <shp> -filter 'STATEFP!="11" && STATEFP!="72"' -filter-fields STATEFP,CD119FP,GEOID -o format=topojson congressional-districts-119.json`, drop into `src/data/`.
- Senate map stays state-level (`src/components/map/USMap.tsx`) — correct, since Senate seats are per-state.
- `houseSeats` per state and `TOTAL_HOUSE_DISTRICTS` (435) are derived from the real district topology, not hand-typed — so they'll self-correct if the topology file is refreshed.
- Scenario builder: House view flips individual districts, Senate view flips individual states; both recompute their seat tally live. Toggle "Scenario mode" to enable clicking.

## Data pipeline (phase 2 — implemented)

`scripts/fetch-*.mjs` (run via `npm run fetch-data`, or individually) pull real data and write it to `src/data/generated/*.json`, which the app imports directly at build time. No server, no database, no API keys.

**Source choice: Wikipedia, not the rating sites directly.** The original plan was to scrape Cook Political Report / Sabato / Inside Elections / 270toWin pages individually, which raised real ToS/legal-gray-area questions. Instead, Wikipedia's `2026 United States House of Representatives election ratings` and `2026 United States Senate elections#Predictions` pages already aggregate all of those raters (plus DDHQ, Silver Bulletin, The Economist, etc.) into one cited, wikitext table per race, updated frequently. Same for generic ballot and presidential approval polling averages (`2026 United States House of Representatives elections#Opinion_polling` and `Opinion polling on the second Trump presidency`). Pulling from Wikipedia's MediaWiki API (explicitly designed for programmatic read access, no auth, generous rate limits) is both lower-risk and lower-maintenance than running four+ separate scrapers against sites that weren't built to be scraped.

- `scripts/fetch-house-ratings.mjs` → `generated/house-ratings.json`: parses the House ratings wikitable, computes a consensus rating per district by averaging each rater's `{{USRaceRating}}` into a signed score (R positive) and re-bucketing into our 7-point scale. **Only covers the ~150 districts at least one rater considers competitive** — this is a real, current limitation, not a bug.
- `scripts/fetch-district-pvi.mjs` → `generated/district-pvi.json`: parses the *full* 435-district Cook PVI table from the "Cook Partisan Voting Index" Wikipedia article ("By congressional district" section) — same `{{ushr}}`/`{{Shading PVI}}` templates as the ratings tables, but spelled-out state names instead of USPS codes, so it needs its own extractor (`extractDistrictByStateName`). This closes the full-district gap: `districtRaceData.ts` uses the rater-consensus rating where one exists (competitive seats) and falls back to `ratingFromLean(cookPvi)` for the rest — **every district now has real data, no placeholder/jitter left**. Watch for `{{Shading PVI|R|value=7}}`-style named parameters mixed in with the usual positional `{{Shading PVI|R|7}}` — `extractPvi` in `lib/ratings.mjs` strips a `value=` prefix to handle both.
- `scripts/fetch-senate-ratings.mjs` → `generated/senate-ratings.json`: same approach, but the Senate table lists **every** 2026 race (not just competitive ones), so this has full real coverage — including special elections a hand-typed "Class 2 states" list would miss (this caught FL and OH, which aren't regular Class 2 seats).
- `scripts/fetch-generic-ballot.mjs` / `scripts/fetch-approval.mjs` → `generated/generic-ballot.json` / `generated/approval.json`: parse the pre-computed "Average" row of each polling-aggregator table.
- `scripts/fetch-economic.mjs` → `generated/economic.json`: FRED's public CSV export (`fredgraph.csv?id=...`), no API key needed. Uses `CPIAUCNS` (not seasonally adjusted) for the 12-month CPI change, matching BLS's standard headline inflation figure, and `UNRATE` for unemployment.
- `scripts/lib/wikitext.mjs`'s `cellValue()` is the key parsing trick: wikitable cells are written as `attribute|value` or `{{template}} |value` — the actually-displayed value is reliably whatever comes after the **last** `|` in the cell.
- Parsers skip header/footer rows gracefully (logged as a count, not an error) rather than crashing — wikitext table structure is inherently a little fragile, so failing soft beats a broken build.
- `scripts/lib/wikipedia.mjs` retries 429/5xx with backoff (honoring `Retry-After`), and `fetch-all.mjs` sleeps 1s between tasks — six real Wikipedia calls back-to-back will otherwise trip their rate limiter (hit this once; see git history).

**Refreshing data:** `npm run fetch-data` runs all six fetchers and overwrites `src/data/generated/*.json`. `.github/workflows/update-data.yml` runs this weekly (Mondays 12:00 UTC) via GitHub Actions and commits any changes as `github-actions[bot]`, which triggers a Netlify redeploy. Live at https://github.com/jeighmorg/midterm-tracker, deployed at https://midterm-tracker-2026-jm.netlify.app/ — verified working end-to-end via a manual `workflow_dispatch` run.

## Build roadmap

1. ~~District-level House map~~ — done.
2. ~~Data pipeline~~ — done (see above).
3. ~~Full-district partisan lean~~ — done: all 435 districts have real Cook PVI, competitive ones also have real rater consensus.
4. **Scenario builder polish** — encode scenario state in the URL (shareable links, 270toWin-style).
5. **Indicator widgets** — small trend charts (sparklines) instead of single numbers; both generic-ballot and approval sources actually carry per-aggregator history that could be plotted.
6. **Polish** — mobile layout, legend, zoom/pan for dense urban districts, dark mode (Tailwind `darkMode: 'media'` already configured), an About/Methodology page crediting every data source (important once this is a public link) — Wikipedia's CC BY-SA license means the page should credit it and, ideally, link back to the specific articles pulled from.

## Maintenance model

Weekly fetch runs unattended via GitHub Actions once pushed to GitHub. Manual work is limited to: noticing if a parser silently breaks (Wikipedia table structure changed — the pipeline logs a skipped-row count per run, worth spot-checking after any big edit war on the source pages), double-checking marquee races near election day since a weekly cadence lags fast-moving calls, and periodically re-verifying district boundaries in any state under active redistricting litigation.
