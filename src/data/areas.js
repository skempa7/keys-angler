// Quick-pick fishing areas down the Keys (coordinates from NOAA tide stations in
// stations.js). Tapping one sets the active location so every screen — score,
// tides, weather, drift — recalculates for that stretch of the islands.
export const KEYS_AREAS = [
  { id: 'ocean-reef', name: 'Key Largo / Ocean Reef', label: 'North Key Largo', lat: 25.3083, lon: -80.2767, radiusNm: 30 },
  { id: 'tavernier', name: 'Tavernier', label: 'Upper Keys — Tavernier', lat: 25.0048, lon: -80.5187, radiusNm: 30, home: true },
  { id: 'islamorada', name: 'Islamorada / Matecumbe', label: 'Islamorada', lat: 24.8683, lon: -80.7033, radiusNm: 30 },
  { id: 'long-key', name: 'Long Key', label: 'Long Key', lat: 24.8033, lon: -80.85, radiusNm: 30 },
  { id: 'duck-key', name: 'Duck Key', label: 'Duck Key / Conch', lat: 24.765, lon: -80.9133, radiusNm: 30 },
  { id: 'marathon', name: 'Marathon / Vaca Key', label: 'Marathon', lat: 24.711, lon: -81.1065, radiusNm: 30 },
  { id: 'bahia-honda', name: 'Bahia Honda', label: 'Bahia Honda', lat: 24.655, lon: -81.2817, radiusNm: 30 },
  { id: 'big-pine', name: 'Big Pine Key', label: 'Big Pine / Lower Keys', lat: 24.6483, lon: -81.33, radiusNm: 30 },
  { id: 'key-west', name: 'Key West', label: 'Key West', lat: 24.5557, lon: -81.8079, radiusNm: 35 },
]
