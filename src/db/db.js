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

// v3: dedicated PAST-trip logbook (separate from the planner `trips` table, which
// stays a forward-looking cached-briefing store). Dexie accumulates each version's
// stores spec, so v1/v2 tables are inherited automatically — we declare ONLY the new
// ones (same pattern as v2 above). A table is dropped only by setting it to null in a
// later version, never by omission.
db.version(3).stores({
  // a logged past trip; favorite is an indexable INTEGER 0|1, folderIds is a
  // multiEntry array index (always an array, never a scalar — Dexie throws otherwise)
  logTrips: '++id, date, dateStr, zoneId, favorite, source, sourceTripId, *folderIds, createdAt',
  // user-created collections ("Tarpon", "Bahia Honda")
  logFolders: '++id, name, kind, sort, createdAt',
})

export default db
