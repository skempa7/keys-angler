// Drift-or-anchor reasoning. Combines the surface-current set (Open-Meteo ocean
// current, sets TOWARD currentDir) with wind leeway (a drifting hull tracks ~3% of
// wind speed downwind) into an estimated drift vector, classifies the wind-vs-current
// geometry, and — given the kind of spot you're fishing — calls anchor vs drift vs
// drogue vs spot-lock with a setup tip. Inshore the offshore model current is weak,
// so the tide-flow strength (near-slack vs ripping) carries the timing call.

import { compass } from '../utils/format.js'

const toRad = (d) => (d * Math.PI) / 180
const norm = (d) => ((d % 360) + 360) % 360
// vector with bearing measured clockwise from north; x=east, y=north
const vec = (speed, bearing) => ({ x: speed * Math.sin(toRad(bearing)), y: speed * Math.cos(toRad(bearing)) })
const angleGap = (a, b) => { let d = Math.abs(norm(a) - norm(b)); return d > 180 ? 360 - d : d }

export const SPOT_TYPES = [
  { id: 'patch', label: 'Patch reef', hint: 'small coral head / live bottom' },
  { id: 'wreck', label: 'Wreck / bridge', hint: 'tight structure, stay on it' },
  { id: 'reef', label: 'Reef edge', hint: 'drift the contour / hard bottom' },
  { id: 'open', label: 'Open / weedline', hint: 'offshore, cover water' },
]

const LEEWAY = 0.03 // fraction of wind speed a drifting center-console makes downwind

function band(kn) {
  if (kn == null) return 'unknown'
  if (kn < 0.6) return 'slow'
  if (kn < 1.6) return 'ideal'
  if (kn < 2.6) return 'fast'
  return 'ripping'
}

export function driftPlan({ windKn, windDir, currentKn, currentDir, tide, spotType = 'reef' }) {
  const hasWind = windKn != null && windDir != null
  const hasCurrent = currentKn != null && currentDir != null && currentKn >= 0.05

  // estimated drift vector = surface current + wind leeway
  const windToward = hasWind ? norm(windDir + 180) : null
  const leewayKn = hasWind ? windKn * LEEWAY : 0
  const cv = hasCurrent ? vec(currentKn, currentDir) : { x: 0, y: 0 }
  const wv = hasWind ? vec(leewayKn, windToward) : { x: 0, y: 0 }
  const dx = cv.x + wv.x, dy = cv.y + wv.y
  const driftKn = (hasWind || hasCurrent) ? Math.round(Math.hypot(dx, dy) * 10) / 10 : null
  const driftToward = driftKn ? norm((Math.atan2(dx, dy) * 180) / Math.PI) : null

  // wind vs current geometry (only meaningful with a real current set)
  let rel = null, relText = null
  if (hasCurrent && hasWind && currentKn >= 0.15) {
    const gap = angleGap(windToward, currentDir)
    rel = gap < 50 ? 'with' : gap > 130 ? 'against' : 'across'
    relText = rel === 'with'
      ? 'Wind & current run together — long, clean drifts heading downsea.'
      : rel === 'against'
        ? 'Wind against current — expect a stacked, beam-on chop and short drifts.'
        : 'Wind quarters across the current — the boat sits beam-on; crab the bow to fish.'
  } else {
    relText = 'Light offshore set in the model — your drift here is mostly tide- and wind-driven.'
  }

  const b = band(driftKn)
  const small = spotType === 'patch' || spotType === 'wreck'
  const flowRipping = b === 'ripping' || b === 'fast' || (tide && tide.flow > 0.6)

  let verdict, tone, why, tip
  if (small) {
    // small target: you have to hold position
    verdict = 'ANCHOR'
    tone = 'info'
    why = flowRipping
      ? 'Current would sweep you off a target this small — hold position.'
      : 'A spot this small fishes best sitting right on top of it.'
    tip = 'Drop the hook up-current and ease back so you settle on the number — about 7:1 scope. Trolling motor? Spot-Lock and skip the anchor.'
    if ((b === 'slow' || (tide && tide.atSlack)) && spotType === 'patch') {
      verdict = 'ANCHOR or DRIFT'
      tone = 'good'
      why = 'Barely any current — you can anchor, or make short drift-and-reset passes over it.'
    }
  } else if (spotType === 'reef') {
    if (b === 'ideal' && rel !== 'against') { verdict = 'DRIFT'; tone = 'good'; why = 'Drift speed is right in the fishable band.' ; tip = 'Start up-current of the edge and drift across the contour; reset when you slide off the bottom you want.' }
    else if (b === 'slow') { verdict = 'DRIFT (slow)'; tone = 'info'; why = 'Barely moving — you may need to cover ground.'; tip = 'Bump the motor to keep baits working, or anchor up-current and chum until the tide builds.' }
    else if (b === 'fast') { verdict = 'DRIFT + SOCK'; tone = 'warn'; why = 'Moving quick — baits blow through the strike zone.'; tip = 'Hang a drift sock to slow down and straighten the drift; start well up-current.' }
    else if (b === 'ripping') { verdict = 'ANCHOR or SOCK'; tone = 'warn'; why = 'Too fast to fish clean.'; tip = 'Anchor up-current of the edge, or deploy a big drogue to drag it back into a fishable speed.' }
    else { verdict = 'DRIFT'; tone = 'good'; why = 'Workable drift along the edge.'; tip = 'Start up-current and drift the contour.' }
    if (rel === 'against' && (b === 'fast' || b === 'ripping')) { verdict = 'ANCHOR / POWER-DRIFT'; tone = 'warn'; why = 'Wind-against-current chop on top of a fast drift.'; tip = 'Anchor up-current, or power-drift bow-into the wind to hold a clean line over the bottom.' }
  } else { // open / weedline
    verdict = b === 'ripping' || b === 'fast' ? 'DRIFT / TROLL' : 'DRIFT'
    tone = 'good'
    why = b === 'ripping' || b === 'fast' ? 'Fast drift covers water — good for finding scattered pelagics.' : 'Easy drift to pick apart a weedline or open water.'
    tip = 'Drift or slow-troll along the weedline; live baits down-current, kites up if you’ve got the wind.'
  }

  // tide timing
  let slackNote = null
  if (tide && tide.minutesToChange != null) {
    slackNote = tide.atSlack
      ? `Near slack now — easiest window to anchor; flow rebuilds in ~${tide.minutesToChange} min.`
      : `${tide.direction === 'incoming' ? 'Incoming' : 'Outgoing'} tide${tide.flow > 0.6 ? ', strong flow' : ''} — turns in ~${tide.minutesToChange} min.`
  }

  return {
    verdict, tone, why, tip, rel, relText, slackNote,
    driftKn, driftToward, driftCompass: driftToward == null ? null : compass(driftToward),
    band: b,
    // vectors for the diagram (bearings = TOWARD)
    windToward, windKn: hasWind ? windKn : null,
    currentKn: hasCurrent ? currentKn : null, currentToward: hasCurrent ? norm(currentDir) : null,
  }
}
