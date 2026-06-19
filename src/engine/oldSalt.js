// Old Salt voice — pick a weathered Keys-captain one-liner for the day's report.
// The line set lives in data/oldSaltVoice.js (authored + authenticity-reviewed).
// Selection is deterministic by day so the read is stable within a day but rotates.
import { VOICE } from '../data/oldSaltVoice.js'

function dayOfYear(d) { const s = new Date(d.getFullYear(), 0, 0); return Math.floor((d - s) / 86400000) }

export function pickLine(context, date = new Date()) {
  const lines = VOICE[context]
  if (!lines || !lines.length) return null
  return lines[dayOfYear(date) % lines.length]
}

// Map the current dashboard state to the captain's read. Hard stops (storm, advisory)
// win; otherwise the score bucket picks the tone, with a dawn greeting on early good days.
export function saltRead({ score, data, now = new Date() } = {}) {
  const hour = now.getHours()
  const storm = data?.stormToday
  const adv = (data?.alerts || []).find((a) => /small craft|gale|storm|warning|advisory|hazard/i.test(`${a.event || ''}`))

  let ctx
  if (storm && storm.level === 'high') ctx = 'no_go_storm'
  else if (adv) ctx = 'no_go_wind'
  else if (score >= 80) ctx = 'window_great'
  else if (score >= 62) ctx = 'window_good'
  else if (score >= 45) ctx = 'window_marginal'
  else ctx = 'window_poor'

  if (hour < 7 && (ctx === 'window_great' || ctx === 'window_good')) ctx = 'greeting_dawn'

  return pickLine(ctx, now) || pickLine('window_good', now)
}
