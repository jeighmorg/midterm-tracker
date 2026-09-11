import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { CONGRESSIONAL_DISTRICTS_TOPOLOGY } from '../../data/districtTopology'
import { FIPS_TO_USPS } from '../../data/stateFips'
import { RATING_COLORS, type Rating } from '../../types/election'

interface DistrictMapProps {
  /** districtId ("CA-39") -> rating to render, including any scenario overrides */
  ratingByDistrict: Record<string, Rating>
  onDistrictClick?: (districtId: string) => void
}

export function DistrictMap({ ratingByDistrict, onDistrictClick }: DistrictMapProps) {
  return (
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
  )
}
