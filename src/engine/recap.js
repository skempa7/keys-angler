// Year-in-review stats, computed on-device from the catch log. Honest: small
// samples just show small numbers, no fabricated trends.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
const mode = (arr) => {
  const c = {}; let best = null, n = 0
  for (const v of arr) { if (v == null || v === '') continue; c[v] = (c[v] || 0) + 1; if (c[v] > n) { n = c[v]; best = v } }
  return best ? { value: best, count: n } : null
}

// All-time personal best (longest) per species, with the date it was set.
export function personalBests(catches) {
  const by = {}
  for (const c of catches || []) {
    if (c.lengthIn == null || !c.species) continue
    if (!by[c.species] || c.lengthIn > by[c.species].lengthIn) by[c.species] = { species: c.species, lengthIn: c.lengthIn, at: c.caughtAt }
  }
  return Object.values(by).sort((a, b) => b.lengthIn - a.lengthIn)
}

export function catchYears(catches) {
  return [...new Set((catches || []).map((c) => new Date(c.caughtAt).getFullYear()))].sort((a, b) => b - a)
}

export function computeRecap(catches, year) {
  const list = (catches || []).filter((c) => (year ? new Date(c.caughtAt).getFullYear() === year : true))
  if (!list.length) return null
  const sorted = [...list].sort((a, b) => a.caughtAt - b.caughtAt)
  const speciesCount = {}
  for (const c of list) if (c.species) speciesCount[c.species] = (speciesCount[c.species] || 0) + 1
  const speciesMix = Object.entries(speciesCount).sort((a, b) => b[1] - a[1]).map(([species, count]) => ({ species, count }))
  const withLen = list.filter((c) => c.lengthIn != null)
  const biggest = withLen.length ? withLen.reduce((a, b) => (b.lengthIn > a.lengthIn ? b : a)) : null
  const byMonth = MONTHS.map((month, m) => ({ month, count: list.filter((c) => new Date(c.caughtAt).getMonth() === m).length }))
  const bestMonth = byMonth.reduce((a, b) => (b.count > a.count ? b : a))
  const bestTide = mode(list.map((c) => c.tide))
  const bestMoon = mode(list.map((c) => c.moonPhase))
  const days = [...new Set(list.map((c) => dayKey(c.caughtAt)))]
    .map((k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m, d).getTime() })
    .sort((a, b) => a - b)
  let streak = days.length ? 1 : 0, best = streak
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] <= 86400000 * 1.5) { streak++; best = Math.max(best, streak) } else streak = 1
  }
  return {
    year, total: list.length, daysFished: days.length, species: speciesMix.length, speciesMix,
    biggest, byMonth, bestMonth, bestTide, bestMoon, streak: best,
    first: sorted[0].caughtAt, last: sorted[sorted.length - 1].caughtAt,
  }
}
