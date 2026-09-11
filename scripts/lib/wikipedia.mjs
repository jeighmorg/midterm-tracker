const API = 'https://en.wikipedia.org/w/api.php'

// Wikimedia's API etiquette asks for a descriptive User-Agent identifying the
// tool (no personal contact info needed for this low-volume, personal-project use).
const USER_AGENT = 'MidtermTrackerBot/0.1 (personal open-source project, non-commercial data pipeline)'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function pageParam(pageOrId) {
  return typeof pageOrId === 'number' ? `pageid=${pageOrId}` : `page=${encodeURIComponent(pageOrId)}`
}

/** Fetch a Wikipedia API URL, retrying on 429/5xx with backoff (honoring Retry-After when present). */
async function fetchWithRetry(url, { maxAttempts = 4 } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (res.ok) return res
    const retryable = res.status === 429 || res.status >= 500
    if (!retryable || attempt === maxAttempts) {
      throw new Error(`Wikipedia API ${res.status} for ${url}`)
    }
    const retryAfterHeader = Number(res.headers.get('retry-after'))
    const delayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : 2 ** attempt * 1000
    console.log(`  (Wikipedia API ${res.status}, retrying in ${Math.round(delayMs / 1000)}s...)`)
    await sleep(delayMs)
  }
  throw new Error(`unreachable`)
}

/** Fetch the raw wikitext of one section of a page (by title or numeric pageid). `section` is the index from action=parse&prop=sections. */
export async function fetchSectionWikitext(pageOrId, section) {
  const url = `${API}?action=parse&${pageParam(pageOrId)}&section=${section}&prop=wikitext&format=json`
  const res = await fetchWithRetry(url)
  const json = await res.json()
  if (json.error) throw new Error(`Wikipedia API error for ${pageOrId} section ${section}: ${json.error.info}`)
  return json.parse.wikitext['*']
}

/** List a page's sections as {index, line} so callers can find the section number they want by title. */
export async function fetchSections(pageOrId) {
  const url = `${API}?action=parse&${pageParam(pageOrId)}&prop=sections&format=json`
  const res = await fetchWithRetry(url)
  const json = await res.json()
  if (json.error) throw new Error(`Wikipedia API error for ${pageOrId} sections: ${json.error.info}`)
  return json.parse.sections
}

export async function fetchSectionByTitle(pageOrId, title) {
  const sections = await fetchSections(pageOrId)
  const match = sections.find((s) => s.line === title)
  if (!match) throw new Error(`Section "${title}" not found on "${pageOrId}"`)
  return fetchSectionWikitext(pageOrId, match.index)
}
