import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { splitRows } from './lib/ratings.mjs'
import { splitCells } from './lib/wikitext.mjs'
import { fetchSectionByTitle } from './lib/wikipedia.mjs'

const PAGE = '2026 United States House of Representatives elections'
const SECTION_TITLE = 'Opinion polling'
const SOURCE_URL =
  'https://en.wikipedia.org/wiki/2026_United_States_House_of_Representatives_elections#Opinion_polling'

export async function fetchGenericBallot() {
  const wikitext = await fetchSectionByTitle(PAGE, SECTION_TITLE)
  const rows = splitRows(wikitext)

  const averageRow = rows.find((r) => /Average/.test(r))
  if (!averageRow) throw new Error('Could not find generic ballot Average row')

  const cells = splitCells(averageRow)

  // Columns: [merged "Average" label] | Dates updated | Republicans | Democrats | Other | Margin
  const [, asOf, republicanPercent, democratPercent, otherPercent, marginText] = cells

  const result = {
    asOf,
    fetchedAt: new Date().toISOString(),
    republicanPercent: Number(republicanPercent.replace('%', '')),
    democratPercent: Number(democratPercent.replace('%', '')),
    otherPercent: Number(otherPercent.replace('%', '')),
    marginText,
    source: 'Wikipedia generic congressional ballot polling average (DDHQ, FiftyPlusOne, RealClearPolitics, Silver Bulletin, VoteHub, Race to the WH)',
    sourceUrl: SOURCE_URL,
  }

  writeFileSync(
    new URL('../src/data/generated/generic-ballot.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(`generic-ballot: ${result.marginText} as of ${result.asOf}`)
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchGenericBallot().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
