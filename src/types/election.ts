export type Rating =
  | 'safe-d'
  | 'likely-d'
  | 'lean-d'
  | 'tossup'
  | 'lean-r'
  | 'likely-r'
  | 'safe-r'

export interface Candidate {
  name: string
  /** "D" / "R" / "I" or an occasional raw party label (e.g. "No party preference") when it doesn't normalize to one of those */
  party?: string
}

export interface StateRaceData {
  /** Two-letter USPS code, e.g. "OH" */
  stateCode: string
  /** Number of House seats in this state (derived from district topology) */
  houseSeats: number
  /** Whether this state has a Senate seat up in the 2026 midterms */
  senateSeatUp: boolean
  /** Cook/Sabato/Inside Elections-style rating, curated or scraped weekly */
  rating: Rating
  /** Partisan lean, e.g. Dave's Redistricting App "D+7" expressed as signed number, D positive */
  partisanLean: number
}

export interface DistrictRaceData {
  /** `${stateCode}-${districtCode}`, e.g. "CA-39" or "AK-00" for at-large */
  id: string
  stateCode: string
  /** Census CD119FP code, "00" for at-large single-district states */
  districtCode: string
  rating: Rating
  partisanLean: number
  /** Where `rating`/`partisanLean` came from: multi-rater consensus (competitive seats) or Cook PVI alone (all other seats) */
  dataSource: 'rater-consensus' | 'cook-pvi'
}

/** `lean` follows the D-positive convention documented on `partisanLean` above — do not flip its sign here. */
export function ratingFromLean(lean: number): Rating {
  if (lean >= 10) return 'safe-d'
  if (lean >= 5) return 'likely-d'
  if (lean >= 1) return 'lean-d'
  if (lean > -1) return 'tossup'
  if (lean > -5) return 'lean-r'
  if (lean > -10) return 'likely-r'
  return 'safe-r'
}

export const RATING_COLORS: Record<Rating, string> = {
  'safe-d': '#08519c',
  'likely-d': '#3182bd',
  'lean-d': '#9ecae1',
  tossup: '#bdbdbd',
  'lean-r': '#fcae91',
  'likely-r': '#de2d26',
  'safe-r': '#a50f15',
}

export const RATING_LABELS: Record<Rating, string> = {
  'safe-d': 'Safe D',
  'likely-d': 'Likely D',
  'lean-d': 'Lean D',
  tossup: 'Toss-up',
  'lean-r': 'Lean R',
  'likely-r': 'Likely R',
  'safe-r': 'Safe R',
}
