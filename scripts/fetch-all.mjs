import { fetchApproval } from './fetch-approval.mjs'
import { fetchDistrictPvi } from './fetch-district-pvi.mjs'
import { fetchEconomic } from './fetch-economic.mjs'
import { fetchFundraising } from './fetch-fundraising.mjs'
import { fetchGenericBallot } from './fetch-generic-ballot.mjs'
import { fetchHouseCandidates } from './fetch-house-candidates.mjs'
import { fetchHouseRatings } from './fetch-house-ratings.mjs'
import { fetchSenateCandidates } from './fetch-senate-candidates.mjs'
import { fetchSenateComposition } from './fetch-senate-composition.mjs'
import { fetchSenateRatings } from './fetch-senate-ratings.mjs'
import { fetchStateApproval } from './fetch-state-approval.mjs'

const tasks = [
  ['economic', fetchEconomic],
  ['generic ballot', fetchGenericBallot],
  ['approval', fetchApproval],
  ['state approval', fetchStateApproval],
  ['house ratings', fetchHouseRatings],
  ['senate ratings', fetchSenateRatings],
  ['district PVI', fetchDistrictPvi],
  ['senate composition', fetchSenateComposition],
  // These two make ~85 additional page requests between them (one per state);
  // after them on purpose so a rate-limit stretch doesn't delay the cheaper fetches above.
  ['house candidates', fetchHouseCandidates],
  ['senate candidates', fetchSenateCandidates],
  // Reads the two candidate files above, so must run after them. ~470 FEC
  // calls at 1s each (~8 min) - last since it's by far the slowest task.
  ['fundraising', fetchFundraising],
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
