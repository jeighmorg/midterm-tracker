export type Rating =
  | 'safe-d'
  | 'likely-d'
  | 'lean-d'
  | 'tossup'
  | 'lean-r'
  | 'likely-r'
  | 'safe-r'

export interface StateRaceData {
  /** Two-letter USPS code, e.g. "OH" */
  stateCode: string
  /** Number of House seats in this state (for tally weighting until district-level data lands) */
  houseSeats: number
  /** Whether this state has a Senate seat up in the 2026 midterms */
  senateSeatUp: boolean
  /** Cook/Sabato/Inside Elections-style rating, curated or scraped weekly */
  rating: Rating
  /** Partisan lean, e.g. Dave's Redistricting App "D+7" expressed as signed number, D positive */
  partisanLean: number
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
