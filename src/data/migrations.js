// Curated "what's running" calendar for the Upper Keys. Index 0 = January.
// hot = the marquee target(s) that month. note = a short Keys-specific tip.
export const MIGRATIONS = [
  /* Jan */[{ s: 'Sailfish', hot: true, note: 'Peak — kite-fish the reef edge in 120–250 ft.' }, { s: 'King mackerel', note: 'Slow-troll the reef edge.' }, { s: 'Cobia', note: 'On rays & wrecks.' }, { s: 'Blackfin tuna', note: 'The humps.' }, { s: 'Yellowtail' }],
  /* Feb */[{ s: 'Sailfish', hot: true }, { s: 'Blackfin tuna', note: 'Humps & wrecks.' }, { s: 'King mackerel' }, { s: 'Cobia' }, { s: 'Grouper', note: 'Shallow-water closed Jan–Apr.' }],
  /* Mar */[{ s: 'Tarpon', note: 'First arrivals through the channels.' }, { s: 'Cobia', hot: true }, { s: 'Sailfish' }, { s: 'Permit', note: 'Flats warming up.' }, { s: 'Blackfin tuna' }],
  /* Apr */[{ s: 'Tarpon', hot: true, note: 'Migration building — bridges at night.' }, { s: 'Permit' }, { s: 'Bonefish' }, { s: 'Mahi', note: 'Early blue water.' }, { s: 'Mutton snapper' }],
  /* May */[{ s: 'Tarpon', hot: true, note: 'PEAK — channels & bridges, crab flushes.' }, { s: 'Mahi', hot: true, note: 'Running on the weed lines.' }, { s: 'Mutton snapper', note: 'Full-moon spawn.' }, { s: 'Permit' }, { s: 'Hogfish', note: 'Season opens May 1.' }],
  /* Jun */[{ s: 'Mahi', hot: true, note: 'Peak — frigates & weed lines.' }, { s: 'Tarpon', note: 'Still strong early month.' }, { s: 'Mutton snapper', note: 'Full-moon spawn.' }, { s: 'Yellowtail' }, { s: 'Bonefish' }],
  /* Jul */[{ s: 'Mahi', hot: true }, { s: 'Yellowtail', note: 'Night chumming.' }, { s: 'Bonefish' }, { s: 'Permit' }, { s: 'Spiny lobster', hot: true, note: 'Mini-season: last consecutive Wed/Thu.' }],
  /* Aug */[{ s: 'Spiny lobster', hot: true, note: 'Regular season opens Aug 6.' }, { s: 'Mahi' }, { s: 'Bonefish' }, { s: 'Permit' }, { s: 'Tarpon', note: 'Resident fish.' }],
  /* Sep */[{ s: 'Bonefish', hot: true, note: 'Fall run on the flats.' }, { s: 'Permit' }, { s: 'Snook' }, { s: 'Redfish' }, { s: 'Mutton snapper' }],
  /* Oct */[{ s: 'King mackerel', hot: true, note: 'Fall run on the reef edge.' }, { s: 'Stone crab', hot: true, note: 'Season opens Oct 15.' }, { s: 'Sailfish', note: 'Season starting.' }, { s: 'Bonefish' }, { s: 'Hogfish', note: 'Keys season closes Oct 31.' }],
  /* Nov */[{ s: 'Sailfish', hot: true, note: 'Building with the first fronts.' }, { s: 'Wahoo', note: 'Best around the full moon.' }, { s: 'King mackerel' }, { s: 'Blackfin tuna' }, { s: 'Stone crab' }],
  /* Dec */[{ s: 'Sailfish', hot: true, note: 'Peak season — fronts push them through.' }, { s: 'Wahoo' }, { s: 'King mackerel' }, { s: 'Blackfin tuna' }, { s: 'Stone crab' }],
]

export const monthName = (m) =>
  ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m]
