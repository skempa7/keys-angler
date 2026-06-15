// Upper-Keys bar crossings with APPROXIMATE controlling depth at MLLW. The trip-
// killer up here isn't the fishing — it's crossing a skinny cut on a low outgoing.
// Tying rough controlling depths to the live tide + boat draft is real local
// knowledge; the values are illustrative and the UI says to verify with a chart.
export const CROSSINGS = [
  { id: 'steamboat', name: 'Steamboat Channel', controlFt: 2.5, note: 'Very skinny — only the top half of the tide.' },
  { id: 'tavernier', name: 'Tavernier Creek', controlFt: 3.0, note: 'Favor the marked channel; deepest near the bridge.' },
  { id: 'adams-cut', name: 'Adams Cut (Key Largo)', controlFt: 4.0, note: 'Idle/no-wake residential cut to the bay.' },
  { id: 'whale', name: 'Whale Harbor Channel', controlFt: 4.0, note: 'Watch the shoaling on the bay side of the bar.' },
  { id: 'channel-two', name: 'Channel Two', controlFt: 4.0, note: 'Sandbar building on the ocean side — stay marked.' },
  { id: 'indian-key', name: 'Indian Key Channel', controlFt: 5.0, note: 'Good water; current rips on a hard tide.' },
  { id: 'snake', name: 'Snake Creek', controlFt: 5.5, note: 'Bascule bridge — the deepest reliable Atlantic-side cut up here.' },
  { id: 'channel-five', name: 'Channel Five', controlFt: 8.0, note: 'High bridge, deepest — the all-tide bailout.' },
]
export const CROSSINGS_NOTE = 'Approximate controlling depths at MLLW — a planning aid only. Always verify with a current NOAA chart, local knowledge, and your own eyes on the water.'
