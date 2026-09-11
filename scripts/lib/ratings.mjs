// Shared parsing for Wikipedia's {{USRaceRating}} / {{Shading PVI}} / {{ushr}} templates,
// as used on the 2026 House/Senate election-ratings pages.

const LEVEL_SCORE = {
  safe: 3,
  solid: 3,
  likely: 2,
  lean: 1,
  tilt: 0.5,
  tossup: 0,
}

/** One {{USRaceRating|Level|Party|Flip?}} (or {{USRaceRating|Tossup}}) -> signed score, R positive. */
export function raceRatingToScore(level, party) {
  const base = LEVEL_SCORE[level.toLowerCase()]
  if (base === undefined) return null
  if (base === 0) return 0
  if (!party) return null
  const sign = party.toUpperCase() === 'D' ? -1 : party.toUpperCase() === 'R' ? 1 : null
  if (sign === null) return null
  return sign * base
}

/** Average of an array of signed rater scores (R positive) -> our 7-point Rating string. */
export function scoreToRating(score) {
  if (score <= -2.5) return 'safe-d'
  if (score <= -1.5) return 'likely-d'
  if (score < 0) return 'lean-d'
  if (score === 0) return 'tossup'
  if (score < 1.5) return 'lean-r'
  if (score < 2.5) return 'likely-r'
  return 'safe-r'
}

/** Extract every {{USRaceRating|...}} in a chunk of wikitext -> array of signed scores (R positive), nulls dropped. */
export function extractRaterScores(rowWikitext) {
  const scores = []
  const re = /\{\{USRaceRating\|([^|}]+)(?:\|([^|}]+))?(?:\|[^}]*)?\}\}/gi
  let m
  while ((m = re.exec(rowWikitext))) {
    const score = raceRatingToScore(m[1].trim(), m[2]?.trim())
    if (score !== null) scores.push(score)
  }
  return scores
}

/** {{Shading PVI|R|7}} / {{Shading PVI|EVEN}} -> signed lean, D positive (matches our StateRaceData convention). */
export function extractPvi(rowWikitext) {
  const m = /\{\{[Ss]hading PVI\|([^|}]+)(?:\|([^|}]+))?\}\}/.exec(rowWikitext)
  if (!m) return null
  const party = m[1].trim().toUpperCase()
  if (party === 'EVEN') return 0
  const magnitude = Number(m[2])
  if (Number.isNaN(magnitude)) return null
  return party === 'D' ? magnitude : party === 'R' ? -magnitude : null
}

/** {{ushr|CA|39|X}} -> {stateAbbr: "CA", districtCode: "39"}; {{ushr|AK|AL|X}} -> districtCode "00" (at-large). */
export function extractDistrict(rowWikitext) {
  const m = /\{\{ushr\|([A-Z]{2})\|([^|}]+)/i.exec(rowWikitext)
  if (!m) return null
  const stateAbbr = m[1].toUpperCase()
  const rawDistrict = m[2].trim()
  const districtCode = rawDistrict.toUpperCase() === 'AL' ? '00' : rawDistrict.padStart(2, '0')
  return { stateAbbr, districtCode }
}

/** Split a wikitext table body into per-row chunks (each starting after a `|-` row separator). */
export function splitRows(tableWikitext) {
  return tableWikitext.split(/\n\|-/).slice(1)
}
