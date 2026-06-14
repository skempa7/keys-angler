// Transparent composite "Should I go?" score (0–100). Every factor is weighted,
// scored 0..1, and carries a plain-language explanation — no black box.
// Marine warnings apply a safety override on top.
import { activePeriodAt } from './solunar.js'

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
// Linear ramp from y0 (at x0) down to y1 (at x1).
const ramp = (x, x0, x1, y0 = 1, y1 = 0) => {
  if (x <= x0) return y0
  if (x >= x1) return y1
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}
// 0 at lo/hi, 1 at peak (used for "ideal band" factors).
const tri = (x, peak, lo, hi) => {
  if (x <= lo || x >= hi) return 0
  return x < peak ? (x - lo) / (peak - lo) : (hi - x) / (hi - peak)
}

const factor = (key, label, weight, score, detail) => {
  const s = clamp(score)
  return { key, label, weight, score: s, contribution: weight * s, detail }
}

function lightFactor(when, sun) {
  if (!sun?.rise || !sun?.set) return { score: 0.6, detail: 'Daylight timing unavailable.' }
  const t = when.getTime()
  const toRise = Math.abs(t - sun.rise.getTime()) / 60000
  const toSet = Math.abs(t - sun.set.getTime()) / 60000
  const near = Math.min(toRise, toSet)
  const isDay = t >= sun.rise.getTime() && t <= sun.set.getTime()
  if (near <= 75) return { score: 1, detail: toRise < toSet ? 'Sunrise low-light window — prime.' : 'Sunset low-light window — prime.' }
  if (!isDay) return { score: 0.58, detail: 'After dark — strong for tarpon & snook on the lights.' }
  return { score: ramp(near, 75, 360, 1, 0.42), detail: 'Daylight — midday bite is typically slower.' }
}

// sample: { when, solunar, tideState, wind:{speed,gust,dir}, wave:{height,period},
//           sstF, pressureTrend, sun:{rise,set}, alerts:[{event,...}] }
export function computeMomentScore(sample) {
  const f = []

  // Solunar period (in/near a major or minor) + the day's lunar strength.
  const active = sample.solunar ? activePeriodAt(sample.solunar, sample.when) : null
  const lunar = sample.solunar?.lunarStrength ?? 0.5
  const periodPart = active ? (active.period.type === 'major' ? 1 : 0.6) * (0.6 + 0.4 * active.centrality) : 0.12
  f.push(factor('solunar', 'Solunar period', 22, 0.62 * periodPart + 0.38 * lunar,
    active ? `In a ${active.period.type} period — ${active.period.label.toLowerCase()}.` : 'No active solunar feeding period right now.'))

  // Tide movement (fish feed on moving water).
  const ts = sample.tideState
  f.push(factor('tide', 'Tide movement', 20, ts ? 0.22 + 0.78 * ts.flow : 0.4,
    ts ? `${ts.label}.${ts.minutesToChange < 90 ? ` Change in ~${ts.minutesToChange} min.` : ''}` : 'Tide data unavailable.'))

  // Wind (calm is better; >25 kn is rough).
  const wind = sample.wind?.speed
  f.push(factor('wind', 'Wind', 16, wind == null ? 0.6 : ramp(wind, 8, 25),
    wind == null ? 'No wind data.' : `${Math.round(wind)} kn${sample.wind.gust ? `, gusts ${Math.round(sample.wind.gust)} kn` : ''}.`))

  // Sea state.
  const wave = sample.wave?.height
  f.push(factor('sea', 'Sea state', 9, wave == null ? 0.6 : ramp(wave, 1, 6),
    wave == null ? 'No wave data.' : `${wave.toFixed(1)} ft seas${sample.wave.period ? ` @ ${Math.round(sample.wave.period)} s` : ''}.`))

  // Water temperature (Keys sweet spot ~79°F).
  const sst = sample.sstF
  f.push(factor('waterTemp', 'Water temp', 10, sst == null ? 0.6 : 0.3 + 0.7 * tri(sst, 79, 66, 92),
    sst == null ? 'No water-temp data.' : `${Math.round(sst)}°F.`))

  // Light / time of day.
  const light = lightFactor(sample.when, sample.sun)
  f.push(factor('light', 'Light / time of day', 8, light.score, light.detail))

  // Moon phase (new & full = peak).
  f.push(factor('moon', 'Moon phase', 8, 0.4 + 0.6 * lunar,
    sample.solunar ? `${sample.solunar.moon.phaseName}, ${Math.round(sample.solunar.moon.illum * 100)}% lit.` : 'Moon data unavailable.'))

  // Barometric trend (falling ahead of a front turns fish on; sharp rise slows them).
  const pt = sample.pressureTrend
  const presScore = pt == null ? 0.6 : pt < -1.5 ? 0.95 : pt < -0.4 ? 0.8 : pt < 0.4 ? 0.6 : pt < 1.5 ? 0.45 : 0.3
  f.push(factor('pressure', 'Barometric trend', 7, presScore,
    pt == null ? 'No pressure trend.' : pt < -0.4 ? `Falling (${pt.toFixed(1)} hPa/6h) — often turns fish on.` : pt > 0.4 ? `Rising (+${pt.toFixed(1)} hPa/6h) — can slow the bite.` : 'Steady pressure.'))

  let total = f.reduce((s, x) => s + x.contribution, 0)

  // Safety override from active marine alerts.
  const safety = []
  for (const a of sample.alerts || []) {
    const e = (a.event || '').toLowerCase()
    if (e.includes('hurricane') || e.includes('storm warning') || e.includes('gale') || e.includes('hazardous seas')) {
      total = Math.min(total, 14)
      safety.push({ level: 'danger', text: a.event })
    } else if (e.includes('small craft')) {
      total = Math.min(total * 0.65, total - 15)
      safety.push({ level: 'warn', text: a.event })
    } else if (e.includes('advisory') || e.includes('statement') || e.includes('warning')) {
      safety.push({ level: 'info', text: a.event })
    }
  }

  total = clamp(Math.round(total), 0, 100)
  return { score: total, verdict: verdictFor(total, safety), factors: f, safety }
}

function verdictFor(total, safety) {
  if (safety.some((s) => s.level === 'danger')) return { label: 'Dangerous — stay in', tone: 'bad' }
  if (total >= 78) return { label: 'Prime — go now', tone: 'good' }
  if (total >= 60) return { label: 'Good window', tone: 'ok' }
  if (total >= 42) return { label: 'Fair', tone: 'caution' }
  if (total >= 25) return { label: 'Tough bite', tone: 'poor' }
  return { label: 'Save the fuel', tone: 'bad' }
}
