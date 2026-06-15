// Target → best DAY to chase it. Annotates the existing generic outlook[] with the
// species' temp-band fit + its preferred tide direction + open-season, so the same
// 5-day forecast gets re-ranked for ONE fish. ("Best zone" is a no-op — every species
// maps to exactly one zone — so this answers the day, not the zone.)
import { fitOf } from './tripTargets.js'
import { getReg, isOpenOn } from '../data/regs.js'
import { dayLabel } from '../utils/format.js'

// Pull the species' preferred tide direction out of its free-text bestTide.
const prefDir = (bestTide) => {
  const t = (bestTide || '').toLowerCase()
  if (/\b(outgoing|falling|ebb)\b/.test(t)) return 'outgoing'
  if (/\b(incoming|rising|flood)\b/.test(t)) return 'incoming'
  return null // offshore species where current matters more than tide
}
const toneFor = (s) => (s >= 78 ? 'good' : s >= 60 ? 'ok' : s >= 42 ? 'caution' : 'poor')

export function bestDaysFor(species, outlook, sstF) {
  if (!species || !outlook || !outlook.length) return null
  const fit = fitOf(species, sstF)
  const fitMult = fit === 'cool' || fit === 'warm' ? 0.85 : 1.0 // ideal/unknown → no penalty
  const fitPhrase = sstF == null || fit === 'unknown' ? null
    : fit === 'ideal' ? `${Math.round(sstF)}°F in its band`
      : fit === 'cool' ? `${Math.round(sstF)}°F — below its band`
        : `${Math.round(sstF)}°F — above its band`
  const dir = prefDir(species.bestTide)
  const reg = getReg(species.regsKey)
  const gated = !!(reg && reg.season?.kind !== 'catch-release')

  const days = outlook.map((day) => {
    const wins = day.windows || []
    let win = null
    if (dir) win = wins.filter((w) => w.tide?.direction === dir).sort((a, b) => b.score - a.score)[0] || null
    if (!win) win = [...wins].sort((a, b) => b.score - a.score)[0] || null
    const tideMatch = !!(dir && win && win.tide?.direction === dir)
    const closed = gated ? !isOpenOn(reg, day.date) : false
    let adj = day.score * fitMult * (closed ? 0.4 : 1)
    if (tideMatch) adj += 6 // the lever that reorders otherwise-tied days
    adj = Math.round(Math.min(100, adj))
    const lunar = (day.solunar?.lunarStrength ?? 0) >= 0.5 ? day.solunar?.moon?.phaseName : null
    const tidePhrase = win?.tide ? `${win.tide.direction === 'incoming' ? 'Incoming' : 'Outgoing'} tide` : null
    const why = [fitPhrase, tidePhrase, lunar].filter(Boolean)
    return { date: day.date, score: adj, label: dayLabel(adj), tone: toneFor(adj), win, closed, tideMatch, why }
  })

  const allClosed = gated && days.every((d) => d.closed)
  const pool = days.filter((d) => !d.closed)
  const best = (pool.length ? pool : days).reduce((a, b) => (b.score > a.score ? b : a))
  return { best, days, allClosed }
}
