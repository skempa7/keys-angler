// Ranked daily bite windows. Candidate windows come from solunar majors/minors and
// tide changes; overlapping candidates merge into one "stacked" window (the expert
// edge — e.g. a major period landing on the outgoing tide at sunrise). Each window's
// score is fully additive and every contributor is labeled with its points.
import { tideStateAt, tideChangeWindows } from './tideStage.js'

const overlaps = (a, b) => a.start < b.end && b.start < a.end

function lowLight(center, sun) {
  if (!sun?.rise || !sun?.set) return { points: 0 }
  const t = center.getTime()
  const near = Math.min(Math.abs(t - sun.rise.getTime()), Math.abs(t - sun.set.getTime())) / 60000
  const isDay = t >= sun.rise.getTime() && t <= sun.set.getTime()
  if (near <= 75) return { points: 18, label: 'Dawn/dusk low-light feed' }
  if (!isDay) return { points: 5, label: 'After dark (lights/flats)' }
  return { points: 0 }
}

const strengthBand = (s) => (s >= 72 ? 'Prime' : s >= 55 ? 'Strong' : s >= 38 ? 'Fair' : 'Slow')

function scoreWindow(cluster, solunar, dayTideEvents) {
  const center = new Date((cluster.start.getTime() + cluster.end.getTime()) / 2)
  const triggers = []
  let score = 0

  const major = cluster.parts.find((p) => p.kind === 'major')
  const minor = cluster.parts.find((p) => p.kind === 'minor')
  const change = cluster.parts.find((p) => p.kind === 'tideChange')

  if (major) { score += 34; triggers.push({ label: `${major.label} (major solunar)`, points: 34 }) }
  else if (minor) { score += 20; triggers.push({ label: `${minor.label} (minor solunar)`, points: 20 }) }

  const ts = tideStateAt(dayTideEvents, center)
  if (ts) {
    const tp = Math.round(20 * ts.flow)
    if (tp >= 4) {
      score += tp
      triggers.push({ label: `${ts.direction === 'incoming' ? 'Incoming' : 'Outgoing'} tide, ${ts.flow > 0.6 ? 'strong' : 'moderate'} flow`, points: tp })
    }
  }
  if (change) { score += 12; triggers.push({ label: change.label, points: 12 }) }

  const ll = lowLight(center, solunar.sun)
  if (ll.points > 0) { score += ll.points; triggers.push({ label: ll.label, points: ll.points }) }

  const lunarPts = Math.round(16 * solunar.lunarStrength)
  if (lunarPts >= 3) { score += lunarPts; triggers.push({ label: `${solunar.moon.phaseName} — peak solunar day`, points: lunarPts }) }

  score = Math.min(100, Math.round(score))
  return { start: cluster.start, end: cluster.end, center, score, strength: strengthBand(score), triggers, tide: ts }
}

// solunar: from solunarDay(); dayTideEvents: hi/lo events for THIS day only.
export function buildBiteWindows(solunar, dayTideEvents) {
  const candidates = [
    ...solunar.majors.map((p) => ({ start: p.start, end: p.end, kind: 'major', label: p.label })),
    ...solunar.minors.map((p) => ({ start: p.start, end: p.end, kind: 'minor', label: p.label })),
    ...tideChangeWindows(dayTideEvents).map((w) => ({ start: w.start, end: w.end, kind: 'tideChange', label: w.label })),
  ].sort((a, b) => a.start - b.start)

  const clusters = []
  for (const c of candidates) {
    const last = clusters[clusters.length - 1]
    if (last && overlaps(last, c)) {
      last.start = new Date(Math.min(last.start.getTime(), c.start.getTime()))
      last.end = new Date(Math.max(last.end.getTime(), c.end.getTime()))
      last.parts.push(c)
    } else {
      clusters.push({ start: c.start, end: c.end, parts: [c] })
    }
  }

  return clusters.map((cl) => scoreWindow(cl, solunar, dayTideEvents)).sort((a, b) => b.score - a.score)
}
