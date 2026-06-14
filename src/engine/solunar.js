// Solunar feeding-period engine (Knight solunar theory), built on offline ephemeris.
//   MAJOR periods (~2 h): centered on the Moon's upper transit (overhead) and
//     lower transit (underfoot / anti-transit) — the strongest daily feeds.
//   MINOR periods (~1 h): centered on moonrise and moonset.
// Day strength peaks near the new & full moon (peak gravitational alignment).
import { dayAstro } from './astro.js'

const MAJOR_HALF_MS = 60 * 60 * 1000 // ±60 min → 2 h window
const MINOR_HALF_MS = 30 * 60 * 1000 // ±30 min → 1 h window

function makeWindow(center, halfMs, type, label) {
  if (!center) return null
  return {
    type,
    label,
    center,
    start: new Date(center.getTime() - halfMs),
    end: new Date(center.getTime() + halfMs),
  }
}

// 0 at the quarters, 1 at new & full moon.
export function lunarDayStrength(phaseDeg) {
  const dist = Math.min(
    Math.abs(phaseDeg - 0),
    Math.abs(phaseDeg - 180),
    Math.abs(phaseDeg - 360),
  ) // 0..90
  return 1 - dist / 90
}

export function solunarDay(date, lat, lon) {
  const a = dayAstro(date, lat, lon)

  const majors = [
    ...a.moon.upperTransits.map((t) => makeWindow(t.time, MAJOR_HALF_MS, 'major', 'Moon overhead')),
    ...a.moon.lowerTransits.map((t) => makeWindow(t.time, MAJOR_HALF_MS, 'major', 'Moon underfoot')),
  ].filter(Boolean)

  const minors = [
    makeWindow(a.moon.rise, MINOR_HALF_MS, 'minor', 'Moonrise'),
    makeWindow(a.moon.set, MINOR_HALF_MS, 'minor', 'Moonset'),
  ].filter(Boolean)

  return {
    date: a.date,
    sun: a.sun,
    moon: a.moon,
    majors,
    minors,
    lunarStrength: lunarDayStrength(a.moon.phaseDeg),
    periods: [...majors, ...minors].sort((x, y) => x.center - y.center),
  }
}

// Is `when` inside a solunar period? Returns the period + how central (0..1).
export function activePeriodAt(solunar, when) {
  const t = when.getTime()
  let best = null
  for (const p of solunar.periods) {
    if (t >= p.start.getTime() && t <= p.end.getTime()) {
      const half = (p.end - p.start) / 2
      const centrality = 1 - Math.abs(t - p.center.getTime()) / half
      if (!best || centrality > best.centrality) best = { period: p, centrality }
    }
  }
  return best
}
