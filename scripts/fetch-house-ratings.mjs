import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { fetchSectionByTitle } from './lib/wikipedia.mjs'
import { extractDistrict, extractPvi, extractRaterScores, scoreToRating, splitRows } from './lib/ratings.mjs'

const PAGE = '2026 United States House of Representatives election ratings'
const SECTION_TITLE = 'Latest published ratings for competitive seats'
const SOURCE_URL =
  'https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_election_ratings'

export async function fetchHouseRatings() {
  const wikitext = await fetchSectionByTitle(PAGE, SECTION_TITLE)
  const rows = splitRows(wikitext)

  const districts = {}
  let skipped = 0

  for (const row of rows) {
    const district = extractDistrict(row)
    const scores = extractRaterScores(row)
    if (!district || scores.length === 0) {
      skipped++
      continue
    }
    const pvi = extractPvi(row)
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const id = `${district.stateAbbr}-${district.districtCode}`
    districts[id] = {
      rating: scoreToRating(avgScore),
      partisanLean: pvi,
      raterCount: scores.length,
    }
  }

  const result = {
    asOf: new Date().toISOString().slice(0, 10),
    fetchedAt: new Date().toISOString(),
    source: 'Wikipedia: latest published House race ratings (aggregates Cook, Inside Elections, Sabato, Race to the WH, The Economist, Split Ticket, DDHQ, FiftyPlusOne, Fox News, Silver Bulletin)',
    sourceUrl: SOURCE_URL,
    note: 'Only covers seats at least one rater considers competitive. Districts not listed here are not "safe" in this file — the app falls back to placeholder data for them until a full-district source is added.',
    districts,
  }

  writeFileSync(
    new URL('../src/data/generated/house-ratings.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(`house-ratings: ${Object.keys(districts).length} competitive districts parsed, ${skipped} rows skipped`)
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchHouseRatings().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
