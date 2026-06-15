// Honest personal-edge callouts from the catch log. We can't measure true effort,
// so these are DESCRIPTIVE ("of your logged fish…") with a lift vs even-odds and a
// visible sample size — no predictive over-claim, and sample-gated so thin data
// stays quiet. The keystone the anomaly cards + future tuned forecast build on.

const tideBucket = (c) => { const r = c.cond?.tideDir || (c.tide || '').toLowerCase(); return /out/.test(r) ? 'on the outgoing tide' : /in/.test(r) ? 'on the incoming tide' : null }
const pressBucket = (c) => { const p = c.cond?.pressureTrend; if (p == null) return null; return p <= -0.7 ? 'on a falling barometer' : p >= 0.7 ? 'on a rising barometer' : 'on steady pressure' }
const moonBucket = (c) => { const m = c.moonPhase; if (!m) return null; return /New/.test(m) ? 'on a new moon' : /Full/.test(m) ? 'on a full moon' : /Quarter/.test(m) ? 'on a quarter moon' : /Waxing/.test(m) ? 'on a waxing moon' : /Waning/.test(m) ? 'on a waning moon' : null }
const timeBucket = (c) => { const h = new Date(c.caughtAt).getHours(); return h >= 5 && h < 8 ? 'at first light' : h < 11 ? 'in the morning' : h < 15 ? 'midday' : h < 18 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'after dark' }

const DIMS = [
  { key: 'tide', fn: tideBucket }, { key: 'pressure', fn: pressBucket },
  { key: 'moon', fn: moonBucket }, { key: 'time', fn: timeBucket },
]

function dimInsight(catches, fn) {
  const buckets = {}; let n = 0
  for (const c of catches) { const b = fn(c); if (!b) continue; buckets[b] = (buckets[b] || 0) + 1; n++ }
  const keys = Object.keys(buckets)
  if (n < 6 || keys.length < 2) return null
  let top = null, topN = 0
  for (const [k, v] of Object.entries(buckets)) if (v > topN) { topN = v; top = k }
  const share = topN / n, lift = share * keys.length
  if (lift < 1.35) return null
  const strength = lift >= 1.9 && n >= 12 ? 'Strong' : lift >= 1.55 ? 'Worth noting' : 'Early signal'
  return { title: `${Math.round(share * 100)}% of your fish come ${top}`, detail: `${lift.toFixed(1)}× even odds · ${n} logged`, strength, score: lift * Math.log(n + 1) }
}

// The biggest quarter of your fish — what condition do they share?
function bigFishInsight(catches) {
  const withLen = catches.filter((c) => c.lengthIn != null)
  if (withLen.length < 8) return null
  const sorted = [...withLen].sort((a, b) => b.lengthIn - a.lengthIn)
  const top = sorted.slice(0, Math.max(3, Math.round(sorted.length / 4)))
  for (const { fn } of DIMS) {
    const buckets = {}
    for (const c of top) { const b = fn(c); if (b) buckets[b] = (buckets[b] || 0) + 1 }
    const entries = Object.entries(buckets)
    if (!entries.length) continue
    const [bucket, cnt] = entries.sort((a, b) => b[1] - a[1])[0]
    if (cnt / top.length >= 0.6) return { title: `Your biggest fish run ${bucket}`, detail: `${cnt} of your top ${top.length} by length`, strength: 'Worth noting', score: 5 }
  }
  return null
}

export function insights(catches) {
  const list = catches || []
  const out = DIMS.map((d) => dimInsight(list, d.fn)).filter(Boolean)
  const big = bigFishInsight(list)
  if (big) out.push(big)
  return out.sort((a, b) => b.score - a.score).slice(0, 4)
}
