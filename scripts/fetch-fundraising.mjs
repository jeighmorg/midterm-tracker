import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { fecGet, matchFecCandidate } from './lib/fec.mjs'

const CYCLE = 2026
// FEC's real per-key rate limit turned out to be much stricter than the
// documented 1000/hour default - a 250ms delay between ~470 calls triggered
// constant 429s (each recovered via retry, but wastefully slow). 1s keeps us
// comfortably under whatever the actual limit is.
const DELAY_MS = 1000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readGenerated(name) {
  return JSON.parse(readFileSync(new URL(`../src/data/generated/${name}`, import.meta.url)))
}

async function fetchTotalsFor(params) {
  const json = await fecGet('/candidates/totals/', { ...params, cycle: CYCLE, per_page: 100 })
  return json.results ?? []
}

function extractFinancials(fecRecord) {
  return {
    receipts: fecRecord.receipts ?? 0,
    disbursements: fecRecord.disbursements ?? 0,
    cashOnHand: Number(fecRecord.cash_on_hand_end_period ?? 0),
  }
}

export async function fetchFundraising() {
  if (!process.env.FEC_API_KEY) {
    console.log('  (FEC_API_KEY not set, skipping - this is required in CI via the repo secret, optional locally)')
    return null
  }

  const houseCandidates = readGenerated('house-candidates.json').districts
  const senateCandidates = readGenerated('senate-candidates.json').states

  const districts = {}
  let districtMatched = 0
  let districtTotal = 0

  for (const [districtId, candidates] of Object.entries(houseCandidates)) {
    const [stateCode, districtCode] = districtId.split('-')
    let fecResults
    try {
      fecResults = await fetchTotalsFor({ office: 'H', state: stateCode, district: districtCode })
    } catch (err) {
      console.log(`  (skipping ${districtId}: ${err.message})`)
      await sleep(DELAY_MS)
      continue
    }

    const entry = {}
    for (const candidate of candidates) {
      districtTotal++
      const match = matchFecCandidate(candidate.name, fecResults)
      if (match) {
        districtMatched++
        entry[candidate.name] = extractFinancials(match)
      }
    }
    if (Object.keys(entry).length > 0) districts[districtId] = entry
    await sleep(DELAY_MS)
  }

  const senate = {}
  let senateMatched = 0
  let senateTotal = 0

  for (const [stateCode, candidates] of Object.entries(senateCandidates)) {
    let fecResults
    try {
      fecResults = await fetchTotalsFor({ office: 'S', state: stateCode })
    } catch (err) {
      console.log(`  (skipping ${stateCode}: ${err.message})`)
      await sleep(DELAY_MS)
      continue
    }

    const entry = {}
    for (const candidate of candidates) {
      senateTotal++
      const match = matchFecCandidate(candidate.name, fecResults)
      if (match) {
        senateMatched++
        entry[candidate.name] = extractFinancials(match)
      }
    }
    if (Object.keys(entry).length > 0) senate[stateCode] = entry
    await sleep(DELAY_MS)
  }

  const result = {
    fetchedAt: new Date().toISOString(),
    source: 'FEC (Federal Election Commission): candidate financial totals',
    sourceUrl: 'https://api.open.fec.gov/developers/',
    cycle: CYCLE,
    districts,
    senate,
  }

  writeFileSync(
    new URL('../src/data/generated/fundraising.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(
    `fundraising: House ${districtMatched}/${districtTotal} candidates matched, Senate ${senateMatched}/${senateTotal} matched`,
  )
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchFundraising().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
