const API = 'https://en.wikipedia.org/w/api.php'

// Wikimedia's API etiquette asks for a descriptive User-Agent identifying the
// tool (no personal contact info needed for this low-volume, personal-project use).
const USER_AGENT = 'MidtermTrackerBot/0.1 (personal open-source project, non-commercial data pipeline)'

function pageParam(pageOrId) {
  return typeof pageOrId === 'number' ? `pageid=${pageOrId}` : `page=${encodeURIComponent(pageOrId)}`
}

/** Fetch the raw wikitext of one section of a page (by title or numeric pageid). `section` is the index from action=parse&prop=sections. */
export async function fetchSectionWikitext(pageOrId, section) {
  const url = `${API}?action=parse&${pageParam(pageOrId)}&section=${section}&prop=wikitext&format=json`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Wikipedia API ${res.status} for ${pageOrId} section ${section}`)
  const json = await res.json()
  if (json.error) throw new Error(`Wikipedia API error for ${pageOrId} section ${section}: ${json.error.info}`)
  return json.parse.wikitext['*']
}

/** List a page's sections as {index, line} so callers can find the section number they want by title. */
export async function fetchSections(pageOrId) {
  const url = `${API}?action=parse&${pageParam(pageOrId)}&prop=sections&format=json`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Wikipedia API ${res.status} for ${pageOrId} sections`)
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
