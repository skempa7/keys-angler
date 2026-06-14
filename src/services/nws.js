// NWS api.weather.gov — marine alerts, Coastal Waters Forecast text, station obs.
// Keyless + CORS-open; re-serves the Keys C-MAN buoys (NDBC has no CORS).
import { fetchJson } from './http.js'

const BASE = 'https://api.weather.gov'

export function fetchAlerts(zones) {
  return fetchJson(`${BASE}/alerts/active?zone=${zones.join(',')}`, { accept: 'application/geo+json' })
}

export function parseAlerts(json) {
  return (json?.features || []).map((f) => {
    const p = f.properties || {}
    return {
      event: p.event,
      headline: p.headline,
      severity: p.severity,
      ends: p.ends || p.expires,
      area: p.areaDesc,
      description: p.description,
    }
  })
}

// Latest Coastal Waters Forecast for Key West WFO (marine zones have no JSON forecast).
export async function fetchMarineForecastText() {
  const list = await fetchJson(`${BASE}/products/types/CWF/locations/KEY`, { accept: 'application/ld+json' })
  const graph = list?.['@graph'] || list?.graph || []
  const id = graph[0]?.id
  if (!id) return null
  const prod = await fetchJson(`${BASE}/products/${id}`, { accept: 'application/ld+json' })
  return { text: prod.productText, issued: prod.issuanceTime }
}

// SI → marine units, on the way out.
const cToF = (c) => (c == null ? null : (c * 9) / 5 + 32)
const kmhToKn = (k) => (k == null ? null : k * 0.539957)
const paToInHg = (p) => (p == null ? null : p * 0.0002953)

export async function fetchLatestObs(stationId) {
  const json = await fetchJson(`${BASE}/stations/${stationId}/observations/latest`, {
    accept: 'application/geo+json',
  })
  const p = json?.properties || {}
  return {
    station: stationId,
    timestamp: p.timestamp,
    airTempF: cToF(p.temperature?.value),
    windKn: kmhToKn(p.windSpeed?.value),
    gustKn: kmhToKn(p.windGust?.value),
    windDir: p.windDirection?.value,
    pressureInHg: paToInHg(p.barometricPressure?.value),
    sstF: cToF(p.seaSurfaceTemperature?.value),
  }
}
