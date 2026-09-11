import type { Candidate, Rating } from '../../types/election'
import { RATING_COLORS, RATING_LABELS } from '../../types/election'

interface StateApproval {
  approvePercent: number
  disapprovePercent: number
  asOf: string
}

interface Financials {
  receipts: number
  cashOnHand: number
}

interface MapTooltipProps {
  x: number
  y: number
  title: string
  rating?: Rating
  candidates?: Candidate[]
  note?: string
  stateApproval?: StateApproval
  fundraisingByCandidate?: Record<string, Financials>
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Best-effort "how many months old is this poll" from a Wikipedia date cell like "April 28–May 3, 2025". */
function monthsOld(dateStr: string): number | null {
  const yearMatch = /(\d{4})/.exec(dateStr)
  if (!yearMatch) return null
  const year = Number(yearMatch[1])

  let bestIndex = -1
  let bestMonth = 0
  MONTH_NAMES.forEach((name, i) => {
    const idx = dateStr.lastIndexOf(name)
    if (idx > bestIndex) {
      bestIndex = idx
      bestMonth = i
    }
  })

  const pollDate = new Date(year, bestIndex === -1 ? 0 : bestMonth, 1)
  const now = new Date()
  return (now.getFullYear() - pollDate.getFullYear()) * 12 + (now.getMonth() - pollDate.getMonth())
}

const STALE_MONTHS = 12

export function MapTooltip({
  x,
  y,
  title,
  rating,
  candidates,
  note,
  stateApproval,
  fundraisingByCandidate,
}: MapTooltipProps) {
  const approvalAge = stateApproval ? monthsOld(stateApproval.asOf) : null
  const approvalIsStale = approvalAge !== null && approvalAge >= STALE_MONTHS

  return (
    <div
      className="fixed z-50 pointer-events-none max-w-xs rounded border border-gray-300 bg-white px-3 py-2 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900"
      style={{ left: x + 14, top: y + 14 }}
    >
      <div className="font-semibold">{title}</div>
      {rating && (
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: RATING_COLORS[rating] }}
          />
          <span>{RATING_LABELS[rating]}</span>
        </div>
      )}
      {candidates && candidates.length > 0 ? (
        <div className="mt-1 text-gray-600 dark:text-gray-400">
          {candidates.map((c) => {
            const financials = fundraisingByCandidate?.[c.name]
            return (
              <div key={c.name}>
                {c.name}
                {c.party ? ` (${c.party})` : ''}
                {financials && ` — ${formatMoney(financials.receipts)} raised`}
              </div>
            )
          })}
        </div>
      ) : note ? (
        <div className="mt-1 italic text-gray-500 dark:text-gray-400">{note}</div>
      ) : null}
      {stateApproval && (
        <div className="mt-1 border-t border-gray-200 pt-1 text-gray-600 dark:border-gray-700 dark:text-gray-400">
          Presidential approval: {stateApproval.approvePercent}% approve /{' '}
          {stateApproval.disapprovePercent}% disapprove
          <div
            className={
              approvalIsStale
                ? 'font-medium text-amber-600 dark:text-amber-500'
                : 'text-gray-400 dark:text-gray-500'
            }
          >
            {stateApproval.asOf}
            {approvalIsStale && ` — ${approvalAge} months old, no newer poll available`}
          </div>
        </div>
      )}
    </div>
  )
}
