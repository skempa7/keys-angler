// FWC aggregate/bag model for the cleaning-table calculator. Encodes ONLY what the
// app's curated regs.js already verifies (REGS_AS_OF 2026-06-14); an FWC web
// cross-check (2026-06-15) found NO wrong numbers here. It does NOT include species
// regs.js omits (gray/mangrove & lane snapper, Atlantic red snapper, Spanish
// mackerel) — see the snapper-group `note`. QUANTITY only; size/season live in regs.js.

export const AGGREGATE_GROUPS = [
  {
    id: 'snapper-10', name: 'Snapper aggregate', perPersonLimit: 10, vesselLimit: null,
    note: 'FWC also counts mangrove, lane & Atlantic red snapper in this 10-per-angler bucket — those aren’t tracked here, so verify your total stays ≤ 10 per angler.',
    members: [
      { regsId: 'yellowtail', sub: null, subGroup: null },
      { regsId: 'mutton', sub: 5, subGroup: null },
    ],
  },
  {
    id: 'grouper-3', name: 'Grouper aggregate', perPersonLimit: 3, vesselLimit: null,
    note: 'FWC phrases this as 3 grouper/tilefish per angler — tilefish share the bucket but aren’t tracked here.',
    members: [
      { regsId: 'red-grouper', sub: 3, subGroup: null },
      { regsId: 'gag-grouper', sub: 1, subGroup: 'gag-or-black' },
      { regsId: 'black-grouper', sub: 1, subGroup: 'gag-or-black' },
    ],
  },
]

export const AGGREGATE_MEMBER_IDS = new Set(AGGREGATE_GROUPS.flatMap((g) => g.members.map((m) => m.regsId)))

// bag = per-angler; vessel = hard per-boat cap; vesselFloor = "X/angler OR Y/boat, greater".
export const STANDALONE = [
  { regsId: 'mahi', name: 'Mahi-Mahi', bag: 5, vessel: 30 },
  { regsId: 'king-mackerel', name: 'King Mackerel', bag: 3, vessel: null },
  { regsId: 'hogfish', name: 'Hogfish', bag: 1, vessel: null },
  { regsId: 'wahoo', name: 'Wahoo', bag: 2, vessel: null },
  { regsId: 'blackfin-tuna', name: 'Blackfin Tuna', bag: 2, vessel: null, vesselFloor: 10 },
  { regsId: 'yellowfin-tuna', name: 'Yellowfin Tuna', bag: 3, vessel: null },
  { regsId: 'sailfish', name: 'Sailfish', bag: 1, vessel: null },
  { regsId: 'permit', name: 'Permit', bag: 1, vessel: null },
  { regsId: 'snook', name: 'Snook', bag: 1, vessel: null },
  { regsId: 'redfish', name: 'Redfish', bag: 1, vessel: 2 },
  { regsId: 'tarpon', name: 'Tarpon', bag: 0, vessel: null },
  { regsId: 'bonefish', name: 'Bonefish', bag: 0, vessel: null },
]

// ROUGH fillet yield (lb/fish) for cooler-space planning ONLY — highly size-dependent.
export const YIELD_LB = {
  mahi: 4.0, yellowtail: 0.45, mutton: 1.6, 'red-grouper': 2.5, 'gag-grouper': 3.5,
  'black-grouper': 3.5, 'king-mackerel': 3.0, wahoo: 6.0, 'blackfin-tuna': 3.0,
  'yellowfin-tuna': 12.0, hogfish: 1.2, sailfish: 0, permit: 0, snook: 1.8, redfish: 1.6,
}

// Picker order + short labels for the cleaning-table UI.
export const PICKER = ['yellowtail', 'mutton', 'red-grouper', 'gag-grouper', 'black-grouper', 'hogfish', 'mahi', 'king-mackerel', 'wahoo', 'blackfin-tuna', 'snook', 'redfish']
export const SHORT = {
  yellowtail: 'Yellowtail', mutton: 'Mutton', 'red-grouper': 'Red grouper', 'gag-grouper': 'Gag', 'black-grouper': 'Black grouper',
  hogfish: 'Hogfish', mahi: 'Mahi', 'king-mackerel': 'Kingfish', wahoo: 'Wahoo', 'blackfin-tuna': 'Blackfin', 'yellowfin-tuna': 'Yellowfin',
  snook: 'Snook', redfish: 'Redfish', permit: 'Permit', sailfish: 'Sailfish', tarpon: 'Tarpon', bonefish: 'Bonefish',
}
