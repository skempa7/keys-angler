export const pad = (n) => String(n).padStart(2, '0')

export function fmtTime(d) {
  if (!d) return '—'
  let h = d.getHours()
  const m = pad(d.getMinutes())
  const ap = h < 12 ? 'AM' : 'PM'
  h = h % 12 || 12
  return `${h}:${m} ${ap}`
}

export const fmtRange = (a, b) => `${fmtTime(a)} – ${fmtTime(b)}`

export const fmtDayShort = (d) => d.toLocaleDateString(undefined, { weekday: 'short' })
export const fmtDateShort = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

export function relTime(ts) {
  if (!ts) return 'never'
  const s = (Date.now() - ts) / 1000
  if (s < 45) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
export const compass = (deg) => (deg == null ? '' : COMPASS[Math.round(deg / 22.5) % 16])

export const toneColor = (tone) =>
  ({ good: 'var(--good)', ok: 'var(--ok)', caution: 'var(--caution)', poor: 'var(--poor)', bad: 'var(--bad)' }[tone] || 'var(--accent)')

// 0..1 → green/amber/red for factor bars.
export const scoreColor = (s) => (s >= 0.66 ? 'var(--good)' : s >= 0.4 ? 'var(--caution)' : 'var(--poor)')

// Tense-neutral day rating (the verdict labels read "go now", wrong for future days).
export const dayLabel = (score) =>
  score >= 78 ? 'Prime' : score >= 60 ? 'Good' : score >= 42 ? 'Fair' : score >= 25 ? 'Tough' : 'Poor'

export const strengthColor = (s) =>
  ({ Prime: 'var(--good)', Strong: 'var(--ok)', Fair: 'var(--caution)', Slow: 'var(--poor)' }[s] || 'var(--accent)')

// Sea-surface temp → color (cool / ideal / warm / hot for the Keys).
export const sstColor = (f) => {
  if (f == null) return 'var(--text)'
  if (f < 72) return 'var(--accent)'
  if (f <= 86) return 'var(--good)'
  if (f <= 89) return 'var(--caution)'
  return 'var(--poor)'
}

// UV index → label + color (NWS bands).
export const uvLabel = (uv) => (uv == null ? '' : uv < 3 ? 'Low' : uv < 6 ? 'Moderate' : uv < 8 ? 'High' : uv < 11 ? 'Very high' : 'Extreme')
export const uvColor = (uv) => (uv == null ? 'var(--text)' : uv < 3 ? 'var(--good)' : uv < 6 ? 'var(--caution)' : uv < 8 ? 'var(--poor)' : 'var(--bad)')

// Hour-of-day → compact label ("Now" handled by caller): 1p, 11a, 12p.
export const fmtHour = (h) => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`

// Open-Meteo WMO weather codes → short label.
export function weatherLabel(code) {
  if (code == null) return ''
  if (code === 0) return 'Clear'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code <= 48) return 'Fog'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Showers'
  if (code <= 82) return 'Rain showers'
  if (code <= 99) return 'Thunderstorms'
  return ''
}
