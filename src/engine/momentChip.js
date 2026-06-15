// A tiny "right-now trigger" for the dashboard header: the single most time-sensitive
// tide/solunar/light micro-event the strategic one-answer headline does NOT already
// state (slack tide, tide turning, major feed on/soon, last/first light). Returns null
// most of the time — it only fires inside tight horizons and self-suppresses when it
// would echo the headline. Pure-derived from the existing loadConditions() output.
import { activePeriodAt } from './solunar.js'
import { fmtTime } from '../utils/format.js'

const hm = (m) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`)
const minTo = (target, now) => Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000))
const PRIO = { slack: 1, turn: 2, major: 3, 'major-soon': 4, lastlight: 5, firstlight: 6 }

export function momentChip(data, now = new Date(), ans = null) {
  const tide = data?.tideNow
  const solunar = data?.today?.solunar
  const cands = []

  // 1/2 — tide micro-timing (always complementary to the headline; flagged neutral)
  if (tide && tide.atSlack && tide.minutesToChange != null && tide.minutesToChange <= 35) {
    cands.push({ key: 'slack', icon: 'IcWaves', label: 'Slack tide', sub: `turns in ${hm(tide.minutesToChange)}`, tone: 'caution', minutes: tide.minutesToChange, neutral: true })
  } else if (tide && !tide.atSlack && tide.minutesToChange != null && tide.minutesToChange <= 30) {
    const to = tide.next?.type === 'H' ? 'high' : 'low'
    cands.push({ key: 'turn', icon: 'IcWaves', label: `Tide turns ${to}`, sub: `in ${hm(tide.minutesToChange)}`, tone: 'accent', minutes: tide.minutesToChange, neutral: true })
  }

  // 3 — major solunar period (feed = may overlap a bite window the headline owns)
  if (solunar) {
    const active = activePeriodAt(solunar, now)
    if (active && active.period.type === 'major') {
      cands.push({ key: 'major', icon: 'IcMoon', label: 'Major feed on', sub: `${hm(minTo(active.period.end, now))} left`, tone: 'good', minutes: 0, feed: true })
    } else {
      const nextMajor = (solunar.majors || []).filter((p) => p.start > now).sort((a, b) => a.start - b.start)[0]
      if (nextMajor) { const mins = minTo(nextMajor.start, now); if (mins <= 45) cands.push({ key: 'major-soon', icon: 'IcMoon', label: 'Major feed soon', sub: `in ${hm(mins)}`, tone: 'accent', minutes: mins, feed: true }) }
    }
    // 4 — last/first light
    const set = solunar.sun?.set
    if (set) { const mins = minTo(set, now); if (mins > 0 && mins <= 45) cands.push({ key: 'lastlight', icon: 'IcSun', label: 'Last light', sub: `sunset ${fmtTime(set)}`, tone: 'caution', minutes: mins }) }
    const rise = solunar.sun?.rise
    if (rise) { const mins = minTo(rise, now); if (mins > 0 && mins <= 40) cands.push({ key: 'firstlight', icon: 'IcSun', label: 'First light', sub: `sunrise ${fmtTime(rise)}`, tone: 'accent', minutes: mins }) }
  }

  if (!cands.length) return null
  cands.sort((a, b) => a.minutes - b.minutes || PRIO[a.key] - PRIO[b.key])
  let pick = cands[0]

  // Suppression vs the strategic headline.
  if (ans) {
    const safetyBad = ans.tone === 'bad' || /hold off|sit this one/i.test(ans.verb || '')
    if (safetyBad) {
      pick = cands.find((c) => c.neutral) || null // never cheerlead a feed over an advisory
    } else if (pick.feed && ans.verb === 'Go now' && ans.kind === 'end') {
      pick = cands.find((c) => !c.feed) || null // headline already announces the active window+countdown
    }
  }
  if (!pick) return null
  return { key: pick.key, icon: pick.icon, label: pick.label, sub: pick.sub, tone: pick.tone }
}
