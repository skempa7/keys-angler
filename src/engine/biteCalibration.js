// Self-calibration: nudge the generic score's factor weights toward where THIS angler's
// fish actually come from — with statistical honesty.
//
// CRITICAL: there are NO blank/effort records — every logged catch is a positive event,
// so we CANNOT estimate P(catch | conditions); a naive regression would just relearn where
// he happens to fish. Instead we measure how strongly his fish CONCENTRATE in the part of
// each factor's range the generic model rewards — relative to the AMBIENT mean of that
// factor (its expected sub-score under no preference) — then apply a BOUNDED, shrunk-
// toward-1.0 reliability multiplier. With little data the score is byte-identical to today;
// it bends toward his water only as evidence accumulates, and only when his fish genuinely
// deviate from ambient. Multipliers clamp to [0.6, 1.5] so no factor can dominate or zero out.
//
// Two deliberate exclusions, both because they encode angler CHOICE not bite truth and are
// unidentifiable from positives-only data: (1) the light/time-of-day factor — he fishes
// dawn/dusk by schedule, not because the model's light reward is validated; (2) wind/sea —
// effort-confounded. The calibration pool is also limited to LIVE-logged catches (those
// carry scoreAtCatch + a cond snapshot); manually backdated entries don't tune. This is
// intentional and documented, not a silent gap.

const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const tri = (x, peak, lo, hi) => (x <= lo || x >= hi ? 0 : x < peak ? (x - lo) / (peak - lo) : (hi - x) / (hi - peak))

// Moon phase name → lunar strength (new & full peak, quarters trough). Fallback only —
// live catches now capture the continuous lunarStrength so the reconstruction matches score.js.
const PHASE_STRENGTH = {
  'New Moon': 1, 'Full Moon': 1, 'First Quarter': 0, 'Last Quarter': 0,
  'Waxing Crescent': 0.5, 'Waxing Gibbous': 0.5, 'Waning Gibbous': 0.5, 'Waning Crescent': 0.5,
}

// Recompute the same 0..1 sub-score score.js assigns, from a catch's captured snapshot.
// Returns null when that factor's data is missing for the catch (excluded from its mean).
// NOTE: light/time-of-day is intentionally NOT here — it tracks fishing schedule, not bite.
const SUBSCORE = {
  tide: (c) => (c.cond?.tideFlow != null ? 0.22 + 0.78 * c.cond.tideFlow : null),
  pressure: (c) => { const pt = c.cond?.pressureTrend; return pt == null ? null : pt < -1.5 ? 0.95 : pt < -0.4 ? 0.8 : pt < 0.4 ? 0.6 : pt < 1.5 ? 0.45 : 0.3 },
  waterTemp: (c) => (c.cond?.sstF != null ? 0.3 + 0.7 * tri(c.cond.sstF, 79, 66, 92) : null),
  // continuous lunarStrength when captured (matches score.js); phase-name bucket as fallback.
  moon: (c) => (c.cond?.lunarStrength != null ? 0.4 + 0.6 * c.cond.lunarStrength : (c.moonPhase && PHASE_STRENGTH[c.moonPhase] != null ? 0.4 + 0.6 * PHASE_STRENGTH[c.moonPhase] : null)),
  // null solunarType = caught between feeding periods (a real low value); undefined = no field (skip).
  solunar: (c) => (c.solunarType === undefined ? null : c.solunarType === 'major' ? 0.85 : c.solunarType === 'minor' ? 0.62 : 0.25),
}
// AMBIENT marginal mean of each sub-score (its expected value under no preference) — NOT
// score.js's missing-data fallback. lift = mean/baseline is ~1.0 when his fish are spread
// like the ambient distribution, and only departs when they genuinely concentrate.
//  - tide: flow ~ sin(progress·π), cycle mean 2/π ≈ 0.637 → 0.22+0.78·0.637 ≈ 0.72
//  - waterTemp: Keys season-weighted SST sits near the 79°F peak → ≈ 0.80
//  - moon: continuous lunarStrength averages 0.5 over a synodic month → 0.4+0.6·0.5 = 0.70
//  - solunar: most catches fall between periods → bucket mix mean ≈ 0.40
//  - pressure: steady pressure is the mode → ≈ 0.60
const BASELINE = { tide: 0.72, pressure: 0.6, waterTemp: 0.8, moon: 0.7, solunar: 0.4 }

const K0 = 25 // empirical-Bayes-style shrinkage constant
const MIN_DAYS = 12 // distinct fishing days required before any tuning
const MIN_FACTOR = 6 // usable values required before a single factor tunes

const localDay = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }

export function buildCalibration(catches) {
  const pool = (catches || []).filter((c) => typeof c.scoreAtCatch === 'number' && c.cond)
  const n = pool.length
  const nEff = Math.min(n, new Set(pool.map((c) => localDay(c.caughtAt))).size)

  // Sharpness (cond not required): share of score-stamped catches that read Good+ (60+).
  // Honest framing: this says the model RANKS his productive moments well — NOT a hit-rate.
  const scored = (catches || []).filter((c) => typeof c.scoreAtCatch === 'number')
  const sharpnessPct = scored.length ? Math.round((100 * scored.filter((c) => c.scoreAtCatch >= 60).length) / scored.length) : null

  if (nEff < MIN_DAYS) {
    return { gated: false, tier: 'Learning', n, nEff, need: MIN_DAYS, factorWeights: null, deltas: {}, sharpnessPct }
  }

  const k = nEff / (nEff + K0)
  const factorWeights = {}, deltas = {}
  for (const key of Object.keys(SUBSCORE)) {
    const vals = pool.map((c) => SUBSCORE[key](c)).filter((v) => v != null)
    if (vals.length < MIN_FACTOR) { factorWeights[key] = 1; deltas[key] = 0; continue }
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length
    const lift = clamp(mean / BASELINE[key], 0.5, 2.0)
    const mult = clamp(1 + (lift - 1) * k, 0.6, 1.5)
    factorWeights[key] = Math.round(mult * 1000) / 1000
    deltas[key] = Math.round((mult - 1) * 100)
  }
  return { gated: true, tier: 'Tuned to your water', n, nEff, k: Math.round(k * 100) / 100, factorWeights, deltas, sharpnessPct }
}
