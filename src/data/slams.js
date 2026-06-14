// Shared slam definitions + detection (used by the Grand Slam page and the rewards engine).
export const SLAMS = [
  {
    id: 'grand', name: 'Islamorada Grand Slam', need: 3,
    blurb: 'Tarpon, bonefish & permit in a single day — the flats crown.',
    parts: [
      { label: 'Tarpon', test: (s) => /tarpon/i.test(s) },
      { label: 'Bonefish', test: (s) => /bonefish/i.test(s) },
      { label: 'Permit', test: (s) => /permit/i.test(s) },
    ],
  },
  {
    id: 'backcountry', name: 'Backcountry Slam', need: 3,
    blurb: 'Snook, redfish & tarpon in a day.',
    parts: [
      { label: 'Snook', test: (s) => /snook/i.test(s) },
      { label: 'Redfish', test: (s) => /red(fish| drum)/i.test(s) },
      { label: 'Tarpon', test: (s) => /tarpon/i.test(s) },
    ],
  },
  {
    id: 'reef', name: 'Reef Slam', need: 3,
    blurb: 'Any three of: yellowtail, mutton, grouper, hogfish.',
    parts: [
      { label: 'Yellowtail', test: (s) => /yellowtail/i.test(s) },
      { label: 'Mutton', test: (s) => /mutton/i.test(s) },
      { label: 'Grouper', test: (s) => /grouper/i.test(s) },
      { label: 'Hogfish', test: (s) => /hogfish/i.test(s) },
    ],
  },
]

export const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }

export function groupByDay(catches) {
  const by = {}
  for (const c of catches) {
    const k = dayKey(c.caughtAt)
    ;(by[k] || (by[k] = { ms: c.caughtAt, species: [] })).species.push(c.species)
  }
  return by
}

export function evalSlam(slam, species) {
  const met = slam.parts.map((p) => species.some(p.test))
  const count = met.filter(Boolean).length
  return { met, count, complete: count >= slam.need }
}

// All completed slams across the log, most recent first.
export function computeSlams(catches) {
  const out = []
  for (const day of Object.values(groupByDay(catches))) {
    for (const slam of SLAMS) {
      if (evalSlam(slam, day.species).complete) out.push({ date: new Date(day.ms), slamId: slam.id, slamName: slam.name })
    }
  }
  return out.sort((a, b) => b.date - a.date)
}
