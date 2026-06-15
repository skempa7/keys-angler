// Today's bait board: from the fish that are biting RIGHT NOW (in-season + temp-fit),
// rank the baits/lures to tie on, nudged by live water clarity/tide/temp and floated
// to the top by what the angler has personally scored on. Reuses the species KB +
// BAIT_TAGS + the personal catch log. Quantity/condition heuristic, not gospel.
import { BAIT_TAGS } from '../data/species.js'

// Same normalization as tripTargets.baitList so KB baits, logged bait text, and tag
// keys all unify ('live pilchards (whitebait)' / 'pilchards' / 'pilchard').
const norm = (s) => (s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9 /-]/g, '').trim()
// dominant noun: drop a leading size/state qualifier so 'live shrimp' ≡ 'shrimp'.
const firstNoun = (s) => norm(s).split(/ - | – /)[0].replace(/^(live|dead|fresh|frozen|jumbo|small|large|whole|cut|select)\s+/, '').trim()

// Water-clarity PROXY from wind/wave/precip — a soft nudge, never a measurement.
export function deriveClarity({ windKn, waveFt, precipProb } = {}) {
  if (windKn == null && waveFt == null && precipProb == null) return null
  let adverse = 0
  if (waveFt != null && waveFt >= 3) adverse++
  if (windKn != null && windKn >= 18) adverse++
  if (precipProb != null && precipProb >= 60) adverse++
  return adverse >= 2 ? 'stained' : adverse === 1 ? 'moderate' : 'clean'
}

// Personal bait scoreboard from the catch log (shared with CatchLog's board).
export function personalBaitCounts(catches) {
  const map = {}
  for (const c of catches || []) {
    const b = (c.bait || '').trim(); if (!b) continue
    const key = firstNoun(b)
    const e = map[key] || (map[key] = { label: b, n: 0, best: 0, species: new Set() })
    e.n++
    if ((c.lengthIn || 0) > e.best) e.best = c.lengthIn || 0
    if (c.species) e.species.add(c.species)
  }
  return map
}

const tagFor = (key) => {
  for (const [k, tag] of Object.entries(BAIT_TAGS)) if (key.includes(k)) return tag
  return null
}

export function buildBaitBoard({ hotSpecies, conditions, tideNow, catches } = {}) {
  if (!hotSpecies || !hotSpecies.length) return []
  const clarity = deriveClarity(conditions || {})
  const sstF = conditions?.sstF
  const moving = tideNow ? !tideNow.atSlack : null
  const band = sstF == null ? null : sstF >= 78 ? 'warm' : sstF <= 72 ? 'cool' : 'mid'
  const personal = personalBaitCounts(catches)

  // Union baits + lures across the hot species.
  const map = {}
  for (const s of hotSpecies) {
    const add = (raw, kind) => {
      const key = firstNoun(raw); if (!key) return
      const e = map[key] || (map[key] = { label: raw.replace(/\s*\(.*?\)\s*/g, ' ').trim(), kind, species: new Set() })
      e.species.add(s.name.split(' ')[0])
    }
    for (const b of s.baits || []) add(b, 'bait')
    for (const l of s.lures || []) add(l, 'lure')
  }

  const rows = Object.entries(map).map(([key, e]) => {
    const tag = tagFor(key)
    let fit
    if (!tag) {
      fit = 1.5 // untagged sits mid-pack
    } else {
      fit = 0
      // clarity
      if (!tag.clarity || tag.clarity === 'any' || clarity == null || tag.clarity === clarity) fit += 1
      else if (tag.clarity === 'clean' && clarity === 'stained') fit += 0
      else fit += 0.5
      // tide
      if (!tag.tide || tag.tide === 'any' || moving == null) fit += 1
      else if (tag.tide === 'moving' && moving) fit += 1
      else fit += 0.3
      // temp
      if (!tag.temp || tag.temp === 'any' || band == null) fit += 1
      else if (tag.temp === band) fit += 1
      else fit += 0.4
    }
    const mine = personal[key] || null
    const bonus = mine ? Math.log(mine.n + 1) * 2 : 0
    const reason = mine && mine.n >= 2 ? `you · ${mine.n} fish`
      : tag?.note || (e.species.size > 1 ? `${e.species.size} hot species` : '')
    return { key, label: e.label, kind: e.kind, tag, fit, mine, reason, shareCount: e.species.size, rank: bonus + fit }
  })

  rows.sort((a, b) => b.rank - a.rank || b.shareCount - a.shareCount || a.label.localeCompare(b.label))
  return rows.slice(0, 6).map((r, i) => ({ ...r, top: i === 0 }))
}
