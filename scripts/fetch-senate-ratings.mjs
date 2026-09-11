import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { extractPvi, extractRaterScores, scoreToRating, splitRows } from './lib/ratings.mjs'
import { STATE_NAME_TO_USPS } from './lib/stateNames.mjs'
import { fetchSectionByTitle } from './lib/wikipedia.mjs'

const PAGE = '2026 United States Senate elections'
const SECTION_TITLE = 'Predictions'
const SOURCE_URL =
  'https://en.wikipedia.org/wiki/2026_United_States_Senate_elections#Predictions'

function extractStateName(row) {
  // Row header looks like: ! [[2026 United States Senate election in Alabama|Alabama]]
  const m = /\[\[[^|\]]*\|([^\]]+)\]\]/.exec(row)
  return m ? m[1].trim() : null
}

export async function fetchSenateRatings() {
  const wikitext = await fetchSectionByTitle(PAGE, SECTION_TITLE)
  const rows = splitRows(wikitext)

  const states = {}
  let skipped = 0

  for (const row of rows) {
    const stateName = extractStateName(row)
    const stateCode = stateName ? STATE_NAME_TO_USPS[stateName] : undefined
    const scores = extractRaterScores(row)
    if (!stateCode || scores.length === 0) {
      skipped++
      continue
    }
    const pvi = extractPvi(row)
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    states[stateCode] = {
      rating: scoreToRating(avgScore),
      partisanLean: pvi,
      raterCount: scores.length,
    }
  }

  const result = {
    asOf: new Date().toISOString().slice(0, 10),
    fetchedAt: new Date().toISOString(),
    source: 'Wikipedia: 2026 Senate election predictions (aggregates Cook, DDHQ, The Economist, FiftyPlusOne, Fox News, Inside Elections, Race to the WH, RealClearPolitics, Sabato, Silver Bulletin, Split Ticket)',
    sourceUrl: SOURCE_URL,
    states,
  }

  writeFileSync(
    new URL('../src/data/generated/senate-ratings.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(`senate-ratings: ${Object.keys(states).length} states parsed, ${skipped} rows skipped`)
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchSenateRatings().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
