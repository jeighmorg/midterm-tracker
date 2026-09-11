import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { splitRows } from './lib/ratings.mjs'
import { STATE_NAME_TO_USPS } from './lib/stateNames.mjs'
import { splitCells } from './lib/wikitext.mjs'
import { fetchSections, fetchSectionWikitext } from './lib/wikipedia.mjs'

// "Opinion polling on the second Trump presidency" - see fetch-approval.mjs for
// why this is referenced by pageid (title will need updating once a new
// president is inaugurated).
const PAGE_ID = 78968690
const PARENT_SECTION_TITLE = 'Statewide job approval ratings'
const SOURCE_URL =
  'https://en.wikipedia.org/wiki/Opinion_polling_on_the_second_Trump_presidency#Statewide_job_approval_ratings'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Each row is [source, date, sampleSize, moe, approve, disapprove, unsure] - pick the one with the latest year. */
function latestRow(rows) {
  let best = null
  let bestYear = -1
  for (const row of rows) {
    const cells = splitCells(row)
    if (cells.length < 7) continue
    const year = Number(/\d{4}/.exec(cells[1])?.[0] ?? 0)
    if (year >= bestYear) {
      bestYear = year
      best = cells
    }
  }
  return best
}

export async function fetchStateApproval() {
  const sections = await fetchSections(PAGE_ID)
  const parentIdx = sections.findIndex((s) => s.line === PARENT_SECTION_TITLE)
  if (parentIdx === -1) throw new Error(`Section "${PARENT_SECTION_TITLE}" not found`)
  const parentLevel = sections[parentIdx].toclevel

  const childSections = []
  for (let i = parentIdx + 1; i < sections.length; i++) {
    if (sections[i].toclevel <= parentLevel) break
    childSections.push(sections[i])
  }

  const states = {}
  let skipped = 0

  for (const section of childSections) {
    const stateCode = STATE_NAME_TO_USPS[section.line.trim()]
    if (!stateCode) {
      skipped++
      continue
    }

    const wikitext = await fetchSectionWikitext(PAGE_ID, section.index)
    const cells = latestRow(splitRows(wikitext))
    if (!cells) {
      skipped++
      await sleep(300)
      continue
    }

    const [source, date, , , approve, disapprove, unsure] = cells
    states[stateCode] = {
      source,
      asOf: date,
      approvePercent: Number(approve.replace('%', '')),
      disapprovePercent: Number(disapprove.replace('%', '')),
      unsurePercent: Number(unsure.replace('%', '')),
    }
    await sleep(300)
  }

  const result = {
    fetchedAt: new Date().toISOString(),
    source: 'Wikipedia: statewide presidential approval polling (one poll per state, only where a state has actually been polled)',
    sourceUrl: SOURCE_URL,
    states,
  }

  writeFileSync(
    new URL('../src/data/generated/state-approval.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  )

  console.log(`state-approval: ${Object.keys(states).length} states parsed, ${skipped} skipped`)
  return result
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  fetchStateApproval().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
