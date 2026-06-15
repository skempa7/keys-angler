// "Did the called window pay off?" — a personal hit-rate: of your recent logged fish,
// how many landed inside a called solunar feeding period. Reads the solunarType field
// every catch is stamped with at log time, so it works on the whole corpus with no
// reconstruction. Honest framing: descriptive (effort outside windows isn't tracked),
// not a precision/recall claim. Gated so thin data stays quiet.

export function windowVerdict(catches, { window = 10, minEligible = 6 } = {}) {
  // A catch counts only if it has a timestamp AND a computed solunarType (in-app catches
  // always do; imported/legacy rows without the field are excluded, not counted as misses).
  const eligible = (catches || []).filter((c) => c && typeof c.caughtAt === 'number' && c.solunarType !== undefined)
  const allN = eligible.length
  if (allN < minEligible) return null

  const isHit = (c) => c.solunarType === 'major' || c.solunarType === 'minor'
  const recent = [...eligible].sort((a, b) => b.caughtAt - a.caughtAt).slice(0, window)
  const n = recent.length
  const hits = recent.filter(isHit).length
  const pct = Math.round((100 * hits) / n)
  const allHits = eligible.filter(isHit).length
  const strength = pct >= 60 ? 'Strong' : pct >= 40 ? 'Worth noting' : 'Early signal'
  return { eligible: allN, window: n, hits, pct, allHits, allN, strength, basis: 'feeding window' }
}
