import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { extractCandidates } from './lib/infobox.mjs'
import { STATE_NAME_TO_USPS } from './lib/stateNames.mjs'
import { fetchFullWikitext } from './lib/wikipedia.mjs'

const USPS_TO_STATE_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_TO_USPS).map(([name, code]) => [code, name]),
)

// The two 2026 special elections use "special election" instead of "election" in their title.
const SPECIAL_ELECTION_STATES = new Set(['FL', 'OH'])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchSenateCandidates() {
  const senateRatings = JSON.parse(
    readFileSync(new URL('../src/data/generated/senate-ratings.json', import.meta.url)),
  )
  const stateCodes = Object.keys(senateRatings.states)

  const states = {}
  let ok = 0
  let failed = 0

  for (const stateCode of stateCodes) {
    const stateName = USPS_TO_STATE_NAME[stateCode]
    const raceType = SPECIAL_ELECTION_STATES.has(stateCode) ? 'special election' : 'election'
    const page = `2026 United States Senate ${raceType} in ${stateName}`

    try {
      const wikitext = await fetchFullWikitext(page)
      const candidates = extractCandidates(wikitext)
      if (candidates.length > 0) states[stateCode] = candidates
      ok++
    } catch (err) {
      failed++
      console.log(`  (skipping ${stateName}: ${err.message})`)
    }
    await sleep(300)
  }

  const result = {
    fetchedAt: new Date().toISOString(),
    source: "Wikipedia: each state's 2026 Senate election article infobox",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_United_States_Senate_elections',
    states,
  }

  writeFileSync(
    new URL('../src/data/generated/senate-candidates.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(
    `senate-candidates: ${Object.keys(states).length} states with candidates, ${ok} pages parsed, ${failed} failed`,
  )
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchSenateCandidates().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
