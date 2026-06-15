// Cleaning-table limit checker. Takes a per-species cooler count + party size and
// returns per-species / per-aggregate verdicts (over / at-limit / ok), spots left,
// flagged violations, and a rough fillet-yield total. QUANTITY only — size & season
// legality live in regs.js (we call isOpenOn() to suppress misleading "spots left"
// on a closed-season species). Model verified against regs.js + an FWC cross-check;
// every cap here matches FWC as of REGS_AS_OF 2026-06-14.

import { AGGREGATE_GROUPS, STANDALONE, YIELD_LB } from '../data/aggregates.js'
import { getReg, isOpenOn } from '../data/regs.js'

// true if harvest is allowed today; release-only species are never "open".
function seasonOpen(id, date) {
  const r = getReg(id)
  if (!r) return true
  if (r.season?.kind === 'catch-release') return false
  return isOpenOn(r, date)
}
const isRelease = (id) => getReg(id)?.season?.kind === 'catch-release'

const statusFor = (count, cap) => (count > cap ? 'over' : count === cap ? 'at' : 'ok')

export function computeCooler(counts = {}, partySize = 1, date = new Date()) {
  const party = Math.max(1, Math.floor(Number(partySize)) || 1)

  // --- standalone species (mahi, snook, redfish, tunas, release fish…) ---
  const standalone = []
  for (const s of STANDALONE) {
    const count = counts[s.regsId] || 0
    if (count <= 0) continue

    let cap, capNote, vesselBound = false
    if (s.bag === 0) {
      cap = 0; capNote = 'no harvest — catch & release'
    } else if (s.vesselFloor != null) {
      // "X per angler OR Y per vessel, whichever GREATER" (blackfin tuna).
      const perParty = s.bag * party
      cap = Math.max(perParty, s.vesselFloor)
      vesselBound = s.vesselFloor > perParty
      capNote = `${s.bag}/angler or ${s.vesselFloor}/boat — whichever is greater`
    } else if (s.vessel != null) {
      // hard per-vessel cap can bind below party size (mahi 30, redfish 2).
      const perParty = s.bag * party
      cap = Math.min(perParty, s.vessel)
      vesselBound = s.vessel < perParty
      capNote = `${s.bag}/angler, ${s.vessel}/boat max`
    } else {
      cap = s.bag * party
      capNote = `${s.bag}/angler`
    }

    const release = s.bag === 0 || isRelease(s.regsId)
    const closed = !release && !seasonOpen(s.regsId, date)
    const status = release ? (count > 0 ? 'over' : 'ok') : statusFor(count, cap)
    standalone.push({
      id: s.regsId, name: s.name, count, cap, capNote, vesselBound, release, closed,
      status, spotsLeft: Math.max(0, cap - count), overBy: Math.max(0, count - cap),
    })
  }

  // --- aggregate buckets (snapper-10, grouper-3) ---
  const groups = []
  for (const g of AGGREGATE_GROUPS) {
    const present = g.members.some((m) => (counts[m.regsId] || 0) > 0)
    if (!present) continue

    const cap = g.perPersonLimit * party
    const total = g.members.reduce((t, m) => t + (counts[m.regsId] || 0), 0)

    // combined sub-group sums (e.g. gag + black share one "1 gag-or-black" slot).
    const subSums = {}
    for (const m of g.members) if (m.subGroup) subSums[m.subGroup] = (subSums[m.subGroup] || 0) + (counts[m.regsId] || 0)

    const members = g.members
      .filter((m) => (counts[m.regsId] || 0) > 0)
      .map((m) => {
        const count = counts[m.regsId] || 0
        const name = getReg(m.regsId)?.name || m.regsId
        const closed = !seasonOpen(m.regsId, date)
        let mStatus = 'ok', note = '', sub = null
        if (m.subGroup) {
          const shared = m.sub * party
          const sum = subSums[m.subGroup]
          sub = { kind: 'combined', cap: shared, total: sum }
          mStatus = statusFor(sum, shared)
          if (sum > shared) note = `gag + black over the combined ${m.sub}/angler slot (${sum} of ${shared})`
        } else if (m.sub != null) {
          const subCap = m.sub * party
          sub = { kind: 'sub', cap: subCap, total: count }
          mStatus = statusFor(count, subCap)
          if (count > subCap) note = `over its ${m.sub}/angler sub-limit (${count} of ${subCap})`
        }
        return { id: m.regsId, name, count, status: mStatus, note, sub, closed }
      })

    groups.push({
      id: g.id, name: g.name, total, cap, status: statusFor(total, cap),
      spotsLeft: Math.max(0, cap - total), overBy: Math.max(0, total - cap),
      members, note: g.note,
      // snapper bucket: regs.js omits mangrove/lane/red snapper that also count → headroom is uncertain.
      uncertain: g.id === 'snapper-10',
    })
  }

  // --- rough fillet yield (planning only) ---
  let yieldLb = 0
  for (const [id, n] of Object.entries(counts)) yieldLb += (YIELD_LB[id] || 0) * (n || 0)

  // --- flat violations list (deduped; vessel/aggregate outrank single species) ---
  const seen = new Set()
  const violations = []
  const push = (txt) => { if (txt && !seen.has(txt)) { seen.add(txt); violations.push(txt) } }
  for (const g of groups) {
    if (g.status === 'over') push(`${g.name}: over by ${g.overBy} (${g.total} of ${g.cap})`)
    for (const m of g.members) if (m.status === 'over' && m.note) push(`${m.name}: ${m.note}`)
  }
  for (const s of standalone) {
    if (s.status === 'over') push(s.release ? `${s.name}: catch & release only — can't keep` : `${s.name}: over by ${s.overBy} (${s.count} of ${s.cap})`)
  }

  const totalFish = Object.values(counts).reduce((t, n) => t + (n || 0), 0)
  return { party, standalone, groups, yieldLb: Math.round(yieldLb * 10) / 10, violations, totalFish, legal: violations.length === 0 }
}
