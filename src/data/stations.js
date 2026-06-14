// Curated station/zone constants for the Upper Keys (verified from NOAA CO-OPS mdapi
// + api.weather.gov, 2026-06-14). Hard-coded so the app never queries metadata at runtime.

// Tide-prediction stations — ALL SUBORDINATE in the Keys → request interval=hilo only.
export const TIDE_STATIONS = [
  { id: '8723748', name: 'Tavernier Creek (Hwy 1 bridge)', lat: 25.0033, lon: -80.53, distNm: 0.1, home: true },
  { id: '8723747', name: 'Tavernier Harbor (Hawk Channel)', lat: 25.005, lon: -80.5167, distNm: 1.1 },
  { id: '8723769', name: 'Plantation Key (Hawk Channel)', lat: 24.9733, lon: -80.55, distNm: 3.6 },
  { id: '8723776', name: 'Yacht Harbor, Cowpens (Plantation Key)', lat: 24.96, lon: -80.555, distNm: 4.9 },
  { id: '8723786', name: 'Snake Creek (USCG Station)', lat: 24.9533, lon: -80.5867, distNm: 6.3 },
  // Verified down-Keys stations (Ocean Reef → Key West) for nearest-station selection.
  { id: '8723519', name: 'Ocean Reef Harbor, Key Largo', lat: 25.3083, lon: -80.2767 },
  { id: '8723534', name: 'Little Card Sound bridge', lat: 25.2883, lon: -80.37 },
  { id: '8723851', name: 'Indian Key Anchorage (Lower Matecumbe)', lat: 24.8683, lon: -80.7033 },
  { id: '8723899', name: 'Long Key (western end)', lat: 24.8033, lon: -80.85 },
  { id: '8723927', name: 'Duck Key, Hawk Channel', lat: 24.765, lon: -80.9133 },
  { id: '8723970', name: 'Vaca Key (Marathon), Florida Bay', lat: 24.711, lon: -81.1065 },
  { id: '8724138', name: 'Bahia Honda Channel', lat: 24.655, lon: -81.2817 },
  { id: '8724178', name: 'Big Pine Key, Spanish Harbor', lat: 24.6483, lon: -81.33 },
  { id: '8724580', name: 'Key West', lat: 24.5557, lon: -81.8079 },
]

// Tidal-current stations — nearest is ~20 mi SW; surface that caveat to the user.
export const CURRENT_STATIONS = [
  { id: 'ACT8221', name: 'Long Key drawbridge (E of)', lat: 24.84, lon: -80.77, distNm: 20 },
  { id: 'ACT8226', name: 'Long Key Viaduct', lat: 24.81, lon: -80.82, distNm: 27 },
]

// Live observation stations (C-MAN buoys re-served by api.weather.gov with CORS).
export const OBS_STATIONS = [
  { id: 'LONF1', name: 'Long Key', lat: 24.84, lon: -80.86, distNm: 21.8, primary: true },
  { id: 'VCAF1', name: 'Vaca Key', lat: 24.71, lon: -81.1, distNm: 37 },
  { id: 'SMKF1', name: 'Sombrero Key', lat: 24.63, lon: -81.11, distNm: 40 },
  // MLRF1 (Molasses Reef) is geographically closest but currently offline — probe at runtime only.
]

// NWS marine forecast zones covering Tavernier (bay side → 60 NM offshore).
export const MARINE_ZONES = {
  bay: 'GMZ031', // Florida Bay incl. Barnes/Blackwater/Buttonwood Sound
  hawkChannel: 'GMZ042', // Ocean Reef → Craig Key out to the reef
  offshore20: 'GMZ052', // Straits, out to 20 NM
  offshore60: 'GMZ072', // Straits, 20–60 NM (the "30 mi offshore" case)
}
export const ALL_MARINE_ZONES = Object.values(MARINE_ZONES)
export const WFO = 'KEY' // Key West forecast office; Coastal Waters Forecast product location

export const DEFAULTS = {
  tideStation: '8723748',
  currentStation: 'ACT8221',
  obsStation: 'LONF1',
}

export const tideStation = (id) => TIDE_STATIONS.find((s) => s.id === id)
export const currentStation = (id) => CURRENT_STATIONS.find((s) => s.id === id)

// Great-circle distance in nautical miles.
export function distanceNm(lat1, lon1, lat2, lon2) {
  const R = 3440.065
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

// Nearest tide-prediction station to a point (so tides follow the active location).
export function nearestStation(lat, lon, list = TIDE_STATIONS) {
  let best = list[0]
  let bestD = Infinity
  for (const s of list) {
    const d = distanceNm(lat, lon, s.lat, s.lon)
    if (d < bestD) { bestD = d; best = s }
  }
  return { ...best, distNm: Math.round(bestD * 10) / 10 }
}
