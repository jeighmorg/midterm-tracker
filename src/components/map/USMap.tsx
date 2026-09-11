import type { GeoJsonObject } from 'geojson'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import statesTopo from 'us-atlas/states-10m.json'
import fundraisingRaw from '../../data/generated/fundraising.json'
import senateCandidatesRaw from '../../data/generated/senate-candidates.json'
import stateApprovalRaw from '../../data/generated/state-approval.json'
import { FIPS_TO_USPS } from '../../data/stateFips'
import { USPS_TO_STATE_NAME } from '../../data/stateNames'
import { RATING_COLORS, type Candidate, type Rating } from '../../types/election'
import { MapTooltip } from './MapTooltip'
import { useHoverTooltip } from './useHoverTooltip'

// us-atlas ships this as a plain TopoJSON Topology; react-simple-maps' declared
// `geography` prop type predates Topology support, so the cast is expected here.
const STATES_TOPOLOGY = statesTopo as unknown as GeoJsonObject

const SENATE_CANDIDATES = senateCandidatesRaw.states as Record<string, Candidate[]>
const STATE_APPROVAL = stateApprovalRaw.states as Record<
  string,
  { approvePercent: number; disapprovePercent: number; asOf: string }
>
const SENATE_FUNDRAISING = fundraisingRaw.senate as Record<
  string,
  Record<string, { receipts: number; cashOnHand: number }>
>

interface USMapProps {
  /** stateCode -> rating to render, including any scenario overrides */
  ratingByState: Record<string, Rating>
  /** stateCode -> whether this state should be shown as selectable/relevant for the current view */
  activeStates: Set<string>
  onStateClick?: (stateCode: string) => void
}

export function USMap({ ratingByState, activeStates, onStateClick }: USMapProps) {
  const { hovered, position, handlers } = useHoverTooltip<string>()

  return (
    <div className="relative">
      <ComposableMap projection="geoAlbersUsa" className="w-full h-auto">
        <Geographies geography={STATES_TOPOLOGY}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const usps = FIPS_TO_USPS[geo.id as string]
              const isActive = usps ? activeStates.has(usps) : false
              const rating = usps ? ratingByState[usps] : undefined
              // Deliberately darker/more saturated than RATING_COLORS.tossup (#bdbdbd) so
              // "no race this cycle" doesn't read as "toss-up".
              const fill = !isActive ? '#6b7280' : rating ? RATING_COLORS[rating] : '#e5e7eb'

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => usps && isActive && onStateClick?.(usps)}
                  {...(usps ? handlers(usps) : {})}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={0.75}
                  style={{
                    outline: 'none',
                    cursor: isActive && onStateClick ? 'pointer' : 'default',
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
      {hovered && position && (
        <MapTooltip
          x={position.x}
          y={position.y}
          title={USPS_TO_STATE_NAME[hovered] ?? hovered}
          rating={activeStates.has(hovered) ? ratingByState[hovered] : undefined}
          candidates={activeStates.has(hovered) ? SENATE_CANDIDATES[hovered] : undefined}
          note={activeStates.has(hovered) ? 'No candidate data available' : 'No Senate race in 2026'}
          stateApproval={STATE_APPROVAL[hovered]}
          fundraisingByCandidate={SENATE_FUNDRAISING[hovered]}
        />
      )}
    </div>
  )
}
