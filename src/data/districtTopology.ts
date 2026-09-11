import type { GeoJsonObject } from 'geojson'
import congressionalDistrictsRaw from './congressional-districts-119.json'
import { FIPS_TO_USPS } from './stateFips'

/**
 * 119th Congress (2025-2027) district boundaries, Census Bureau cartographic
 * boundary file `cb_2024_us_cd119_20m`, filtered to the 435 voting districts
 * (DC's and Puerto Rico's non-voting seats excluded). See CLAUDE.md for the
 * source and the redistricting-currency caveat: some states redrew maps
 * mid-decade in 2025 and this snapshot may not reflect maps still in
 * litigation as of whenever this file was last refreshed.
 */
export const CONGRESSIONAL_DISTRICTS_TOPOLOGY = congressionalDistrictsRaw as unknown as GeoJsonObject

interface RawDistrictProperties {
  STATEFP: string
  CD119FP: string
  GEOID: string
}

function districtGeometries(): RawDistrictProperties[] {
  const objects = (congressionalDistrictsRaw as { objects: Record<string, { geometries: { properties: RawDistrictProperties }[] }> })
    .objects
  const layerKey = Object.keys(objects)[0]
  return objects[layerKey].geometries.map((g) => g.properties)
}

export interface DistrictKey {
  id: string
  stateCode: string
  districtCode: string
}

export const ALL_DISTRICTS: DistrictKey[] = districtGeometries().map((props) => {
  const stateCode = FIPS_TO_USPS[props.STATEFP]
  return {
    id: `${stateCode}-${props.CD119FP}`,
    stateCode,
    districtCode: props.CD119FP,
  }
})
