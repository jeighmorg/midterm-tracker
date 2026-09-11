import type { Candidate, Rating } from '../../types/election'
import { RATING_COLORS, RATING_LABELS } from '../../types/election'

interface MapTooltipProps {
  x: number
  y: number
  title: string
  rating?: Rating
  candidates?: Candidate[]
  note?: string
}

export function MapTooltip({ x, y, title, rating, candidates, note }: MapTooltipProps) {
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
          {candidates.map((c) => (
            <div key={c.name}>
              {c.name}
              {c.party ? ` (${c.party})` : ''}
            </div>
          ))}
        </div>
      ) : note ? (
        <div className="mt-1 italic text-gray-500 dark:text-gray-400">{note}</div>
      ) : null}
    </div>
  )
}
