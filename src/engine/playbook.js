// Today's playbook — what to do DIFFERENTLY than a normal day. Reads the live
// conditions and returns concrete tactical adjustments (leader, depth, speed, bait,
// where on the structure, anchor vs drift). Conservative expert-Keys guidance; each
// item only fires when its condition is genuinely notable, so the list stays short
// and actionable. Returns [{ tag, tip, tone }] (tone: good | caution | info).
import { deriveClarity } from './baitBoard.js'

export function todaysPlaybook({ conditions = {}, pressureTrend, tideNow, solunar, stormToday, sun, now = new Date() } = {}) {
  const { windKn, gustKn, waveFt, sstF, precipProb, uv } = conditions
  const out = []
  const add = (tag, tip, tone = 'info') => out.push({ tag, tip, tone })

  // Barometric trend — the single biggest "today is different" lever.
  if (pressureTrend != null) {
    if (pressureTrend <= -0.6) add('Barometer', 'Falling barometer — fish feed hard ahead of a front. Fish aggressively now with bigger baits; the next few hours are your window.', 'good')
    else if (pressureTrend >= 1.0) add('Barometer', 'High / rising pressure behind a front — expect a lockjaw bite. Downsize leader and baits, fish deeper and slower, and work the strongest tide.', 'caution')
  }

  // Water clarity (proxy from wind/wave/rain).
  const clarity = deriveClarity({ windKn, waveFt, precipProb })
  if (clarity === 'clean') add('Clear water', 'Gin-clear water — drop to lighter fluoro, longer leaders and natural/live baits; they’re leader-shy today. Keep swivels well off the hook.', 'info')
  else if (clarity === 'stained') add('Dirty water', 'Churned / stained water — switch to dark or scented baits with more flash and thump, work the color edges, and get tight to structure.', 'info')

  // Tide movement.
  if (tideNow) {
    if (tideNow.atSlack) add('Tide', 'Near slack — the bite usually pauses. Re-rig, reposition, or chum to hold fish until the water starts moving again.', 'caution')
    else if (tideNow.flow > 0.6) add('Tide', 'Strong moving water — go heavier on jigheads/sinkers to hold bottom, fish the down-current side of structure, and anchor up-current so baits wash back naturally.', 'good')
  }

  // Wind / sea state.
  if ((gustKn != null && gustKn >= 22) || (waveFt != null && waveFt >= 3.5)) add('Wind', 'Snotty out — fish lee shorelines, shorten drifts with a sock, or duck into the protected backcountry. Save the offshore run for a calmer day.', 'caution')
  else if (windKn != null && windKn <= 6 && (waveFt == null || waveFt < 1)) add('Flat calm', 'Dead calm — fish are spooky and sitting deep. Long casts, light leader, a stealthy approach, and lean on the low-light windows.', 'info')

  // Water temperature.
  if (sstF != null) {
    if (sstF >= 85) add('Hot water', 'Hot water — work deep or shaded structure and moving channels through midday; fish early and late, and avoid dead-calm basins where oxygen drops.', 'caution')
    else if (sstF <= 70) add('Cool water', 'Cool water — slow everything down and shrink your profiles; the midday warm-up is often the best window.', 'info')
  }

  // Moon strength.
  if ((solunar?.lunarStrength ?? 0) >= 0.6) add('Moon', 'Big moon — they fed hard overnight, so first light and the major solunar period are your best shots. Strong moon tides light up the bridge & channel tarpon after dark.', 'good')

  // Low-light window right now.
  if (sun?.rise && sun?.set) {
    const h = now.getHours() + now.getMinutes() / 60
    const rise = sun.rise.getHours() + sun.rise.getMinutes() / 60
    const set = sun.set.getHours() + sun.set.getMinutes() / 60
    if (Math.min(Math.abs(h - rise), Math.abs(h - set)) <= 1) add('Low light', 'Low-light window right now — throw topwater and aggressive presentations; this is the most forgiving bite of the day.', 'good')
  }

  // Storms.
  if (stormToday && stormToday.level === 'high') add('Storms', 'Storms building today — short window. Hit your best spot first and plan to be off the water early.', 'caution')

  // Glare.
  if (uv != null && uv >= 8) add('Glare', 'High sun and glare — wear polarized, sight-fish the flats early before the sun climbs, and move to shaded structure later.', 'info')

  return out
}
