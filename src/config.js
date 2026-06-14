// App-wide configuration & domain constants.
// Home port defaults to Tavernier; the user can change location + radius in Settings.

export const APP = {
  name: 'Keys Angler',
  version: '0.1.0',
}

export const HOME_PORT = {
  name: 'Tavernier, FL',
  label: 'Upper Keys — Islamorada / Tavernier',
  lat: 25.0048,
  lon: -80.5187,
  radiusNm: 30, // working radius in nautical miles
  tz: 'America/New_York',
}

// The three Keys fishing zones the app reasons about differently.
export const ZONES = [
  {
    id: 'backcountry',
    name: 'Backcountry / Flats',
    short: 'Flats',
    side: 'Florida Bay side',
    blurb: 'Sight-fishing the bay-side flats, basins & channels.',
    depthFt: [1, 10],
    species: ['tarpon', 'bonefish', 'permit', 'redfish', 'snook'],
    rig: 'Spinning 12–20 lb with 20–30 lb fluoro leaders. Live shrimp & pilchards, DOA shrimp, gold spoons, weedless flies. Sight-cast the flats; stake out and wait on cruisers.',
  },
  {
    id: 'reef',
    name: 'Patch Reefs / Reef Line',
    short: 'Reef',
    side: 'Hawk Channel → reef',
    blurb: 'Patch reefs and the reef line — bottom & structure fishing.',
    depthFt: [10, 120],
    species: ['yellowtail', 'mutton', 'grouper', 'hogfish'],
    rig: 'Yellowtail: 20 lb spin, 15 lb fluoro, small hooks behind a chum slick. Mutton/grouper: 30–50 lb conventional, knocker rig, live pinfish or ballyhoo — bring enough drag to turn a grouper out of the rocks.',
  },
  {
    id: 'offshore',
    name: 'Offshore / Gulf Stream',
    short: 'Offshore',
    side: 'Blue water',
    blurb: 'The Stream runs close here — trolling & live-baiting the blue.',
    depthFt: [120, 1800],
    species: ['mahi', 'sailfish', 'tuna', 'wahoo', 'kingfish'],
    rig: 'Troll 30–50 lb with ballyhoo & skirts; keep spinning rods rigged to pitch live bait to mahi on the weed lines. Wire leaders for kings & wahoo; kites and live goggle-eyes for sailfish.',
  },
]

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]))

// Settings keys (Dexie `settings` table).
export const SETTINGS = {
  THEME: 'theme',
  LOCATION: 'activeLocation',
  ONBOARDED: 'onboarded',
}
