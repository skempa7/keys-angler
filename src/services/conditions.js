// Orchestrator: fetch (or load from cache) every data source for a location + day
// window, then assemble the derived intelligence the UI consumes. Resilient — a
// single failed/offline source degrades gracefully; sun/moon/tide math is local.
import { cachedFetch } from './cache.js'
import { fetchTidePredictions } from './tides.js'
import { fetchMarine, fetchWeather, sampleHourly, pressureTrend, stormOutlook, dailyWeather, hourlyWeather } from './marine.js'
import { fetchAlerts, parseAlerts, fetchMarineForecastText, fetchBuoy } from './nws.js'
import { OBS_STATIONS, tideStation, distanceNm } from '../data/stations.js'
import { parseHiLo, eventsForDay, tideStateAt } from '../engine/tideStage.js'
import { solunarDay, activePeriodAt } from '../engine/solunar.js'
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
    currentKn: m.ocean_current_velocity == null ? null : Math.round(num(m.ocean_current_velocity) * 0.539957 * 100) / 100, // km/h → kn
    currentDir: num(m.ocean_current_direction), // degrees the current sets TOWARD
    airF: num(w.temperature_2m),
    feelsF: num(w.apparent_temperature),
    humidity: num(w.relative_humidity_2m),
    uv: num(w.uv_index),
    pressure: num(w.surface_pressure),
    precipProb: num(w.precipitation_probability),
    weatherCode: num(w.weather_code),
    time: m._time || w._time || null,
  }
}

// Home-screen weather panel: current + today's daily summary + an hourly strip.
export function weatherToday(marineJson, wxJson, when, begin) {
  if (!wxJson) return null
  const now = sampleConditions(marineJson, wxJson, when)
  const daily = dailyWeather(wxJson, begin)
  return {
    tempF: now.airF, feelsF: now.feelsF, humidity: now.humidity, uv: now.uv,
    precipProb: now.precipProb, windKn: now.windKn, windDir: now.windDir,
    code: now.weatherCode ?? daily?.code ?? null,
    hiF: daily?.hiF ?? null, loF: daily?.loF ?? null,
    precipMax: daily?.precipMax ?? null, uvMax: daily?.uvMax ?? null,
    hourly: hourlyWeather(wxJson, when, 12),
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

  const [tideRes, marineRes, wxRes, alertRes, cwfRes, buoyRes] = await Promise.all([
    safe(() => cachedFetch({ key: `tides:${station}:${ymd(begin)}`, source: 'tides', maxAgeMs: 6 * 3600e3, forceFresh, fetcher: () => fetchTidePredictions(station, begin, tideEnd) })),
    safe(() => cachedFetch({ key: `marine:${r2(lat)},${r2(lon)}`, source: 'marine', maxAgeMs: 60 * 60e3, forceFresh, fetcher: () => fetchMarine(lat, lon, omDays) })),
    safe(() => cachedFetch({ key: `wx:${r2(lat)},${r2(lon)}`, source: 'wx', maxAgeMs: 60 * 60e3, forceFresh, fetcher: () => fetchWeather(lat, lon, omDays) })),
    safe(() => cachedFetch({ key: `alerts:${zones.join(',')}`, source: 'alerts', maxAgeMs: 30 * 60e3, forceFresh, fetcher: () => fetchAlerts(zones) })),
    safe(() => cachedFetch({ key: 'cwf:KEY', source: 'cwf', maxAgeMs: 60 * 60e3, forceFresh, fetcher: () => fetchMarineForecastText() })),
    safe(() => cachedFetch({ key: 'buoy', source: 'buoy', maxAgeMs: 30 * 60e3, forceFresh, fetcher: () => fetchBuoy(OBS_STATIONS.map((s) => s.id)) })),
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
  today.hourlyScores = Array.from({ length: 24 }, (_, h) => {
    const at = new Date(begin.getFullYear(), begin.getMonth(), begin.getDate(), h, 0, 0)
    const s = computeMomentScore(buildSample({ when: at, solunar: today.solunar, tideEvents: today.tideEvents, marineJson, wxJson, alerts }))
    return { hour: h, score: s.score, tone: s.verdict.tone }
  })
  const nowScore = computeMomentScore(buildSample({ when, solunar: today.solunar, tideEvents: today.tideEvents, marineJson, wxJson, alerts }))
  const nextWindow = today.windows.filter((w) => w.end >= when).sort((a, b) => a.start - b.start)[0] || null
  const marineForecast = cwfRes?.data || null
  const buoyObs = buoyRes?.data || null
  const buoyStation = buoyObs ? OBS_STATIONS.find((s) => s.id === buoyObs.station) : null
  const stormToday = stormOutlook(wxJson, begin)
  const tideStn = tideStation(station)
  const tideStationInfo = tideStn ? { id: tideStn.id, name: tideStn.name, distNm: Math.round(distanceNm(lat, lon, tideStn.lat, tideStn.lon) * 10) / 10 } : null

  return {
    when,
    lat,
    lon,
    nowScore,
    nowConditions: sampleConditions(marineJson, wxJson, when),
    weatherToday: weatherToday(marineJson, wxJson, when, begin),
    pressureTrend: wxJson ? pressureTrend(wxJson, when) : null,
    tideNow: today.tideEvents.length ? tideStateAt(today.tideEvents, when) : null,
    tideStation: tideStationInfo,
    alerts,
    marineForecast,
    buoy: buoyObs ? { ...buoyObs, name: buoyStation?.name, distNm: buoyStation?.distNm } : null,
    stormToday,
    today,
    outlook,
    nextWindow,
    sources: { tides: meta(tideRes), marine: meta(marineRes), wx: meta(wxRes), alerts: meta(alertRes), cwf: meta(cwfRes), buoy: meta(buoyRes) },
  }
}

// One-tap "Download for offline": force-fetch the rolling window under the SAME
// cache keys the app reads, so every core screen renders offshore with no signal.
export async function primeOffline({ lat, lon, station, zones }) {
  const res = await loadConditions({ lat, lon, station, zones, days: 7, when: new Date(), forceFresh: true })
  const sources = res.sources
  return { ok: Object.values(sources).filter((s) => s.ok).length, total: Object.keys(sources).length, sources }
}

// Full live-condition snapshot for one-tap catch logging — captures the WHY, not just the what.
export function snapshotFromConditions(data, coords) {
  const c = data?.nowConditions || {}
  const t = data?.tideNow
  const sol = data?.today?.solunar
  const active = sol ? activePeriodAt(sol, data.when) : null
  return {
    lat: coords?.lat ?? null,
    lon: coords?.lon ?? null,
    tide: t ? t.direction.charAt(0).toUpperCase() + t.direction.slice(1) : '',
    moonPhase: sol?.moon?.phaseName ?? null,
    solunarType: active ? active.period.type : null,
    cond: {
      windKn: c.windKn ?? null, gustKn: c.gustKn ?? null, windDir: c.windDir ?? null,
      waveFt: c.waveFt ?? null, sstF: c.sstF ?? null,
      pressure: c.pressure ?? null, pressureTrend: data?.pressureTrend ?? null,
      tideDir: t?.direction ?? null, tideFlow: t?.flow != null ? Math.round(t.flow * 100) / 100 : null,
    },
  }
}
