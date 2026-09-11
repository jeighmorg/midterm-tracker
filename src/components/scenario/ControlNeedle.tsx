import { RATING_COLORS, ratingFromLean, RATING_LABELS, type Rating } from '../../types/election'

interface ControlNeedleProps {
  label: string
  seatsByRating: Partial<Record<Rating, number>>
  totalSeats: number
}

// Same order as the seat tally bar: deep R on the left through deep D on the right.
const WEDGE_ORDER: Rating[] = ['safe-r', 'likely-r', 'lean-r', 'tossup', 'lean-d', 'likely-d', 'safe-d']

// Rough win probability per rating, used only to turn categorical ratings into
// a single "expected seats" number for the needle - not a claim that any race
// is really e.g. exactly 80%. Symmetric around 50% for tossups.
const PROB_D: Record<Rating, number> = {
  'safe-d': 0.95,
  'likely-d': 0.8,
  'lean-d': 0.65,
  tossup: 0.5,
  'lean-r': 0.35,
  'likely-r': 0.2,
  'safe-r': 0.05,
}

// What fraction of the chamber's seats a fully-deflected needle represents -
// i.e. how big a swing counts as a "landslide". Reference to a fraction of the
// chamber (rather than a fixed seat count) so House and Senate scale sensibly
// against their very different sizes.
const LANDSLIDE_FRACTION = 0.15

const CENTER = { x: 100, y: 95 }
const OUTER_RADIUS = 88
const INNER_RADIUS = 58
const NEEDLE_LENGTH = 78

function polarToCartesian(radius: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180
  return { x: CENTER.x + radius * Math.sin(angleRad), y: CENTER.y - radius * Math.cos(angleRad) }
}

function wedgePath(startAngle: number, endAngle: number) {
  const p1 = polarToCartesian(OUTER_RADIUS, startAngle)
  const p2 = polarToCartesian(OUTER_RADIUS, endAngle)
  const p3 = polarToCartesian(INNER_RADIUS, endAngle)
  const p4 = polarToCartesian(INNER_RADIUS, startAngle)
  return `M ${p1.x} ${p1.y} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${INNER_RADIUS} ${INNER_RADIUS} 0 0 0 ${p4.x} ${p4.y} Z`
}

/**
 * A 270toWin/NYT-style needle gauge. There is no real statistical model behind
 * it (no source in this app publishes true win probabilities) - the swing is a
 * transparent, deterministic function of the same seat-rating tally shown in
 * the bar above: each seat's rating maps to a rough win probability, summed
 * into an "expected seats" figure for each party (the standard way forecasters
 * turn categorical ratings into one aggregate number), then compared against
 * the majority threshold. A margin equal to LANDSLIDE_FRACTION of the chamber
 * fully deflects the needle; smaller margins swing it proportionally.
 */
export function ControlNeedle({ label, seatsByRating, totalSeats }: ControlNeedleProps) {
  const expectedD = WEDGE_ORDER.reduce(
    (sum, rating) => sum + (seatsByRating[rating] ?? 0) * PROB_D[rating],
    0,
  )
  const majority = totalSeats / 2
  const landslideMargin = totalSeats * LANDSLIDE_FRACTION
  const normalized = landslideMargin > 0
    ? Math.max(-1, Math.min(1, (expectedD - majority) / landslideMargin))
    : 0
  const needleAngle = normalized * 90
  const impliedRating = ratingFromLean(normalized * 10)
  const needleTip = polarToCartesian(NEEDLE_LENGTH, needleAngle)

  const wedgeAngleWidth = 180 / WEDGE_ORDER.length

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
        {WEDGE_ORDER.map((rating, i) => (
          <path
            key={rating}
            d={wedgePath(-90 + i * wedgeAngleWidth, -90 + (i + 1) * wedgeAngleWidth)}
            fill={RATING_COLORS[rating]}
          />
        ))}
        <line
          x1={CENTER.x}
          y1={CENTER.y}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="currentColor"
          className="text-gray-900 dark:text-gray-100"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={CENTER.x} cy={CENTER.y} r={5} fill="currentColor" className="text-gray-900 dark:text-gray-100" />
      </svg>
      <div className="text-sm font-medium -mt-2">{label}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {impliedRating === 'tossup' ? 'Toss-up' : `${RATING_LABELS[impliedRating]} control`}
      </div>
    </div>
  )
}
