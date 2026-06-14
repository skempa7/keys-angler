// FWC recreational finfish regulations — Florida Keys / Monroe County (Atlantic, SPZ).
// VERIFIED 2026-06-14 from myfwc.com (see DATASOURCES.md). NOT hardcoded blindly:
// every record carries sourceUrl + lastVerified, is editable, and the UI shows a
// "verify with FWC" note. Re-verify each Dec and each May 1 (high-churn seasons).
//
// season.kind: 'year-round' | 'catch-release' | 'seasonal'
//   seasonal uses openRanges (harvest only within) OR closedRanges (harvest except within),
//   each range ['MM-DD','MM-DD'] inclusive, wrapping the new year if start > end.

export const REGS_AS_OF = '2026-06-14'
export const FWC_BASE = 'https://myfwc.com/fishing/saltwater/recreational/'

const KEYS_ZONE = 'Florida Keys / Monroe (Atlantic, SPZ)'

export const FINFISH = [
  {
    id: 'mahi', name: 'Mahi-Mahi (Dolphinfish)', zone: KEYS_ZONE,
    minSizeIn: 20, sizeType: 'fork', bag: 5, vesselLimit: 30,
    season: { kind: 'year-round' },
    rule: '20" fork length min · 5 per person/day, max 30 per vessel · open year-round (Atlantic).',
    keysNote: 'Keys follow the standard Atlantic rule (the Gulf no-size/10-fish rule does not apply here).',
    source: 'dolphinfish/',
  },
  {
    id: 'sailfish', name: 'Sailfish', zone: KEYS_ZONE,
    minSizeIn: 63, sizeType: 'lower-jaw fork', bag: 1,
    season: { kind: 'year-round' }, permit: 'HMS Angling permit required in federal waters',
    rule: '63" lower-jaw fork length min · 1 billfish per person/day · HMS permit (federal).',
    keysNote: 'Almost always released. Counts within the 1 billfish/angler/day Atlantic limit.',
    source: 'billfish-tuna/',
  },
  {
    id: 'blackfin-tuna', name: 'Blackfin Tuna', zone: KEYS_ZONE,
    minSizeIn: null, sizeType: 'none', bag: 2, bagNote: '2 per person OR 10 per vessel, whichever is GREATER',
    season: { kind: 'year-round' },
    rule: 'No minimum size · 2 per person OR 10 per vessel (whichever greater) · no HMS permit · year-round.',
    keysNote: 'No federal permit needed for blackfin (unlike yellowfin).',
    source: 'billfish-tuna/',
  },
  {
    id: 'yellowfin-tuna', name: 'Yellowfin Tuna', zone: KEYS_ZONE,
    minSizeIn: 27, sizeType: 'curved fork', bag: 3,
    season: { kind: 'year-round' }, permit: 'HMS Angling permit required (state & federal)',
    rule: '27" curved fork length min · 3 per person/day · HMS Angling permit required.',
    keysNote: 'Size/bag set by NOAA HMS; FWC defers. Permit required in state AND federal waters.',
    source: 'billfish-tuna/',
  },
  {
    id: 'wahoo', name: 'Wahoo', zone: KEYS_ZONE,
    minSizeIn: null, sizeType: 'none', bag: 2,
    season: { kind: 'year-round' },
    rule: 'No minimum size · 2 per person/day · open year-round.',
    source: 'wahoo/',
  },
  {
    id: 'king-mackerel', name: 'King Mackerel', zone: KEYS_ZONE,
    minSizeIn: 24, sizeType: 'fork', bag: 3,
    season: { kind: 'year-round' },
    rule: '24" fork length min · MONROE COUNTY follows the Gulf limit of 3 per person/day · year-round.',
    keysNote: 'Monroe uniquely uses the Gulf bag (3), not the Atlantic 2.',
    source: 'king-mackerel/',
  },
  {
    id: 'yellowtail', name: 'Yellowtail Snapper', zone: KEYS_ZONE,
    minSizeIn: 12, sizeType: 'total', bag: 10, aggregate: '10-snapper aggregate',
    season: { kind: 'year-round' },
    rule: '12" total length min · within the 10-snapper aggregate bag · year-round.',
    keysNote: 'Special rules apply inside Biscayne National Park.',
    source: 'snappers/',
  },
  {
    id: 'mutton', name: 'Mutton Snapper', zone: KEYS_ZONE,
    minSizeIn: 18, sizeType: 'total', bag: 5, aggregate: 'within 10-snapper aggregate',
    season: { kind: 'year-round' },
    rule: '18" total length min · 5 per person within the 10-snapper aggregate · year-round.',
    keysNote: 'Spawning aggregations near full moon (May–Jul) — fish responsibly.',
    source: 'snappers/',
  },
  {
    id: 'gag-grouper', name: 'Gag Grouper', zone: KEYS_ZONE,
    minSizeIn: 24, sizeType: 'total', bag: 1, aggregate: '1 gag-or-black within 3-grouper aggregate',
    season: { kind: 'seasonal', openRanges: [['05-01', '08-01']] },
    rule: '24" TL min · 1 gag-or-black within the 3-grouper aggregate · OPEN May 1–Aug 1 (2026 state season).',
    keysNote: 'Atlantic gag season can be cut short by FWC Executive Order — verify before a trip.',
    source: 'groupers/',
  },
  {
    id: 'black-grouper', name: 'Black Grouper', zone: KEYS_ZONE,
    minSizeIn: 24, sizeType: 'total', bag: 1, aggregate: '1 gag-or-black within 3-grouper aggregate',
    season: { kind: 'seasonal', openRanges: [['05-01', '12-31']] },
    rule: '24" TL min · 1 gag-or-black within the 3-grouper aggregate · open May 1–Dec 31 (shallow-water closure Jan 1–Apr 30).',
    source: 'groupers/',
  },
  {
    id: 'red-grouper', name: 'Red Grouper', zone: KEYS_ZONE,
    minSizeIn: 20, sizeType: 'total', bag: 3, aggregate: 'within 3-grouper aggregate',
    season: { kind: 'seasonal', openRanges: [['05-01', '12-31']] },
    rule: '20" TL min · up to 3 within the 3-grouper aggregate · open May 1–Dec 31 (shallow-water closure Jan 1–Apr 30).',
    source: 'groupers/',
  },
  {
    id: 'hogfish', name: 'Hogfish', zone: KEYS_ZONE,
    minSizeIn: 16, sizeType: 'fork', bag: 1,
    season: { kind: 'seasonal', openRanges: [['05-01', '10-31']] },
    rule: 'KEYS/Atlantic: 16" fork length min · 1 per person/day · OPEN May 1–Oct 31 only.',
    keysNote: 'Stricter than the Gulf zone (14"/5/year-round). South of Cape Sable uses this rule.',
    source: 'hogfish/',
  },
  {
    id: 'tarpon', name: 'Tarpon', zone: KEYS_ZONE,
    minSizeIn: null, sizeType: 'none', bag: 0,
    season: { kind: 'catch-release' },
    rule: 'Catch-and-release only · fish over 40" must stay in the water · hook-and-line only.',
    keysNote: 'A tarpon tag ($) is required only when pursuing a state/world record.',
    source: 'tarpon/',
  },
  {
    id: 'bonefish', name: 'Bonefish', zone: KEYS_ZONE,
    minSizeIn: null, sizeType: 'none', bag: 0,
    season: { kind: 'catch-release' },
    rule: 'Catch-and-release only (since 2013) · no harvest or possession · hook-and-line only.',
    source: 'bonefish/',
  },
  {
    id: 'permit', name: 'Permit', zone: KEYS_ZONE,
    minSizeIn: 11, maxSizeIn: 22, sizeType: 'fork', bag: 1,
    season: { kind: 'seasonal', closedRanges: [['04-01', '07-31']] },
    rule: 'Special Permit Zone: 11–22" fork slot, plus may keep 1 over 22" · 1 per person · CLOSED Apr 1–Jul 31 (spawning).',
    keysNote: 'Tavernier is inside the SPZ. Most permit are released.',
    source: 'permit/',
  },
  {
    id: 'snook', name: 'Snook', zone: KEYS_ZONE,
    minSizeIn: 28, maxSizeIn: 32, sizeType: 'total', bag: 1,
    season: { kind: 'seasonal', closedRanges: [['12-15', '01-31'], ['06-01', '08-31']] },
    permit: 'Snook permit + saltwater license required',
    rule: 'Atlantic/SE slot 28–32" TL · 1 per person/day · CLOSED Dec 15–Jan 31 and Jun 1–Aug 31 · hook-and-line only.',
    keysNote: 'Snook permit required. Biscayne NP has its own rules.',
    source: 'snook/',
  },
  {
    id: 'redfish', name: 'Redfish (Red Drum)', zone: KEYS_ZONE,
    minSizeIn: 18, maxSizeIn: 27, sizeType: 'total', bag: 1, vesselLimit: 2,
    season: { kind: 'year-round' },
    rule: 'Southwest region slot 18–27" TL · 1 per person/day, max 2 per vessel · year-round.',
    source: 'red-drum/',
  },
]

