// "Keep in mind today" — one pre-launch glance of the make-or-break factors, pulled
// from signals the app already has (safety alerts, storm window, tide turn / slack,
// last light, glare). Returns [{ text, tone }] (tone: bad | caution | info), most
// urgent first. Only includes what's actually relevant today.
import { fmtTime } from '../utils/format.js'

const hm12 = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`

export function watchList({ data, now = new Date() } = {}) {
  if (!data) return []
  const out = []
  const add = (text, tone = 'info') => out.push({ text, tone })

  // Safety advisory.
  const adv = (data.alerts || []).find((a) => /small craft|gale|storm|hazard|warning|advisory/i.test(`${a.event || ''}`))
  if (adv) add(`${adv.event} in effect — rough water; think hard before running offshore.`, 'bad')

  // Storm build window.
  const storm = data.stormToday
  if (storm && storm.level === 'high') add(`Storms likely${storm.stormHour != null ? ` from ~${hm12(storm.stormHour)}` : ''} — plan to be off the water before they build.`, 'caution')

  // Tide: slack now, or the next turn.
  const tide = data.tideNow
  if (tide?.atSlack && tide.minutesToChange != null) {
    add(`Near slack now — the bite resumes when it moves again (~${tide.minutesToChange} min).`, 'caution')
  } else {
    const nextTide = (data.today?.tideEvents || []).find((e) => e.time > now)
    if (nextTide) add(`${nextTide.type === 'H' ? 'High' : 'Low'} tide ${fmtTime(nextTide.time)} — expect the bite to soften around the turn, then fire on the new push.`, 'info')
  }

  // Last light.
  const sun = data.today?.solunar?.sun
  if (sun?.set) add(`Last light ${fmtTime(sun.set)} — prime evening bite; be headed in before dark.`, 'info')

  // Glare.
  const uv = data.nowConditions?.uv
  if (uv != null && uv >= 8) add('High midday sun — sight-fish the flats early before the glare sets in; bring polarized.', 'info')

  return out
}
