// Open-Meteo Marine (waves/swell/SST) + Forecast (wind/pressure/temp). Keyless + CORS.
import { fetchJson } from './http.js'

const MARINE = 'https://marine-api.open-meteo.com/v1/marine'
const FORECAST = 'https://api.open-meteo.com/v1/forecast'
const TZ = encodeURIComponent('America/New_York')

const MARINE_VARS = [
  'wave_height', 'wave_period', 'wave_direction',
  'swell_wave_height', 'swell_wave_period', 'sea_surface_temperature',
  'ocean_current_velocity', 'ocean_current_direction',
]
const WX_VARS = [
  'wind_speed_10m', 'wind_gusts_10m', 'wind_direction_10m',
  'surface_pressure', 'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
  'weather_code', 'precipitation_probability', 'uv_index',
]
const DAILY_VARS = [
  'temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max',
  'weather_code', 'uv_index_max', 'wind_speed_10m_max',
]

export function fetchMarine(lat, lon, days = 7) {
  const url =
    `${MARINE}?latitude=${lat}&longitude=${lon}&hourly=${MARINE_VARS.join(',')}` +
    `&forecast_days=${days}&length_unit=imperial&cell_selection=sea&timezone=${TZ}`
  return fetchJson(url)
}

export function fetchWeather(lat, lon, days = 7) {
  const url =
    `${FORECAST}?latitude=${lat}&longitude=${lon}&hourly=${WX_VARS.join(',')}&daily=${DAILY_VARS.join(',')}` +
    `&forecast_days=${days}&past_days=2&wind_speed_unit=kn&temperature_unit=fahrenheit` +
    `&precipitation_unit=inch&timezone=${TZ}`
  return fetchJson(url)
}

const pad = (n) => String(n).padStart(2, '0')
const hourKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`

function nearestIndex(times, date) {
  const t = date.getTime()
  let best = -1, bestDiff = Infinity
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - t)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return best
}

// Pull all hourly variables at (or nearest to) a given time.
export function sampleHourly(json, date) {
  const h = json?.hourly
  if (!h?.time?.length) return {}
  let idx = h.time.indexOf(hourKey(date))
  if (idx < 0) idx = nearestIndex(h.time, date)
  if (idx < 0) return {}
  const out = { _time: h.time[idx] }
  for (const k of Object.keys(h)) if (k !== 'time') out[k] = h[k][idx]
  return out
}

const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Daily summary for `date` from the Open-Meteo daily block (hi/lo/precip%/UV/code).
export function dailyWeather(wxJson, date) {
  const d = wxJson?.daily
  if (!d?.time?.length) return null
  const i = d.time.indexOf(ymd(date))
  if (i < 0) return null
  return {
    hiF: d.temperature_2m_max?.[i] ?? null,
    loF: d.temperature_2m_min?.[i] ?? null,
    precipMax: d.precipitation_probability_max?.[i] ?? null,
    uvMax: d.uv_index_max?.[i] ?? null,
    windMaxKn: d.wind_speed_10m_max?.[i] ?? null,
    code: d.weather_code?.[i] ?? null,
  }
}

// Next `count` hourly cells from `date` forward — for the home-screen hourly strip.
export function hourlyWeather(wxJson, date, count = 12) {
  const h = wxJson?.hourly
  if (!h?.time?.length) return []
  let start = h.time.indexOf(hourKey(date))
  if (start < 0) start = nearestIndex(h.time, date)
  if (start < 0) return []
  const out = []
  for (let i = start; i < Math.min(start + count, h.time.length); i++) {
    const t = new Date(h.time[i])
    out.push({ time: t, hour: t.getHours(), tempF: h.temperature_2m?.[i] ?? null, code: h.weather_code?.[i] ?? null, precipProb: h.precipitation_probability?.[i] ?? null })
  }
  return out
}

const hourLabel = (h) => { const ap = h < 12 ? 'am' : 'pm'; const hh = h % 12 || 12; return `${hh}${ap}` }

// Daytime (8a–9p) storm/lightning outlook for `date` from hourly precip probability
// + WMO weather codes (95/96/99 = thunderstorm). The real summer-Keys safety factor.
export function stormOutlook(wxJson, date) {
  const h = wxJson?.hourly
  if (!h?.time) return null
  let maxProb = 0, stormHour = null, anyStorm = false
  for (let i = 0; i < h.time.length; i++) {
    const t = new Date(h.time[i])
    if (t.getFullYear() !== date.getFullYear() || t.getMonth() !== date.getMonth() || t.getDate() !== date.getDate()) continue
    const hr = t.getHours()
    if (hr < 8 || hr > 21) continue
    const prob = h.precipitation_probability?.[i] ?? 0
    const code = h.weather_code?.[i] ?? 0
    if (prob > maxProb) maxProb = prob
    if (code >= 95 && !anyStorm) { anyStorm = true; stormHour = hr }
  }
  let level = 'low'
  if (anyStorm || maxProb >= 60) level = 'high'
  else if (maxProb >= 35) level = 'moderate'
  const text =
    level === 'high'
      ? anyStorm ? `Thunderstorms likely${stormHour != null ? ` from ~${hourLabel(stormHour)}` : ''} — watch the sky and plan to be off the water early` : `High rain chance (${maxProb}%) — storms possible`
      : level === 'moderate' ? `Scattered showers possible (${maxProb}%)` : 'Low storm risk today'
  return { level, maxProb, stormHour, text }
}

// Surface-pressure change (hPa) from ~6 h before `date` to `date` (negative = falling).
export function pressureTrend(wxJson, date) {
  const h = wxJson?.hourly
  if (!h?.time?.length || !h.surface_pressure) return null
  const now = h.time.indexOf(hourKey(date)) >= 0 ? h.time.indexOf(hourKey(date)) : nearestIndex(h.time, date)
  const prev = now - 6
  if (now < 0 || prev < 0) return null
  const a = h.surface_pressure[prev], b = h.surface_pressure[now]
  if (a == null || b == null) return null
  return Math.round((b - a) * 10) / 10
}
