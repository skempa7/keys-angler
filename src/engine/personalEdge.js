// Personal edge + calibration from the on-device catch log — the thing no generic
// app can do, because it doesn't have HIS fish. Grows with use.

// Strongest actionable pattern: the species he most reliably boats on a given tide.
export function topTidePattern(catches, minN = 4) {
  const by = {}
  for (const c of catches) {
    const raw = c.cond?.tideDir || (c.tide ? c.tide.toLowerCase() : '')
    const dir = /out/.test(raw) ? 'outgoing' : /in/.test(raw) ? 'incoming' : null
    if (!dir || !c.species) continue
    const t = by[c.species] || (by[c.species] = { incoming: 0, outgoing: 0, total: 0 })
    t[dir]++; t.total++
  }
  let best = null
  for (const [species, t] of Object.entries(by)) {
    if (t.total < minN) continue
    const dir = t.outgoing >= t.incoming ? 'outgoing' : 'incoming'
    const hits = t[dir]
    const rate = hits / t.total
    if (rate >= 0.6 && (!best || hits > best.hits)) best = { species, dir, hits, total: t.total, rate }
  }
  return best
}

// Is his strongest pattern live right now?
export function edgeNow(catches, tideNow) {
  const pattern = topTidePattern(catches)
  if (!pattern) return null
  return { pattern, currentDir: tideNow?.direction || null, match: tideNow?.direction === pattern.dir }
}

// Does the score track his reality? (Only meaningful once he's logged a few with a score stamp.)
export function calibration(catches) {
  const scored = catches.filter((c) => typeof c.scoreAtCatch === 'number')
  if (scored.length < 3) return null
  const avg = Math.round(scored.reduce((s, c) => s + c.scoreAtCatch, 0) / scored.length)
  const good = scored.filter((c) => c.scoreAtCatch >= 60).length
  return { n: scored.length, avg, pctGood: Math.round((good / scored.length) * 100) }
}
