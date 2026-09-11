import { useMemo, useState } from 'react'
import { DistrictMap } from './components/map/DistrictMap'
import { USMap } from './components/map/USMap'
import { SeatTally } from './components/scenario/SeatTally'
import { IndicatorWidgets } from './components/widgets/IndicatorWidgets'
import { DISTRICT_RACE_DATA, REAL_RATING_DISTRICT_COUNT, TOTAL_HOUSE_DISTRICTS } from './data/districtRaceData'
import {
  SENATE_FIXED_SEATS,
  STATE_RACE_DATA,
  TOTAL_SENATE_SEATS,
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
  const [districtOverrides, setDistrictOverrides] = useState<Record<string, Rating>>({})
  const [stateOverrides, setStateOverrides] = useState<Record<string, Rating>>({})

  const baseRatingByDistrict = useMemo(
    () => Object.fromEntries(DISTRICT_RACE_DATA.map((d) => [d.id, d.rating])),
    [],
  )
  const effectiveRatingByDistrict = useMemo(
    () => ({ ...baseRatingByDistrict, ...districtOverrides }),
    [baseRatingByDistrict, districtOverrides],
  )

  const baseRatingByState = useMemo(
    () => Object.fromEntries(STATE_RACE_DATA.map((s) => [s.stateCode, s.rating])),
    [],
  )
  const effectiveRatingByState = useMemo(
    () => ({ ...baseRatingByState, ...stateOverrides }),
    [baseRatingByState, stateOverrides],
  )

  const activeSenateStates = useMemo(
    () => new Set(STATE_RACE_DATA.filter((s) => s.senateSeatUp).map((s) => s.stateCode)),
    [],
  )

  const handleDistrictClick = (districtId: string) => {
    if (!scenarioMode) return
    setDistrictOverrides((prev) => ({
      ...prev,
      [districtId]: nextRating(effectiveRatingByDistrict[districtId]),
    }))
  }

  const handleStateClick = (stateCode: string) => {
    if (!scenarioMode) return
    setStateOverrides((prev) => ({
      ...prev,
      [stateCode]: nextRating(effectiveRatingByState[stateCode]),
    }))
  }

  const houseSeatsByRating = useMemo(() => {
    const tally: Partial<Record<Rating, number>> = {}
    for (const d of DISTRICT_RACE_DATA) {
      const rating = effectiveRatingByDistrict[d.id]
      tally[rating] = (tally[rating] ?? 0) + 1
    }
    return tally
  }, [effectiveRatingByDistrict])

  const senateSeatsByRating = useMemo(() => {
    // Seed with the 65 seats not up in 2026 at their real current party — they
    // can't flip this cycle, so "safe" is the correct bucket for them here.
    const tally: Partial<Record<Rating, number>> = {
      'safe-d': SENATE_FIXED_SEATS.D,
      'safe-r': SENATE_FIXED_SEATS.R,
    }
    for (const s of STATE_RACE_DATA.filter((s) => s.senateSeatUp)) {
      const rating = effectiveRatingByState[s.stateCode]
      tally[rating] = (tally[rating] ?? 0) + 1
    }
    return tally
  }, [effectiveRatingByState])

  const hasScenario = Object.keys(districtOverrides).length > 0 || Object.keys(stateOverrides).length > 0

  const resetScenario = () => {
    setDistrictOverrides({})
    setStateOverrides({})
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">2026 Midterms Tracker</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          House districts use real 119th Congress boundaries (Census). All 435 districts carry real
          Cook PVI data; {REAL_RATING_DISTRICT_COUNT} of them — the ones at least one rater
          considers competitive — also carry a real multi-rater consensus rating. All{' '}
          {TOTAL_SENATE_SEATS_UP} 2026 Senate races carry real ratings too (updated weekly — see
          CLAUDE.md).
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded border border-gray-300 dark:border-gray-700 overflow-hidden text-sm">
          <button
            className={`px-3 py-1 ${view === 'house' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : ''}`}
            onClick={() => setView('house')}
          >
            House (districts)
          </button>
          <button
            className={`px-3 py-1 ${view === 'senate' ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : ''}`}
            onClick={() => setView('senate')}
          >
            Senate (2026 races)
          </button>
        </div>

        <label className="inline-flex items-center gap-2 text-sm ml-2">
          <input
            type="checkbox"
            checked={scenarioMode}
            onChange={(e) => setScenarioMode(e.target.checked)}
          />
          Scenario mode (click a {view === 'house' ? 'district' : 'state'} to cycle its projection)
        </label>

        {hasScenario && (
          <button
            className="text-sm underline text-gray-500 dark:text-gray-400"
            onClick={resetScenario}
          >
            Reset scenario
          </button>
        )}
      </div>

      {view === 'house' ? (
        <DistrictMap
          ratingByDistrict={effectiveRatingByDistrict}
          onDistrictClick={scenarioMode ? handleDistrictClick : undefined}
        />
      ) : (
        <USMap
          ratingByState={effectiveRatingByState}
          activeStates={activeSenateStates}
          onStateClick={scenarioMode ? handleStateClick : undefined}
        />
      )}

      <div className="flex flex-col gap-4">
        <SeatTally
          label="House"
          seatsByRating={houseSeatsByRating}
          totalSeats={TOTAL_HOUSE_DISTRICTS}
          majorityAt={218}
        />
        <SeatTally
          label={`Senate control (${TOTAL_SENATE_SEATS} seats — ${TOTAL_SENATE_SEATS_UP} up in 2026, ${TOTAL_SENATE_SEATS - TOTAL_SENATE_SEATS_UP} not on the ballot this cycle)`}
          seatsByRating={senateSeatsByRating}
          totalSeats={TOTAL_SENATE_SEATS}
          majorityAt={51}
        />
      </div>

      <IndicatorWidgets />
    </div>
  )
}

export default App
