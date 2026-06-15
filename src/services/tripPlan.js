// Trip planner data assembly. Builds a full briefing for a FUTURE date + zone and
// caches every source so the plan works offline on the water. Tides resolve up to
// 10 years out; marine/wind forecast only exists ~16 days ahead, alerts ~7 — the
// briefing says so and refreshes closer to the date.
import { cachedFetch } from './cache.js'
import { fetchTidePredictions } from './tides.js'
import { fetchMarine, fetchWeather } from './marine.js'
import { fetchAlerts, parseAlerts } from './nws.js'
import { parseHiLo, eventsForDay } from '../engine/tideStage.js'
import { solunarDay } from '../engine/solunar.js'
import { buildBiteWindows } from '../engine/biteWindows.js'
import { computeMomentScore } from '../engine/score.js'
import { buildSample, sampleConditions } from './conditions.js'
import { ZONE_BY_ID } from '../config.js'
import { getReg, isOpenOn } from '../data/regs.js'

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
const r2 = (x) => Math.round(x * 100) / 100
const startToday = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
const safe = async (f) => { try { return await f() } catch { return null } }

// zone species id → regs id
const REGS_KEY = {
  tarpon: 'tarpon', bonefish: 'bonefish', permit: 'permit', redfish: 'redfish', snook: 'snook',
  yellowtail: 'yellowtail', mutton: 'mutton', grouper: 'red-grouper', hogfish: 'hogfish',
  mahi: 'mahi', sailfish: 'sailfish', tuna: 'blackfin-tuna', wahoo: 'wahoo', kingfish: 'king-mackerel',
}

function speciesBrief(speciesId, date) {
  const reg = getReg(REGS_KEY[speciesId])
  const cr = reg?.season?.kind === 'catch-release'
  const open = cr ? true : reg ? isOpenOn(reg, date) : true
  return {
    id: speciesId,
    name: reg?.name || speciesId,
    status: cr ? 'Catch & release' : open ? 'In season' : 'Closed',
    keepable: !cr && open,
    cr,
  }
}

export async function planTrip({ date, zoneId, lat, lon, station, zones, departISO, tuning = null }) {
  const day0 = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const next = new Date(day0); next.setDate(next.getDate() + 1)
  const daysOut = Math.round((day0 - startToday()) / 86_400_000)
  const inForecast = daysOut >= 0 && daysOut <= 15
  const inAlerts = daysOut >= 0 && daysOut <= 6

  const [tideRes, marineRes, wxRes, alertRes] = await Promise.all([
    safe(() => cachedFetch({ key: `tides:${station}:plan:${ymd(day0)}`, source: 'tides', maxAgeMs: 7 * 24 * 3600e3, fetcher: () => fetchTidePredictions(station, day0, next) })),
    inForecast ? safe(() => cachedFetch({ key: `marine:${r2(lat)},${r2(lon)}`, source: 'marine', maxAgeMs: 60 * 60e3, fetcher: () => fetchMarine(lat, lon, 16) })) : Promise.resolve(null),
    inForecast ? safe(() => cachedFetch({ key: `wx:${r2(lat)},${r2(lon)}`, source: 'wx', maxAgeMs: 60 * 60e3, fetcher: () => fetchWeather(lat, lon, 16) })) : Promise.resolve(null),
    inAlerts ? safe(() => cachedFetch({ key: `alerts:${zones.join(',')}`, source: 'alerts', maxAgeMs: 30 * 60e3, fetcher: () => fetchAlerts(zones) })) : Promise.resolve(null),
  ])

  const tideEvents = tideRes?.data ? eventsForDay(parseHiLo(tideRes.data), day0) : []
  const marineJson = marineRes?.data || null
  const wxJson = wxRes?.data || null
  const alerts = alertRes?.data ? parseAlerts(alertRes.data) : []

  const solunar = solunarDay(day0, lat, lon)
  const windows = buildBiteWindows(solunar, tideEvents)
  const depart = departISO ? new Date(departISO) : windows[0]?.center || new Date(day0.getFullYear(), day0.getMonth(), day0.getDate(), 7)
  const scored = computeMomentScore(buildSample({ when: windows[0]?.center || depart, solunar, tideEvents, marineJson, wxJson, alerts }), tuning)
  const conditions = sampleConditions(marineJson, wxJson, depart)
  const zone = ZONE_BY_ID[zoneId]

  return {
    date: day0,
    zoneId,
    zoneName: zone?.name,
    rig: zone?.rig,
    daysOut,
    forecastAvailable: inForecast,
    score: scored.score,
    verdict: scored.verdict,
    factors: scored.factors,
    safety: scored.safety,
    windows,
    tideEvents,
    sunrise: solunar.sun.rise,
    sunset: solunar.sun.set,
    moon: solunar.moon,
    conditions,
    alerts,
    biting: (zone?.species || []).map((s) => speciesBrief(s, day0)),
    builtAt: Date.now(),
  }
}
