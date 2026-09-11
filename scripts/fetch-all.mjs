import { fetchApproval } from './fetch-approval.mjs'
import { fetchDistrictPvi } from './fetch-district-pvi.mjs'
import { fetchEconomic } from './fetch-economic.mjs'
import { fetchGenericBallot } from './fetch-generic-ballot.mjs'
import { fetchHouseRatings } from './fetch-house-ratings.mjs'
import { fetchSenateComposition } from './fetch-senate-composition.mjs'
import { fetchSenateRatings } from './fetch-senate-ratings.mjs'

const tasks = [
  ['economic', fetchEconomic],
  ['generic ballot', fetchGenericBallot],
  ['approval', fetchApproval],
  ['house ratings', fetchHouseRatings],
  ['senate ratings', fetchSenateRatings],
  ['district PVI', fetchDistrictPvi],
  ['senate composition', fetchSenateComposition],
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let failures = 0
for (const [name, task] of tasks) {
  try {
    await task()
  } catch (err) {
    failures++
    console.error(`[${name}] FAILED:`, err.message)
  }
  await sleep(1000) // be polite to Wikipedia/FRED between requests
}

if (failures > 0) {
  console.error(`${failures} of ${tasks.length} data sources failed to update.`)
  process.exit(1)
}
