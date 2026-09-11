import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { extractCandidates } from './lib/infobox.mjs'
import { STATE_NAME_TO_USPS } from './lib/stateNames.mjs'
import { fetchFullWikitext } from './lib/wikipedia.mjs'

// States with a single at-large district get their own singularly-titled page
// ("...election in Wyoming") instead of the plural per-district page every
// other state uses ("...elections in California") - fixed for the current
// (2020 census) apportionment cycle.
const AT_LARGE_STATES = new Set(['AK', 'DE', 'ND', 'SD', 'VT', 'WY'])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function districtChunks(fullWikitext) {
  // Split on top-level "==Heading==" sections; keep ones that look like "District N".
  const parts = fullWikitext.split(/\n==([^=\n][^\n]*?)==\n/)
  // parts alternates [preamble, heading1, body1, heading2, body2, ...]
  const chunks = []
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i]
    const body = parts[i + 1] ?? ''
    const m = /^District\s+(\d+)/i.exec(heading.trim())
    if (m) chunks.push({ districtCode: m[1].padStart(2, '0'), body })
  }
  return chunks
}

export async function fetchHouseCandidates() {
  const districts = {}
  let statesOk = 0
  let statesFailed = 0

  for (const [stateName, stateCode] of Object.entries(STATE_NAME_TO_USPS)) {
    const page = AT_LARGE_STATES.has(stateCode)
      ? `2026 United States House of Representatives election in ${stateName}`
      : `2026 United States House of Representatives elections in ${stateName}`

    try {
      const wikitext = await fetchFullWikitext(page)
      if (AT_LARGE_STATES.has(stateCode)) {
        const candidates = extractCandidates(wikitext)
        if (candidates.length > 0) districts[`${stateCode}-00`] = candidates
      } else {
        for (const { districtCode, body } of districtChunks(wikitext)) {
          const candidates = extractCandidates(body)
          if (candidates.length > 0) districts[`${stateCode}-${districtCode}`] = candidates
        }
      }
      statesOk++
    } catch (err) {
      statesFailed++
      console.log(`  (skipping ${stateName}: ${err.message})`)
    }
    await sleep(300)
  }

  const result = {
    fetchedAt: new Date().toISOString(),
    source: "Wikipedia: each state's 2026 House election article infoboxes",
    sourceUrl: 'https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections',
    districts,
  }

  writeFileSync(
    new URL('../src/data/generated/house-candidates.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(
    `house-candidates: ${Object.keys(districts).length} districts with candidates, ${statesOk} states parsed, ${statesFailed} states failed`,
  )
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchHouseCandidates().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
