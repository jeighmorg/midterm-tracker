import { ratingFromLean, type DistrictRaceData } from '../types/election'
import { ALL_DISTRICTS } from './districtTopology'
import houseRatingsRaw from './generated/house-ratings.json'

/**
 * Real data comes from `generated/house-ratings.json` (Wikipedia's aggregated
 * House race ratings — see scripts/fetch-house-ratings.mjs) for the ~150
 * districts at least one rater considers competitive.
 *
 * For the remaining districts (not competitive enough to be listed), there is
 * no real per-district source yet, so they fall back to a PLACEHOLDER: the
 * state's hand-typed lean plus a small deterministic jitter, purely so the
 * map shows district-to-district variation. This jitter is NOT a real
 * estimate of any district's lean — see CLAUDE.md for the plan to close this
 * gap (a full-district partisan-lean source, e.g. Dave's Redistricting App).
 */

const houseRatings = houseRatingsRaw.districts as Record<
  string,
  { rating: DistrictRaceData['rating']; partisanLean: number | null }
>

function jitter(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 13) - 6 // -6..+6
}

// Local copy of the state-level placeholder baseline used only as a fallback
// for districts with no real rating; kept in sync with stateRaceData.ts's list.
const PLACEHOLDER_STATE_PARTISAN_LEAN: Record<string, number> = {
  AL: 15, AK: 9, AZ: 3, AR: 16, CA: -13, CO: -5, CT: -7, DE: -6, FL: 6,
  GA: 3, HI: -18, ID: 19, IL: -7, IN: 11, IA: 6, KS: 8, KY: 16, LA: 14,
  ME: -3, MD: -14, MA: -14, MI: -1, MN: -2, MS: 11, MO: 11, MT: 12, NE: 12,
  NV: 0, NH: -2, NJ: -6, NM: -4, NY: -8, NC: 2, ND: 20, OH: 8, OK: 21,
  OR: -8, PA: 0, RI: -10, SC: 9, SD: 16, TN: 15, TX: 6, UT: 15, VT: -14,
  VA: -2, WA: -9, WV: 24, WI: 0, WY: 26,
}

export const DISTRICT_RACE_DATA: DistrictRaceData[] = ALL_DISTRICTS.map(({ id, stateCode, districtCode }) => {
  const real = houseRatings[id]
  if (real) {
    return {
      id,
      stateCode,
      districtCode,
      partisanLean: real.partisanLean ?? 0,
      rating: real.rating,
    }
  }
  const partisanLean = (PLACEHOLDER_STATE_PARTISAN_LEAN[stateCode] ?? 0) + jitter(id)
  return {
    id,
    stateCode,
    districtCode,
    partisanLean,
    rating: ratingFromLean(partisanLean),
  }
})

export const TOTAL_HOUSE_DISTRICTS = DISTRICT_RACE_DATA.length
export const REAL_RATING_DISTRICT_COUNT = Object.keys(houseRatings).length
