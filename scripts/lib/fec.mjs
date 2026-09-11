const API = 'https://api.open.fec.gov/v1'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** GET one FEC API endpoint, retrying on 429/5xx with backoff. Requires FEC_API_KEY in the environment. */
export async function fecGet(path, params, { maxAttempts = 4 } = {}) {
  const apiKey = process.env.FEC_API_KEY
  if (!apiKey) throw new Error('FEC_API_KEY environment variable is not set')

  const url = new URL(`${API}${path}`)
  url.searchParams.set('api_key', apiKey)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url)
    if (res.ok) return res.json()
    const retryable = res.status === 429 || res.status >= 500
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`FEC API ${res.status} for ${path}`)
    }
    const delayMs = 2 ** attempt * 1000
    console.log(`  (FEC API ${res.status}, retrying in ${Math.round(delayMs / 1000)}s...)`)
    await sleep(delayMs)
  }
}

/**
 * Best-effort match of "First Last" (our candidate list's format) against
 * FEC's "LAST, FIRST MIDDLE" name format. Real people's names are messy
 * (suffixes, hyphens, nicknames) - this fails soft (returns null) rather
 * than guessing wrong.
 */
function normalize(s) {
  return s.toUpperCase().replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function matchFecCandidate(candidateName, fecResults) {
  const normalizedFull = normalize(candidateName)

  // Last name alone is usually enough - each race's candidate pool is small
  // (typically under 20), so a same-surname collision within one race is
  // rare. Requiring first name too broke on common nicknames (our "Dave
  // Flippo" vs FEC's "DAVID"), which is a much more frequent real-world case.
  const lastNameMatches = fecResults.filter((r) => {
    const fecLast = normalize((r.name ?? '').split(',')[0] ?? '')
    return fecLast && normalizedFull.includes(fecLast)
  })

  if (lastNameMatches.length <= 1) return lastNameMatches[0] ?? null

  const firstNameMatch = lastNameMatches.find((r) => {
    const fecFirst = normalize((r.name ?? '').split(',')[1]?.trim().split(' ')[0] ?? '')
    return fecFirst && normalizedFull.includes(fecFirst)
  })
  if (firstNameMatch) return firstNameMatch

  // Couldn't disambiguate by name - the real candidate is virtually always
  // the one who actually raised money.
  return lastNameMatches.reduce((a, b) => ((b.receipts ?? 0) > (a.receipts ?? 0) ? b : a))
}
