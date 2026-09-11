import { RATING_COLORS, type Rating } from '../../types/election'

interface SeatTallyProps {
  label: string
  seatsByRating: Partial<Record<Rating, number>>
  totalSeats: number
  /** Omit when "majority of this bar" isn't a meaningful line, e.g. Senate seats up (only 1/3 of the chamber). */
  majorityAt?: number
}

const D_RATINGS: Rating[] = ['safe-d', 'likely-d', 'lean-d']
const R_RATINGS: Rating[] = ['lean-r', 'likely-r', 'safe-r']

function sum(seatsByRating: Partial<Record<Rating, number>>, ratings: Rating[]) {
  return ratings.reduce((n, r) => n + (seatsByRating[r] ?? 0), 0)
}

export function SeatTally({ label, seatsByRating, totalSeats, majorityAt }: SeatTallyProps) {
  const dTotal = sum(seatsByRating, D_RATINGS)
  const tossupTotal = seatsByRating.tossup ?? 0
  const rTotal = sum(seatsByRating, R_RATINGS)

  const order: Rating[] = ['safe-d', 'likely-d', 'lean-d', 'tossup', 'lean-r', 'likely-r', 'safe-r']

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1 text-sm font-medium">
        <span>{label}</span>
        <span className="text-gray-500 dark:text-gray-400">
          D {dTotal} &middot; Tossup {tossupTotal} &middot; R {rTotal}
        </span>
      </div>
      <div className="relative h-6 w-full flex rounded overflow-hidden border border-gray-300 dark:border-gray-700">
        {order.map((rating) => {
          const count = seatsByRating[rating] ?? 0
          if (count === 0) return null
          const widthPct = (count / totalSeats) * 100
          return (
            <div
              key={rating}
              style={{ width: `${widthPct}%`, backgroundColor: RATING_COLORS[rating] }}
              title={`${rating}: ${count}`}
            />
          )
        })}
        {majorityAt !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-px bg-black/60 dark:bg-white/70"
            style={{ left: `${(majorityAt / totalSeats) * 100}%` }}
          />
        )}
      </div>
      {majorityAt !== undefined && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Majority at {majorityAt} of {totalSeats}
        </div>
      )}
    </div>
  )
}
