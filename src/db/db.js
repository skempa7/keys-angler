import Dexie from 'dexie'

// Single local-first database. Everything lives on-device; nothing leaves the phone.
export const db = new Dexie('keys-angler')

db.version(1).stores({
  // key/value app settings (theme, active location, onboarding flags)
  settings: '&key',

  // saved fishing locations; one is flagged isHome
  locations: '++id, name, isHome',

  // boat profile(s) — length, draft, range, electronics
  boats: '++id, name',

  // gear: rods, reels, line classes, lures, leaders, traps, nets
  gear: '++id, category, type',

  // catch log — the private pattern-learning corpus
  catches: '++id, species, caughtAt, zone, locationId',

  // user-marked productive spots (fish / crab / lobster), ranked by hits over time
  spots: '++id, kind, name',

  // planned trips with their fully cached briefing payload (offline-critical)
  trips: '++id, date, zone, status',

  // grand-slam & challenge records
  slams: '++id, date, type',

  // raw fetched API payloads, keyed by source+params, with fetchedAt for "last updated"
  cache: '&key, source, fetchedAt',
})

// v2: stone-crab trap-set / soak-time tracking.
db.version(2).stores({
  trapSets: '++id, setAt, pulledAt',
})

export default db
