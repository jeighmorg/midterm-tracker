import { fetchApproval } from './fetch-approval.mjs'
import { fetchEconomic } from './fetch-economic.mjs'
import { fetchGenericBallot } from './fetch-generic-ballot.mjs'
import { fetchHouseRatings } from './fetch-house-ratings.mjs'
import { fetchSenateRatings } from './fetch-senate-ratings.mjs'

const tasks = [
  ['economic', fetchEconomic],
  ['generic ballot', fetchGenericBallot],
  ['approval', fetchApproval],
  ['house ratings', fetchHouseRatings],
  ['senate ratings', fetchSenateRatings],
]

let failures = 0
for (const [name, task] of tasks) {
  try {
    await task()
  } catch (err) {
    failures++
    console.error(`[${name}] FAILED:`, err.message)
  }
}

if (failures > 0) {
  console.error(`${failures} of ${tasks.length} data sources failed to update.`)
  process.exit(1)
}