export const FINFISH_BY_ID = Object.fromEntries(FINFISH.map((r) => [r.id, r]))
export const getReg = (id) => FINFISH_BY_ID[id]
export const verifyUrl = (reg) => FWC_BASE + (reg?.source || '')

// --- season evaluation ----------------------------------------------------
const mdNum = (mm, dd) => mm * 100 + dd
const parseMd = (s) => { const [m, d] = s.split('-').map(Number); return mdNum(m, d) }
function inMdRange(date, [start, end]) {
  const v = mdNum(date.getMonth() + 1, date.getDate())
  const a = parseMd(start), b = parseMd(end)
  return a <= b ? v >= a && v <= b : v >= a || v <= b // wrap across new year
}

export function isOpenOn(reg, date = new Date()) {
  const s = reg.season
  if (!s || s.kind === 'year-round') return true
  if (s.kind === 'catch-release') return false
  if (s.openRanges) return s.openRanges.some((r) => inMdRange(date, r))
  if (s.closedRanges) return !s.closedRanges.some((r) => inMdRange(date, r))
  return true
}

// The "is it legal to keep this?" core. size = the angler's measured length (inches).
export function checkKeep(reg, size, date = new Date()) {
  const reasons = []
  if (reg.season?.kind === 'catch-release') {
    return { keep: false, sizeOk: false, seasonOpen: false, reasons: ['Catch-and-release only — no harvest, ever.'], rule: reg.rule }
  }
  const seasonOpen = isOpenOn(reg, date)
  if (!seasonOpen) reasons.push('Closed season on this date.')

  let sizeOk = true
  if (size != null && !Number.isNaN(size)) {
    if (reg.minSizeIn != null && size < reg.minSizeIn) { sizeOk = false; reasons.push(`Under the ${reg.minSizeIn}" minimum (${reg.sizeType}).`) }
    if (reg.maxSizeIn != null && size > reg.maxSizeIn) { sizeOk = false; reasons.push(`Over the ${reg.maxSizeIn}" slot maximum.`) }
    if (sizeOk && reg.minSizeIn != null) reasons.push(`Legal size${reg.maxSizeIn ? ' (in the slot)' : ''}.`)
  } else {
    sizeOk = reg.minSizeIn == null
  }

  const keep = seasonOpen && sizeOk
  return { keep, sizeOk, seasonOpen, reasons, rule: reg.rule }
}
