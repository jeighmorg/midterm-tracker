import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { splitRows } from './lib/ratings.mjs'
import { fetchSectionByTitle } from './lib/wikipedia.mjs'

const PAGE = 'List of current United States senators'
const SECTION_TITLE = 'List of senators'
const SOURCE_URL = 'https://en.wikipedia.org/wiki/List_of_current_United_States_senators#List_of_senators'

/**
 * Independents (currently Sanders and King) caucus with Senate Democrats and
 * are counted with them here, matching standard "which party controls the
 * Senate" reporting convention.
 */
function normalizeParty(raw) {
  if (raw.startsWith('Democratic') || raw.includes('Farmer-Labor') || raw.includes('Farmer–Labor')) return 'D'
  if (raw.startsWith('Republican')) return 'R'
  if (raw.startsWith('Independent')) return 'D'
  return null
}

export async function fetchSenateComposition() {
  const wikitext = await fetchSectionByTitle(PAGE, SECTION_TITLE)
  const rows = splitRows(wikitext)

  let total = 0
  let up2026 = 0
  const fixedSeatsByParty = { D: 0, R: 0 }
  let unrecognized = 0

  for (const row of rows) {
    const partyMatch = /\{\{party color\|([^}]+)\}\}/.exec(row)
    if (!partyMatch) continue // header or non-senator row
    total++
    const party = normalizeParty(partyMatch[1].trim())
    const isUp2026 = row.includes('|2026]]')
    if (isUp2026) {
      up2026++
      continue
    }
    if (!party) {
      unrecognized++
      continue
    }
    fixedSeatsByParty[party]++
  }

  if (total !== 100) {
    throw new Error(`Expected 100 senators, parsed ${total} — table structure may have changed`)
  }

  const result = {
    fetchedAt: new Date().toISOString(),
    source: 'Wikipedia: List of current United States senators (Independents counted with the Senate Democratic Caucus they sit in)',
    sourceUrl: SOURCE_URL,
    fixedSeatsByParty,
    fixedSeatsTotal: fixedSeatsByParty.D + fixedSeatsByParty.R,
    upIn2026: up2026,
  }

  writeFileSync(
    new URL('../src/data/generated/senate-composition.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(
    `senate-composition: ${result.fixedSeatsTotal} fixed seats (D${fixedSeatsByParty.D}/R${fixedSeatsByParty.R}), ${up2026} up in 2026, ${unrecognized} unrecognized`,
  )
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchSenateComposition().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
