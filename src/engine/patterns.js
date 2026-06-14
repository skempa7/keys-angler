// Personal pattern learning over the on-device catch log. Surfaces the angler's
// OWN edge ("permit on the outgoing tide 4 of 5 times") — the thing no generic app has.

export const hourBucket = (ms) => {
  const h = new Date(ms).getHours()
  if (h >= 5 && h < 8) return 'dawn'
  if (h < 11) return 'morning'
  if (h < 15) return 'midday'
  if (h < 18) return 'afternoon'
  if (h < 21) return 'dusk'
  return 'after dark'
}

function mode(values) {
  const counts = {}
  let best = null, bestN = 0, total = 0
  for (const v of values) {
    if (v == null || v === '') continue
    total++
    counts[v] = (counts[v] || 0) + 1
    if (counts[v] > bestN) { bestN = counts[v]; best = v }
  }
  return best == null ? null : { value: best, count: bestN, total }
}

// Per-species insights (only species with enough data to be meaningful).
export function speciesPatterns(catches, minSamples = 3) {
  const by = {}
  for (const c of catches) (by[c.species] || (by[c.species] = [])).push(c)

  const out = []
  for (const [species, list] of Object.entries(by)) {
    if (list.length < minSamples) continue
    const insights = []
    const tide = mode(list.map((c) => c.tide))
    if (tide && tide.count >= Math.ceil(tide.total / 2) && tide.count >= 2)
      insights.push(`${tide.count} of ${tide.total} on the ${tide.value.toLowerCase()} tide`)
    const time = mode(list.map((c) => hourBucket(c.caughtAt)))
    if (time && time.count >= 2) insights.push(`most often at ${time.value}`)
    const moon = mode(list.map((c) => c.moonPhase))
    if (moon && moon.count >= 2) insights.push(`favors the ${moon.value.toLowerCase()}`)
    const zone = mode(list.map((c) => c.zone))
    if (zone && zone.count >= 2 && zone.total > zone.count) insights.push(`mostly ${zone.value}`)
    out.push({ species, count: list.length, insights })
  }
  return out.sort((a, b) => b.count - a.count)
}

export function overallStats(catches) {
  const species = new Set(catches.map((c) => c.species))
  const biggest = catches.reduce((m, c) => (c.lengthIn && c.lengthIn > (m?.lengthIn || 0) ? c : m), null)
  return { total: catches.length, species: species.size, biggest }
}

// Hour-of-day histogram (private "when do I catch fish" heatmap).
export function hourHistogram(catches) {
  const buckets = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'after dark']
  const counts = Object.fromEntries(buckets.map((b) => [b, 0]))
  for (const c of catches) counts[hourBucket(c.caughtAt)]++
  const max = Math.max(1, ...Object.values(counts))
  return buckets.map((b) => ({ label: b, count: counts[b], pct: counts[b] / max }))
}
