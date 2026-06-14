// Habitat point-query for a dropped spot: bottom type (FWC Unified Reef Map) + depth
// (NOAA NCEI Coastal Relief Model). Both are CORS-open (verified). Best-effort &
// online-only — a spot still saves without it. Do NOT send credentials to FWC
// (it reflects Origin with allow-credentials; credentialed fetch would be rejected).
import { fetchJson } from './http.js'

const ptGeom = (lat, lon) => encodeURIComponent(JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }))

export async function getHabitat(lat, lon) {
  const out = { bottom: null, depthFt: null }

  try {
    const url =
      'https://gis.myfwc.com/hosting/rest/services/Projects_FWC/UnifiedReefMapProject_v2_2/MapServer/10/query' +
      `?geometry=${ptGeom(lat, lon)}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects` +
      '&outFields=FIRST_ClassLv1,FIRST_ClassLv2,FIRST_ClassLv0&returnGeometry=false&f=json'
    const j = await fetchJson(url, { timeoutMs: 9000 })
    const a = j?.features?.[0]?.attributes
    if (a) out.bottom = a.FIRST_ClassLv2 || a.FIRST_ClassLv1 || a.FIRST_ClassLv0 || null
  } catch { /* offline / no coverage */ }

  try {
    const url =
      'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/CRM_mosaic/ImageServer/identify' +
      `?geometry=${ptGeom(lat, lon)}&geometryType=esriGeometryPoint&returnGeometry=false&f=json`
    const j = await fetchJson(url, { timeoutMs: 9000 })
    const v = parseFloat(j?.value)
    if (!Number.isNaN(v)) out.depthFt = Math.round(Math.abs(v) * 3.28084)
  } catch { /* offline */ }

  return out
}

// Coarse suitability hint for stone-crab trap placement from bottom + depth.
export function crabHabitatScore({ bottom, depthFt }) {
  if (!bottom && depthFt == null) return null
  const b = (bottom || '').toLowerCase()
  const good = /hardbottom|pavement|reef|rubble|rock|coral/.test(b)
  const bad = /seagrass|continuous|sand|sediment|mud/.test(b)
  const depthOk = depthFt == null || (depthFt >= 2 && depthFt <= 35)
  if (good && depthOk) return { rating: 'good', note: 'Hard/structured bottom in the trap band — promising.' }
  if (bad) return { rating: 'poor', note: 'Seagrass/soft bottom — crabs prefer hard structure nearby.' }
  return { rating: 'fair', note: 'Mixed bottom — worth a set if there’s relief nearby.' }
}
