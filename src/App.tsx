import { useMemo, useState } from 'react'
import { USMap } from './components/map/USMap'
import { SeatTally } from './components/scenario/SeatTally'
import { IndicatorWidgets } from './components/widgets/IndicatorWidgets'
import {
  STATE_RACE_DATA,
  TOTAL_HOUSE_SEATS,
  TOTAL_SENATE_SEATS_UP,
} from './data/stateRaceData'
import type { Rating } from './types/election'

type ViewMode = 'house' | 'senate'

const RATING_CYCLE: Rating[] = [
  'safe-d',
  'likely-d',
  'lean-d',
  'tossup',
  'lean-r',
  'likely-r',
  'safe-r',
]

function nextRating(current: Rating): Rating {
  const i = RATING_CYCLE.indexOf(current)
  return RATING_CYCLE[(i + 1) % RATING_CYCLE.length]
}

function App() {
  const [view, setView] = useState<ViewMode>('house')
  const [scenarioMode, setScenarioMode] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, Rating>>({})

  const baseRatingByState = useMemo(
    () => Object.fromEntries(STATE_RACE_DATA.map((s) => [s.stateCode, s.rating])),
    [],
  )

  const effectiveRatingByState = useMemo(
    () => ({ ...baseRatingByState, ...overrides }),
    [baseRatingByState, overrides],
  )

  const activeStates = useMemo(() => {
    if (view === 'house') return new Set(STATE_RACE_DATA.map((s) => s.stateCode))
    return new Set(STATE_RACE_DATA.filter((s) => s.senateSeatUp).map((s) => s.stateCode))
  }, [view])

  const handleStateClick = (stateCode: string) => {
    if (!scenarioMode) return
    setOverrides((prev) => ({
      ...prev,
      [stateCode]: nextRating(effectiveRatingByState[stateCode]),
    }))
  }

  const houseSeatsByRating = useMemo(() => {
    const tally: Partial<Record<Rating, number>> = {}
    for (const s of STATE_RACE_DATA) {
      const rating = effectiveRatingByState[s.stateCode]
      tally[rating] = (tally[rating] ?? 0) + s.houseSeats
    }
    return tally
  }, [effectiveRatingByState])

  const senateSeatsByRating = useMemo(() => {
    const tally: Partial<Record<Rating, number>> = {}
    for (const s of STATE_RACE_DATA.filter((s) => s.senateSeatUp)) {
      const rating = effectiveRatingByState[s.stateCode]
      tally[rating] = (tally[rating] ?? 0) + 1
    }
    return tally
  }, [effectiveRatingByState])

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">2026 Midterms Tracker</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          State-level scaffold — district-level House boundaries land in phase 1 of the build.
          All ratings shown are placeholder data, not sourced from any rating service yet.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded border border-gray-300 dark:border-gray-700 overflow-hidden text-sm">
          <button
            className={`px-3 py-1 ${view === 'house' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : ''}`}
            onClick={() => setView('house')}
          >
            House (all states)
          </button>
          <button
            className={`px-3 py-1 ${view === 'senate' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : ''}`}
            onClick={() => setView('senate')}
          >
            Senate (2026 Class 2)
          </button>
        </div>

        <label className="inline-flex items-center gap-2 text-sm ml-2">
          <input
            type="checkbox"
            checked={scenarioMode}
            onChange={(e) => setScenarioMode(e.target.checked)}
          />
          Scenario mode (click a state to cycle its projection)
        </label>

        {Object.keys(overrides).length > 0 && (
          <button
            className="text-sm underline text-gray-500 dark:text-gray-400"
            onClick={() => setOverrides({})}
          >
            Reset scenario
          </button>
        )}
      </div>

      <USMap
        ratingByState={effectiveRatingByState}
        activeStates={activeStates}
        onStateClick={handleStateClick}
      />

      <div className="flex flex-col gap-4">
        <SeatTally
          label="House"
          seatsByRating={houseSeatsByRating}
          totalSeats={TOTAL_HOUSE_SEATS}
          majorityAt={218}
        />
        <SeatTally
          label="Senate seats up in 2026 (Class 2, 1/3 of the chamber)"
          seatsByRating={senateSeatsByRating}
          totalSeats={TOTAL_SENATE_SEATS_UP}
        />
      </div>

      <IndicatorWidgets />
    </div>
  )
}

export default App
