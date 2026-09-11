import { useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { CONGRESSIONAL_DISTRICTS_TOPOLOGY } from '../../data/districtTopology'
import { FIPS_TO_USPS } from '../../data/stateFips'
import fundraisingRaw from '../../data/generated/fundraising.json'
import houseCandidatesRaw from '../../data/generated/house-candidates.json'
import { USPS_TO_STATE_NAME } from '../../data/stateNames'
import { RATING_COLORS, type Candidate, type Rating } from '../../types/election'
import { MapTooltip } from './MapTooltip'
import { useHoverTooltip } from './useHoverTooltip'

const HOUSE_CANDIDATES = houseCandidatesRaw.districts as Record<string, Candidate[]>
const HOUSE_FUNDRAISING = fundraisingRaw.districts as Record<
  string,
  Record<string, { receipts: number; cashOnHand: number }>
>

// Geographic center of the continental US, in [lng, lat] - what ZoomableGroup
// pans/zooms around, not a pixel coordinate.
const DEFAULT_CENTER: [number, number] = [-96, 38]
const MIN_ZOOM = 1
const MAX_ZOOM = 8
const ZOOM_STEP = 1.5

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
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z * ZOOM_STEP))
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z / ZOOM_STEP))
  const resetView = () => {
    setZoom(1)
    setCenter(DEFAULT_CENTER)
  }

  return (
    <div className="relative">
      <ComposableMap projection="geoAlbersUsa" className="w-full h-auto">
        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onMoveEnd={({ coordinates, zoom: newZoom }) => {
            if (coordinates) setCenter(coordinates)
            if (newZoom) setZoom(newZoom)
          }}
        >
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
                    vectorEffect="non-scaling-stroke"
                    style={{
                      outline: 'none',
                      cursor: onDistrictClick ? 'pointer' : 'default',
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded border border-gray-300 bg-white text-lg shadow dark:border-gray-700 dark:bg-gray-900">
        <button
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="h-8 w-8 leading-none hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="h-8 w-8 border-t border-gray-300 leading-none hover:bg-gray-100 disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-800"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="h-8 w-8 border-t border-gray-300 text-xs leading-none hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          aria-label="Reset view"
          title="Reset view"
        >
          ⟲
        </button>
      </div>

      {hovered && position && (
        <MapTooltip
          x={position.x}
          y={position.y}
          title={districtTitle(hovered)}
          rating={ratingByDistrict[hovered]}
          candidates={HOUSE_CANDIDATES[hovered]}
          note="No candidate data available"
          fundraisingByCandidate={HOUSE_FUNDRAISING[hovered]}
        />
      )}
    </div>
  )
}
