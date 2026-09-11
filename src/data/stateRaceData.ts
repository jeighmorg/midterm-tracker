import type { Rating, StateRaceData } from '../types/election'

/**
 * Seat counts and Senate-class-up flags below are factual (2020 census
 * apportionment; Class 2 Senate seats up in the 2026 midterms).
 *
 * `partisanLean` is ILLUSTRATIVE PLACEHOLDER DATA ONLY — rough, hand-typed
 * approximations so the map/scenario UI has something to render. It is not
 * sourced from Cook PVI, Dave's Redistricting App, or any rating service.
 * Phase 2 (the weekly scraper) replaces this file's `partisanLean`/`rating`
 * fields with real, sourced, cited data — see project README.
 */

const RAW: Array<[string, number, boolean, number]> = [
  ['AL', 7, false, 15],
  ['AK', 1, true, 9],
  ['AZ', 9, false, 3],
  ['AR', 4, true, 16],
  ['CA', 52, false, -13],
  ['CO', 8, true, -5],
  ['CT', 5, false, -7],
  ['DE', 1, true, -6],
  ['FL', 28, false, 6],
  ['GA', 14, true, 3],
  ['HI', 2, false, -18],
  ['ID', 2, true, 19],
  ['IL', 17, true, -7],
  ['IN', 9, false, 11],
  ['IA', 4, true, 6],
  ['KS', 4, true, 8],
  ['KY', 6, true, 16],
  ['LA', 6, true, 14],
  ['ME', 2, true, -3],
  ['MD', 8, false, -14],
  ['MA', 9, true, -14],
  ['MI', 13, true, -1],
  ['MN', 8, true, -2],
  ['MS', 4, true, 11],
  ['MO', 8, false, 11],
  ['MT', 2, true, 12],
  ['NE', 3, true, 12],
  ['NV', 4, false, 0],
  ['NH', 2, true, -2],
  ['NJ', 12, true, -6],
  ['NM', 3, true, -4],
  ['NY', 26, false, -8],
  ['NC', 14, true, 2],
  ['ND', 1, false, 20],
  ['OH', 15, false, 8],
  ['OK', 5, true, 21],
  ['OR', 6, true, -8],
  ['PA', 17, false, 0],
  ['RI', 2, true, -10],
  ['SC', 7, true, 9],
  ['SD', 1, true, 16],
  ['TN', 9, true, 15],
  ['TX', 38, true, 6],
  ['UT', 4, false, 15],
  ['VT', 1, false, -14],
  ['VA', 11, true, -2],
  ['WA', 10, false, -9],
  ['WV', 2, true, 24],
  ['WI', 8, false, 0],
  ['WY', 1, true, 26],
]

function ratingFromLean(lean: number): Rating {
  const d = -lean // positive = D lean
  if (d >= 10) return 'safe-d'
  if (d >= 5) return 'likely-d'
  if (d >= 1) return 'lean-d'
  if (d > -1) return 'tossup'
  if (d > -5) return 'lean-r'
  if (d > -10) return 'likely-r'
  return 'safe-r'
}

export const STATE_RACE_DATA: StateRaceData[] = RAW.map(
  ([stateCode, houseSeats, senateSeatUp, partisanLean]) => ({
    stateCode,
    houseSeats,
    senateSeatUp,
    partisanLean,
    rating: ratingFromLean(partisanLean),
  }),
)

export const TOTAL_HOUSE_SEATS = STATE_RACE_DATA.reduce(
  (sum, s) => sum + s.houseSeats,
  0,
)

export const TOTAL_SENATE_SEATS_UP = STATE_RACE_DATA.filter(
  (s) => s.senateSeatUp,
).length
