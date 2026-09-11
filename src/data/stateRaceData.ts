import { ratingFromLean, type StateRaceData } from '../types/election'
import { ALL_DISTRICTS } from './districtTopology'

/**
 * Senate-class-up flags are factual (Class 2 seats up in the 2026 midterms).
 * `houseSeats` is derived from the real district topology, not hand-typed.
 *
 * `partisanLean` is ILLUSTRATIVE PLACEHOLDER DATA ONLY — rough, hand-typed
 * approximations so the map/scenario UI has something to render. It is not
 * sourced from Cook PVI, Dave's Redistricting App, or any rating service.
 * Phase 2 (the weekly scraper) replaces this file's `partisanLean`/`rating`
 * fields with real, sourced, cited data — see project README.
 */

const SENATE_UP_2026 = new Set([
  'AL', 'AK', 'AR', 'CO', 'DE', 'GA', 'ID', 'IL', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MA', 'MI', 'MN', 'MS', 'MT', 'NE', 'NH', 'NJ', 'NM', 'NC', 'OK', 'OR', 'RI',
  'SC', 'SD', 'TN', 'TX', 'VA', 'WV', 'WY',
])

export const STATE_PARTISAN_LEAN: Record<string, number> = {
  AL: 15, AK: 9, AZ: 3, AR: 16, CA: -13, CO: -5, CT: -7, DE: -6, FL: 6,
  GA: 3, HI: -18, ID: 19, IL: -7, IN: 11, IA: 6, KS: 8, KY: 16, LA: 14,
  ME: -3, MD: -14, MA: -14, MI: -1, MN: -2, MS: 11, MO: 11, MT: 12, NE: 12,
  NV: 0, NH: -2, NJ: -6, NM: -4, NY: -8, NC: 2, ND: 20, OH: 8, OK: 21,
  OR: -8, PA: 0, RI: -10, SC: 9, SD: 16, TN: 15, TX: 6, UT: 15, VT: -14,
  VA: -2, WA: -9, WV: 24, WI: 0, WY: 26,
}

const houseSeatsByState = new Map<string, number>()
for (const d of ALL_DISTRICTS) {
  houseSeatsByState.set(d.stateCode, (houseSeatsByState.get(d.stateCode) ?? 0) + 1)
}

export const STATE_RACE_DATA: StateRaceData[] = Array.from(houseSeatsByState.entries()).map(
  ([stateCode, houseSeats]) => {
    const partisanLean = STATE_PARTISAN_LEAN[stateCode] ?? 0
    return {
      stateCode,
      houseSeats,
      senateSeatUp: SENATE_UP_2026.has(stateCode),
      partisanLean,
      rating: ratingFromLean(partisanLean),
    }
  },
)

export const TOTAL_HOUSE_SEATS = STATE_RACE_DATA.reduce(
  (sum, s) => sum + s.houseSeats,
  0,
)

export const TOTAL_SENATE_SEATS_UP = STATE_RACE_DATA.filter(
  (s) => s.senateSeatUp,
).length
