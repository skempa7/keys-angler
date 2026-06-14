// The single imperative answer at the top of the dashboard — what to DO, with the
// timing that makes it actionable — plus a "what changed since you last looked" delta.
import { fmtTime } from '../utils/format.js'

const minTo = (target, now) => Math.max(0, Math.round((target - now) / 60000))
const hm = (m) => (m == null ? '' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`)
const stormHourLabel = (hr) => `${((hr + 11) % 12) + 1}${hr < 12 ? 'am' : 'pm'}`

export function oneAnswer(data, now = new Date()) {
  const v = data?.nowScore?.verdict || {}
  const windows = data?.today?.windows || []
  const inWin = windows.find((w) => w.start <= now && now <= w.end)
  const next = windows.filter((w) => w.end >= now).sort((a, b) => a.start - b.start)[0]
  const storm = data?.stormToday
  const safety = (data?.alerts || []).find((a) => /warning|small craft|advisory|hazard/i.test(`${a.event || ''} ${a.headline || ''}`))
  const caveat = storm?.level === 'high' ? `storms${storm.stormHour != null ? ` ~${stormHourLabel(storm.stormHour)}` : ''} — be off early` : null

  if (safety) return { verb: 'Hold off', detail: safety.event || 'advisory in effect', tone: 'bad', target: next?.start || null, kind: 'start' }
  if (v.tone === 'bad') return { verb: 'Sit this one out', detail: 'conditions are rough', tone: 'bad', target: next?.start || null, kind: 'start', caveat }

  if (inWin && (v.tone === 'good' || v.tone === 'ok')) {
    return { verb: 'Go now', detail: `${inWin.strength ? inWin.strength.toLowerCase() : 'active'} bite window`, tone: v.tone, target: inWin.end, kind: 'end', caveat }
  }
  if (v.tone === 'good') {
    return { verb: 'Go now', detail: next ? `prime up to the ${fmtTime(next.start)} window` : 'conditions are prime', tone: 'good', target: next?.start || null, kind: 'start', caveat }
  }
  if (v.tone === 'ok') {
    return { verb: 'Worth a trip', detail: next ? `best window ${fmtTime(next.start)}` : 'decent conditions', tone: 'ok', target: next?.start || null, kind: 'start', caveat }
  }
  return { verb: 'Marginal', detail: next ? `best shot ${fmtTime(next.start)}` : 'slow today', tone: v.tone || 'caution', target: next?.start || null, kind: 'start', caveat }
}

export function answerCountdown(ans, now = new Date()) {
  if (!ans?.target) return ''
  const m = minTo(ans.target, now)
  return ans.kind === 'end' ? `${hm(m)} left` : `in ${hm(m)}`
}

// The most salient 1–2 changes since the last visit. Returns string[] or null.
const delta = (a, b) => (a == null || b == null ? null : a - b)
export function sinceLastLook(prev, cur) {
  if (!prev) return null
  const out = []
  const ds = delta(cur.score, prev.score)
  if (ds != null && Math.abs(ds) >= 8) out.push(`bite score ${ds > 0 ? 'up' : 'down'} ${Math.abs(Math.round(ds))}`)
  const dw = delta(cur.windKn, prev.windKn)
  if (dw != null && Math.abs(dw) >= 4) out.push(`wind ${Math.round(prev.windKn)}→${Math.round(cur.windKn)} kn`)
  const da = delta(cur.waveFt, prev.waveFt)
  if (da != null && Math.abs(da) >= 0.6) out.push(`seas ${prev.waveFt.toFixed(1)}→${cur.waveFt.toFixed(1)} ft`)
  const dt = delta(cur.sstF, prev.sstF)
  if (dt != null && Math.abs(dt) >= 2) out.push(`water ${Math.round(prev.sstF)}→${Math.round(cur.sstF)}°F`)
  if (cur.storm === 'high' && prev.storm !== 'high') out.push('storms now in the forecast')
  return out.length ? out.slice(0, 2) : null
}
