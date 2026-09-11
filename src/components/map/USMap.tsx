import type { GeoJsonObject } from 'geojson'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import statesTopo from 'us-atlas/states-10m.json'
import { FIPS_TO_USPS } from '../../data/stateFips'
import { RATING_COLORS, type Rating } from '../../types/election'

// us-atlas ships this as a plain TopoJSON Topology; react-simple-maps' declared
// `geography` prop type predates Topology support, so the cast is expected here.
const STATES_TOPOLOGY = statesTopo as unknown as GeoJsonObject

interface USMapProps {
  /** stateCode -> rating to render, including any scenario overrides */
  ratingByState: Record<string, Rating>
  /** stateCode -> whether this state should be shown as selectable/relevant for the current view */
  activeStates: Set<string>
  onStateClick?: (stateCode: string) => void
}

export function USMap({ ratingByState, activeStates, onStateClick }: USMapProps) {
  return (
    <ComposableMap projection="geoAlbersUsa" className="w-full h-auto">
      <Geographies geography={STATES_TOPOLOGY}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const usps = FIPS_TO_USPS[geo.id as string]
            const isActive = usps ? activeStates.has(usps) : false
            const rating = usps ? ratingByState[usps] : undefined
            const fill = !isActive ? '#d1d5db' : rating ? RATING_COLORS[rating] : '#e5e7eb'

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick={() => usps && isActive && onStateClick?.(usps)}
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
  )
}
