import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { splitRows } from './lib/ratings.mjs'
import { splitCells } from './lib/wikitext.mjs'
import { fetchSectionByTitle } from './lib/wikipedia.mjs'

// "Opinion polling on the second Trump presidency" — referenced by pageid since the
// title will need updating once a new president is inaugurated; this note is the reminder.
const PAGE_ID = 78968690
const SECTION_TITLE = 'Approval'
const SOURCE_URL = 'https://en.wikipedia.org/wiki/Opinion_polling_on_the_second_Trump_presidency'

export async function fetchApproval() {
  const wikitext = await fetchSectionByTitle(PAGE_ID, SECTION_TITLE)
  const rows = splitRows(wikitext)
  const averageRow = rows.find((r) => /Average/.test(r))
  if (!averageRow) throw new Error('Could not find approval Average row')

  const cells = splitCells(averageRow)
  // Columns: Aggregator | Updated | Approve | Disapprove | Unsure/Other | Lead
  const [, asOf, approvePercent, disapprovePercent, unsurePercent, netText] = cells

  const result = {
    asOf,
    fetchedAt: new Date().toISOString(),
    approvePercent: Number(approvePercent.replace('%', '')),
    disapprovePercent: Number(disapprovePercent.replace('%', '')),
    unsurePercent: Number(unsurePercent.replace('%', '')),
    netText,
    source: 'Wikipedia presidential approval polling average (Ballotpedia, CNN, DDHQ, FiftyPlusOne, Race to the WH, RealClearPolitics, Silver Bulletin, The Economist, NYT, VoteHub)',
    sourceUrl: SOURCE_URL,
  }

  writeFileSync(
    new URL('../src/data/generated/approval.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(`approval: ${result.approvePercent}% approve / ${result.disapprovePercent}% disapprove as of ${result.asOf}`)
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchApproval().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
