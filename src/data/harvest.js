// FWC stone crab / spiny lobster / shrimp rules for Monroe County (Florida Keys).
// VERIFIED 2026-06-14 (see DATASOURCES.md). Season dates are computed, not hardcoded
// where a rule exists (lobster mini-season = last consecutive Wed/Thu of July).

export const HARVEST_AS_OF = '2026-06-14'

const atMidnight = (y, m, d) => new Date(y, m, d, 0, 0, 0, 0)
const daysBetween = (a, b) => Math.ceil((a - b) / 86_400_000)

// --- Stone crab: season Oct 15 – May 1 ------------------------------------
export function stoneCrabStatus(date = new Date()) {
  const y = date.getFullYear()
  const md = (date.getMonth() + 1) * 100 + date.getDate()
  const open = md >= 1015 || md <= 501 // wraps the new year
  let nextChange, changeTo
  if (open) {
    // closes May 1 (this year if before, else next year is irrelevant — we're open Oct–May)
    const closeYear = md <= 501 ? y : y + 1
    nextChange = atMidnight(closeYear, 4, 1) // May 1 → month index 4
    changeTo = 'closes'
  } else {
    nextChange = atMidnight(y, 9, 15) // Oct 15
    changeTo = 'opens'
  }
  return {
    fishery: 'Stone Crab',
    open,
    changeTo,
    nextChange,
    daysUntil: daysBetween(nextChange, date),
    rules: {
      size: 'Claw ≥ 2 7/8" measured at the forearm (propodus).',
      harvest: 'Claws only — both legal claws may be taken; return the live crab. No egg-bearing crabs.',
      bag: '1 gallon of claws per person OR 2 gallons per vessel, whichever is less.',
      traps: 'Max 5 traps per person (recreational). Free annual trap registration (GoOutdoorsFlorida.com).',
      escapeRing: 'Plastic/wood traps: one 2 3/16" ring; wire traps: three 2 3/8" rings. Degradable panel required.',
    },
    season: 'Oct 15 – May 1',
    source: 'https://myfwc.com/fishing/saltwater/recreational/stone-crab/',
  }
}

// --- Spiny lobster: regular Aug 6 – Mar 31, + 2-day July mini-season ------
export function lobsterMiniSeason(year) {
  const d = new Date(year, 6, 31) // July 31
  while (d.getDay() !== 3) d.setDate(d.getDate() - 1) // back up to the last Wednesday
  const start = atMidnight(year, 6, d.getDate())
  const end = atMidnight(year, 6, d.getDate() + 1) // the Thursday
  return { start, end }
}

export function lobsterStatus(date = new Date()) {
  const y = date.getFullYear()
  const md = (date.getMonth() + 1) * 100 + date.getDate()
  const regularOpen = md >= 806 || md <= 331 // Aug 6 – Mar 31, wraps

  const mini = lobsterMiniSeason(y)
  const inMini = date >= mini.start && date <= new Date(mini.end.getTime() + 86_400_000 - 1)

  // Next upcoming event among {regular open/close, mini start}.
  let nextChange, changeTo
  if (regularOpen) {
    const closeYear = md <= 331 ? y : y + 1
    nextChange = atMidnight(closeYear, 2, 31) // Mar 31 (month index 2)
    changeTo = 'regular season closes'
  } else if (inMini) {
    nextChange = new Date(mini.end.getTime() + 86_400_000)
    changeTo = 'mini-season ends'
  } else {
    // closed: next is either this year's mini-season (if upcoming) or Aug 6 open
    const aug6 = atMidnight(y, 7, 6)
    if (date < mini.start) { nextChange = mini.start; changeTo = '2-day mini-season opens' }
    else if (date < aug6) { nextChange = aug6; changeTo = 'regular season opens' }
    else { nextChange = atMidnight(y + 1, 6, lobsterMiniSeason(y + 1).start.getDate()); changeTo = 'mini-season opens' }
  }

  return {
    fishery: 'Spiny Lobster',
    open: regularOpen || inMini,
    inMini,
    changeTo,
    nextChange,
    daysUntil: daysBetween(nextChange, date),
    miniSeason: mini,
    rules: {
      size: 'Carapace LARGER THAN 3" — measured in the water. A measuring device is required at all times.',
      bagMini: 'Mini-season: 6 per person/day in MONROE & Biscayne NP (stricter); 12 elsewhere in FL.',
      bagRegular: 'Regular season: 6 per person/day statewide.',
      method: 'Bully-net or diving. Must be landed whole — no separating tail from body in state waters.',
      monroeNight: 'Night diving for lobster is PROHIBITED in Monroe County during the 2-day sport season.',
      noTake: 'No take: Pennekamp (during sport season), Everglades/Dry Tortugas NP, Sanctuary no-take zones, Biscayne/Card Sound Lobster Sanctuary.',
      permit: 'Recreational lobster permit/stamp required on your saltwater license.',
    },
    season: 'Regular Aug 6 – Mar 31 · Mini-season last Wed/Thu of July',
    source: 'https://myfwc.com/fishing/saltwater/recreational/lobster/',
  }
}

// --- Shrimp: open year-round in the Keys ----------------------------------
export function shrimpStatus() {
  return {
    fishery: 'Shrimp',
    open: true,
    season: 'Open year-round in Monroe (the Apr–May closure is NE-Florida only)',
    rules: {
      bag: '5 gallons heads-on per person/day · 5 gallons per vessel possession.',
      size: 'No minimum size.',
      gear: 'Dip net (≤96" perimeter), cast net (≤14 ft), push net, seine, one frame net (banned in Dade), up to 4 shrimp traps. Max 2 nets fished per vessel.',
      bestConditions: 'Best on new-moon nights on a strong outgoing tide — shrimp run with the current; work channels & bridge lights.',
    },
    source: 'https://myfwc.com/fishing/saltwater/recreational/shrimp/',
  }
}
