import { ratingFromLean, type DistrictRaceData } from '../types/election'
import { ALL_DISTRICTS } from './districtTopology'
import { STATE_PARTISAN_LEAN } from './stateRaceData'

/**
 * PLACEHOLDER DATA. Real per-district ratings need Phase 2's scraper (Cook/
 * Sabato/Inside Elections district-level ratings) or a partisan-lean dataset
 * like Dave's Redistricting App's district export. Until then, each district
 * gets the state's placeholder lean plus a small deterministic jitter, purely
 * so the map shows district-to-district variation instead of one flat color
 * per state. The jitter is NOT a real estimate of any district's lean.
 */
function jitter(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return (Math.abs(hash) % 13) - 6 // -6..+6
}

export const DISTRICT_RACE_DATA: DistrictRaceData[] = ALL_DISTRICTS.map(({ id, stateCode, districtCode }) => {
  const partisanLean = (STATE_PARTISAN_LEAN[stateCode] ?? 0) + jitter(id)
  return {
    id,
    stateCode,
    districtCode,
    partisanLean,
    rating: ratingFromLean(partisanLean),
  }
})

export const TOTAL_HOUSE_DISTRICTS = DISTRICT_RACE_DATA.length
