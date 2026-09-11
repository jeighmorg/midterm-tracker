import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { extractPvi, splitRows } from './lib/ratings.mjs'
import { STATE_NAME_TO_USPS } from './lib/stateNames.mjs'
import { fetchSectionByTitle } from './lib/wikipedia.mjs'

const PAGE = 'Cook Partisan Voting Index'
const SECTION_TITLE = 'By congressional district'
const SOURCE_URL = 'https://en.wikipedia.org/wiki/Cook_Partisan_Voting_Index#By_congressional_district'

// This table spells out full state names ({{ushr|Alabama|1|X}}), unlike the
// House ratings table which uses USPS codes ({{ushr|AL|2|X}}) - so it needs
// its own extractor rather than lib/ratings.mjs's extractDistrict.
function extractDistrictByStateName(row) {
  const m = /\{\{ushr\|([^|}]+)\|([^|}]+)/i.exec(row)
  if (!m) return null
  const stateCode = STATE_NAME_TO_USPS[m[1].trim()]
  if (!stateCode) return null
  const rawDistrict = m[2].trim()
  const districtCode = rawDistrict.toUpperCase() === 'AL' ? '00' : rawDistrict.padStart(2, '0')
  return { stateCode, districtCode }
}

export async function fetchDistrictPvi() {
  const wikitext = await fetchSectionByTitle(PAGE, SECTION_TITLE)
  const rows = splitRows(wikitext)

  const districts = {}
  let skipped = 0

  for (const row of rows) {
    const district = extractDistrictByStateName(row)
    const pvi = extractPvi(row)
    if (!district || pvi === null) {
      skipped++
      continue
    }
    districts[`${district.stateCode}-${district.districtCode}`] = pvi
  }

  const result = {
    fetchedAt: new Date().toISOString(),
    source: 'Wikipedia: Cook Partisan Voting Index by congressional district (full 435-district table)',
    sourceUrl: SOURCE_URL,
    districts,
  }

  writeFileSync(
    new URL('../src/data/generated/district-pvi.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(`district-pvi: ${Object.keys(districts).length} districts parsed, ${skipped} rows skipped`)
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchDistrictPvi().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
