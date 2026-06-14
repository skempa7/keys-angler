// Orchestrator: fetch (or load from cache) every data source for a location + day
// window, then assemble the derived intelligence the UI consumes. Resilient — a
// single failed/offline source degrades gracefully; sun/moon/tide math is local.
import { cachedFetch } from './cache.js'
import { fetchTidePredictions } from './tides.js'
import { fetchMarine, fetchWeather, sampleHourly, pressureTrend } from './marine.js'
import { fetchAlerts, parseAlerts } from './nws.js'
import { parseHiLo, eventsForDay, tideStateAt } from '../engine/tideStage.js'
import { solunarDay } from '../engine/solunar.js'
import { buildBiteWindows } from '../engine/biteWindows.js'
import { computeMomentScore } from '../engine/score.js'

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
const r2 = (x) => Math.round(x * 100) / 100
const num = (x) => (x == null ? null : Number(x))
const cToF = (c) => (c == null ? null : (c * 9) / 5 + 32)

async function safe(fn) {
  try { return await fn() } catch { return null }
}

export function buildSample({ when, solunar, tideEvents, marineJson, wxJson, alerts }) {
  const m = marineJson ? sampleHourly(marineJson, when) : {}
  const w = wxJson ? sampleHourly(wxJson, when) : {}
  return {
    when,
    solunar,
    sun: solunar.sun,
    tideState: tideEvents?.length ? tideStateAt(tideEvents, when) : null,
    wind: { speed: num(w.wind_speed_10m), gust: num(w.wind_gusts_10m), dir: num(w.wind_direction_10m) },
    wave: { height: num(m.wave_height), period: num(m.wave_period) },
    sstF: cToF(num(m.sea_surface_temperature)),
    pressureTrend: wxJson ? pressureTrend(wxJson, when) : null,
    alerts,
  }
}

export function sampleConditions(marineJson, wxJson, when) {
  const m = marineJson ? sampleHourly(marineJson, when) : {}
  const w = wxJson ? sampleHourly(wxJson, when) : {}
  const sst = cToF(num(m.sea_surface_temperature))
  return {
    waveFt: num(m.wave_height),
    wavePeriod: num(m.wave_period),
    waveDir: num(m.wave_direction),
    swellFt: num(m.swell_wave_height),
    sstF: sst == null ? null : Math.round(sst * 10) / 10,
    windKn: num(w.wind_speed_10m),
    gustKn: num(w.wind_gusts_10m),
    windDir: num(w.wind_direction_10m),
    airF: num(w.temperature_2m),
    pressure: num(w.surface_pressure),
    precipProb: num(w.precipitation_probability),
    weatherCode: num(w.weather_code),
    time: m._time || w._time || null,
  }
}

const meta = (res) => ({
  fetchedAt: res?.fetchedAt ?? null,
  fromCache: res?.fromCache ?? false,
  stale: res?.stale ?? false,
  ok: !!res,
})

export async function loadConditions({ lat, lon, station, zones, days = 4, when = new Date(), forceFresh = false }) {
  const begin = startOfDay()
  // Cache a generous fixed tide window keyed by station+day only, so any `days`
  // value reads the same cache — offline stays bulletproof across screens.
  const tideEnd = addDays(begin, 16)
  const omDays = Math.min(days + 1, 7)

  const [tideRes, marineRes, wxRes, alertRes] = await Promise.all([
    safe(() => cachedFetch({ key: `tides:${station}:${ymd(begin)}`, source: 'tides', maxAgeMs: 6 * 3600e3, forceFresh, fetcher: () => fetchTidePredictions(station, begin, tideEnd) })),
    safe(() => cachedFetch({ key: `marine:${r2(lat)},${r2(lon)}`, source: 'marine', maxAgeMs: 60 * 60e3, forceFresh, fetcher: () => fetchMarine(lat, lon, omDays) })),
    safe(() => cachedFetch({ key: `wx:${r2(lat)},${r2(lon)}`, source: 'wx', maxAgeMs: 60 * 60e3, forceFresh, fetcher: () => fetchWeather(lat, lon, omDays) })),
    safe(() => cachedFetch({ key: `alerts:${zones.join(',')}`, source: 'alerts', maxAgeMs: 30 * 60e3, forceFresh, fetcher: () => fetchAlerts(zones) })),
  ])

  const tideEvents = tideRes?.data ? parseHiLo(tideRes.data) : []
  const marineJson = marineRes?.data || null
  const wxJson = wxRes?.data || null
  const alerts = alertRes?.data ? parseAlerts(alertRes.data) : []

  const outlook = []
  for (let i = 0; i < days; i++) {
    const day = addDays(begin, i)
    const solunar = solunarDay(day, lat, lon)
    const dayTide = eventsForDay(tideEvents, day)
    const windows = buildBiteWindows(solunar, dayTide)
    const sampleWhen = windows[0]?.center || new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12)
    const s = computeMomentScore(buildSample({ when: sampleWhen, solunar, tideEvents: dayTide, marineJson, wxJson, alerts }))
    outlook.push({ date: day, solunar, tideEvents: dayTide, windows, score: s.score, verdict: s.verdict })
  }

  const today = outlook[0]
  const nowScore = computeMomentScore(buildSample({ when, solunar: today.solunar, tideEvents: today.tideEvents, marineJson, wxJson, alerts }))
  const nextWindow = today.windows.filter((w) => w.end >= when).sort((a, b) => a.start - b.start)[0] || null

  return {
    when,
    lat,
    lon,
    nowScore,
    nowConditions: sampleConditions(marineJson, wxJson, when),
    tideNow: today.tideEvents.length ? tideStateAt(today.tideEvents, when) : null,
    alerts,
    today,
    outlook,
    nextWindow,
    sources: { tides: meta(tideRes), marine: meta(marineRes), wx: meta(wxRes), alerts: meta(alertRes) },
  }
}
