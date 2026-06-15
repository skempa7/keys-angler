// Tackle load-out: turn a species' KB rig/leader/lures into a "what to bring" list of
// rod / reel / line / leader / lures / terminal, each cross-checked against the gear
// locker (db.gear) so you can see what you own vs. what's missing. Generalizes the
// one-off fly-gear flag in Species.jsx into a full category matrix. Heuristic from
// expert prose — labels are suggestions; the verbatim leader/rig text is the truth.

const FLY_RE = /\bfly\b|\b\d{1,2}\s?wt\b/i
// "wire" alone is ambiguous (light-wire hooks); require the heavy-outfit cues.
const HEAVY_RE = /troll|kite|planer|conventional|stand-?up|lever[- ]drag|electric reel|wire leader|single-strand wire/i

// gearCat MUST equal the fixed GearLocker CATEGORIES strings — keep in sync.
const LOADOUT_SLOTS = [
  { key: 'rod', label: 'Rod', gearCat: 'Rods' },
  { key: 'reel', label: 'Reel', gearCat: 'Reels' },
  { key: 'line', label: 'Main line', gearCat: 'Line' },
  { key: 'leader', label: 'Leader', gearCat: 'Leaders' },
  { key: 'lures', label: 'Lures / flies', gearCat: 'Lures / flies' },
  { key: 'rig', label: 'Rig / terminal', gearCat: 'Bait rigs' },
]

// Split off the first clause. `sep` controls the delimiter — leaders split on , ; only
// (periods appear in abbreviations like "No. 7 wire"); rigs split on . ; for full sentences.
const clause = (t, sep, cap) => {
  const c = (t || '').split(sep)[0].trim()
  return c.length > cap ? c.slice(0, cap - 1) + '…' : c
}

export function buildLoadout(species, gear) {
  // Classify the PRIMARY outfit from the rig text (where the rod/reel is described);
  // lures may mention a fly as an option, which must not flip a spinning setup to fly.
  const rig = species.rig || ''
  const isFly = FLY_RE.test(rig)
  const isHeavy = !isFly && HEAVY_RE.test(rig)
  const cls = isFly ? 'fly' : isHeavy ? 'conventional' : 'spinning'
  const leaderLb = (species.leader || '').match(/(\d{2,3})\s?lb/)
  const wire = /wire/i.test(species.leader || '')

  const recs = {
    rod: isFly ? '8–10 wt fly rod' : isHeavy ? 'Conventional / trolling rod' : 'Spinning rod',
    reel: isFly ? 'Fly reel w/ sealed drag' : isHeavy ? 'Conventional / lever-drag reel' : 'Spinning reel',
    line: isFly ? 'Fly line + backing' : leaderLb ? `${Math.max(10, +leaderLb[1] - 5)}–${leaderLb[1]} lb braid` : 'Braid, matched to leader',
    leader: clause(species.leader, /[;,]/, 72) || (wire ? 'Single-strand wire' : 'Fluorocarbon leader, match the bite'),
    lures: (species.lures || []).slice(0, 3).join(' · '),
    rig: clause(species.rig, /[.;]/, 80),
  }

  const slots = LOADOUT_SLOTS.map((slot) => {
    const rec = recs[slot.key]
    if (!rec) return null // e.g. no lures listed
    const flyReq = isFly && (slot.key === 'rod' || slot.key === 'reel' || slot.key === 'line')
    const matched = (gear || []).find((g) => g.category === slot.gearCat && (!flyReq || FLY_RE.test(`${g.name || ''} ${g.detail || ''} ${g.category}`)))
    return { key: slot.key, label: slot.label, rec, gearCat: slot.gearCat, owned: !!matched, ownedItem: matched?.name || null }
  }).filter(Boolean)

  return { slots, gearEmpty: (gear || []).length === 0, cls }
}

// Union the load-outs of several targets into one trip checklist (category-level ownership).
export function mergeLoadouts(speciesArr, gear) {
  const bySlot = {}
  const seen = new Set()
  for (const sp of speciesArr) {
    if (!sp || seen.has(sp.id)) continue
    seen.add(sp.id)
    for (const s of buildLoadout(sp, gear).slots) {
      const e = bySlot[s.key] || (bySlot[s.key] = { key: s.key, label: s.label, gearCat: s.gearCat, neededBy: [], recExamples: [] })
      const fish = sp.name.split(' ')[0]
      if (!e.neededBy.includes(fish)) e.neededBy.push(fish)
      if (s.rec && e.recExamples.length < 2 && !e.recExamples.includes(s.rec)) e.recExamples.push(s.rec)
    }
  }
  const slots = Object.values(bySlot).map((e) => ({ ...e, owned: (gear || []).some((g) => g.category === e.gearCat) }))
  return { slots, ownedCount: slots.filter((s) => s.owned).length, neededCount: slots.length, gearEmpty: (gear || []).length === 0 }
}
