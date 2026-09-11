import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { CONGRESSIONAL_DISTRICTS_TOPOLOGY } from '../../data/districtTopology'
import { FIPS_TO_USPS } from '../../data/stateFips'
import houseCandidatesRaw from '../../data/generated/house-candidates.json'
import { USPS_TO_STATE_NAME } from '../../data/stateNames'
import { RATING_COLORS, type Candidate, type Rating } from '../../types/election'
import { MapTooltip } from './MapTooltip'
import { useHoverTooltip } from './useHoverTooltip'

const HOUSE_CANDIDATES = houseCandidatesRaw.districts as Record<string, Candidate[]>

interface DistrictMapProps {
  /** districtId ("CA-39") -> rating to render, including any scenario overrides */
  ratingByDistrict: Record<string, Rating>
  onDistrictClick?: (districtId: string) => void
}

function districtTitle(districtId: string): string {
  const [stateCode, districtCode] = districtId.split('-')
  const stateName = USPS_TO_STATE_NAME[stateCode] ?? stateCode
  return districtCode === '00' ? `${stateName} At-Large` : `${stateName} District ${Number(districtCode)}`
}

export function DistrictMap({ ratingByDistrict, onDistrictClick }: DistrictMapProps) {
  const { hovered, position, handlers } = useHoverTooltip<string>()

  return (
    <div className="relative">
      <ComposableMap projection="geoAlbersUsa" className="w-full h-auto">
        <Geographies geography={CONGRESSIONAL_DISTRICTS_TOPOLOGY}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const props = geo.properties as { STATEFP: string; CD119FP: string }
              const stateCode = FIPS_TO_USPS[props.STATEFP]
              const districtId = `${stateCode}-${props.CD119FP}`
              const rating = ratingByDistrict[districtId]
              const fill = rating ? RATING_COLORS[rating] : '#e5e7eb'

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onDistrictClick?.(districtId)}
                  {...handlers(districtId)}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={0.4}
                  style={{
                    outline: 'none',
                    cursor: onDistrictClick ? 'pointer' : 'default',
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
          title={districtTitle(hovered)}
          rating={ratingByDistrict[hovered]}
          candidates={HOUSE_CANDIDATES[hovered]}
          note="No candidate data available"
        />
      )}
    </div>
  )
}
