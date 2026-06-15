// Minimal XP/rewards engine. XP is computed deterministically from logged data
// (so it reflects everything, retroactively, with no separate ledger to drift).
import { computeSlams } from '../data/slams.js'

const RANKS = [
  { name: 'Deckhand', min: 0 },
  { name: 'Deck Boss', min: 150 },
  { name: 'First Mate', min: 400 },
  { name: 'Captain', min: 800 },
  { name: 'Old Salt', min: 1500 },
  { name: 'Conch', min: 2600 },
]

// NOTE: `trips` here is ONLY the planner's db.trips (planned/cached briefings).
// XP intentionally does NOT count the Trip Log (db.logTrips): backfilling historical
// trips must not balloon XP or auto-earn the Skipper badge. If logged trips should
// ever grant XP, add a SEPARATE term + badge below AND de-dup graduated trips
// (a graduated trip exists in both db.trips and db.logTrips).
export function computeRewards({ catches = [], spots = [], trips = [], openDays = 0 }) {
  const slams = computeSlams(catches)
  const species = new Set(catches.map((c) => c.species))
  const distinct = species.size
  const has = (re) => [...species].some((s) => re.test(s))

  const xp =
    catches.length * 10 +
    distinct * 15 +
    slams.length * 50 +
    spots.length * 5 +
    trips.length * 5 +
    Math.min(openDays, 90) * 2

  let ri = 0
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) ri = i
  const rank = RANKS[ri]
  const next = RANKS[ri + 1] || null
  const progress = next ? (xp - rank.min) / (next.min - rank.min) : 1

  const slamIds = new Set(slams.map((s) => s.slamId))
  const badges = [
    { id: 'first', name: 'First Blood', desc: 'Log your first catch', icon: '🎣', earned: catches.length >= 1 },
    { id: 'ten', name: 'Getting Salty', desc: 'Log 10 catches', icon: '🪝', earned: catches.length >= 10 },
    { id: 'century', name: 'Centurion', desc: 'Log 100 catches', icon: '💯', earned: catches.length >= 100 },
    { id: 'five-species', name: 'Mixed Bag', desc: 'Catch 5 species', icon: '🐟', earned: distinct >= 5 },
    { id: 'ten-species', name: 'Keys Generalist', desc: 'Catch 10 species', icon: '🌊', earned: distinct >= 10 },
    { id: 'grand', name: 'Grand Slam', desc: 'Tarpon + bonefish + permit in a day', icon: '🏆', earned: slamIds.has('grand') },
    { id: 'backcountry', name: 'Backcountry Slam', desc: 'Snook + redfish + tarpon in a day', icon: '🥇', earned: slamIds.has('backcountry') },
    { id: 'reef', name: 'Reef Slam', desc: '3 reef species in a day', icon: '🐠', earned: slamIds.has('reef') },
    { id: 'tarpon', name: 'Silver King', desc: 'Release a tarpon', icon: '👑', earned: has(/tarpon/i) },
    { id: 'bone', name: 'Gray Ghost', desc: 'Catch a bonefish', icon: '👻', earned: has(/bonefish/i) },
    { id: 'permit', name: 'The Permit', desc: 'Land a permit', icon: '🪙', earned: has(/permit/i) },
    { id: 'planner', name: 'Skipper', desc: 'Plan a trip', icon: '🧭', earned: trips.length >= 1 },
    { id: 'spotter', name: 'Spot Burner', desc: 'Mark 3 spots', icon: '📍', earned: spots.length >= 3 },
  ]

  return {
    xp,
    level: ri + 1,
    rank: rank.name,
    nextRank: next ? next.name : null,
    nextAt: next ? next.min : null,
    progress,
    badges,
    earnedCount: badges.filter((b) => b.earned).length,
    slams,
    counts: { catches: catches.length, species: distinct, slams: slams.length, spots: spots.length, trips: trips.length },
  }
}
