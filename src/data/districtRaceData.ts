import { ratingFromLean, type DistrictRaceData } from '../types/election'
import { ALL_DISTRICTS } from './districtTopology'
import districtPviRaw from './generated/district-pvi.json'
import houseRatingsRaw from './generated/house-ratings.json'

/**
 * Every district now gets real data — no placeholder/mock lean left:
 *
 * - `generated/house-ratings.json` (Wikipedia's aggregated House race
 *   ratings, scripts/fetch-house-ratings.mjs): multi-rater consensus rating
 *   + Cook PVI for the ~150 districts at least one rater considers
 *   competitive. This is the richer signal where it exists.
 * - `generated/district-pvi.json` (Wikipedia's full Cook PVI-by-district
 *   table, scripts/fetch-district-pvi.mjs): real Cook PVI for all 435
 *   districts, used for the remaining ~280 safe districts that aren't in
 *   the competitive-ratings table.
 */

const houseRatings = houseRatingsRaw.districts as Record<
  string,
  { rating: DistrictRaceData['rating']; partisanLean: number | null }
>

const districtPvi = districtPviRaw.districts as Record<string, number>

export const DISTRICT_RACE_DATA: DistrictRaceData[] = ALL_DISTRICTS.map(({ id, stateCode, districtCode }) => {
  const consensus = houseRatings[id]
  if (consensus) {
    return {
      id,
      stateCode,
      districtCode,
      partisanLean: consensus.partisanLean ?? 0,
      rating: consensus.rating,
      dataSource: 'rater-consensus',
    }
  }
  const partisanLean = districtPvi[id] ?? 0
  return {
    id,
    stateCode,
    districtCode,
    partisanLean,
    rating: ratingFromLean(partisanLean),
    dataSource: 'cook-pvi',
  }
})

export const TOTAL_HOUSE_DISTRICTS = DISTRICT_RACE_DATA.length
export const REAL_RATING_DISTRICT_COUNT = Object.keys(houseRatings).length
