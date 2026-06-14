// Tide-stage logic over NOAA hi/lo predictions. The Keys stations are all
// subordinate, so we only ever have high/low events — we interpolate stage and
// flow between them. Fish hold and feed on MOVING water (especially the first
// push after a change), so the bite engine weights flow strength + tide changes.

// "YYYY-MM-DD HH:mm" (NOAA lst_ldt) → local Date.
export function parseNoaaTime(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s || '')
  if (!m) return null
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0, 0)
}

export function parseHiLo(noaaJson) {
  const arr = noaaJson?.predictions || []
  return arr
    .map((p) => ({ time: parseNoaaTime(p.t), level: parseFloat(p.v), type: p.type }))
    .filter((e) => e.time && !Number.isNaN(e.level))
    .sort((a, b) => a.time - b.time)
}

export function eventsForDay(events, date) {
  const y = date.getFullYear(), m = date.getMonth(), d = date.getDate()
  return events.filter((e) => e.time.getFullYear() === y && e.time.getMonth() === m && e.time.getDate() === d)
}

// State of the tide at an instant: direction, how far through the cycle, and a
// 0..1 flow proxy (0 at slack near a hi/lo, 1 at mid-tide where water moves fastest).
export function tideStateAt(events, when) {
  const t = when.getTime()
  let prev = null, next = null
  for (const e of events) {
    if (e.time.getTime() <= t) prev = e
    else { next = e; break }
  }
  if (!prev || !next) return null
  const progress = (t - prev.time) / (next.time - prev.time) // 0..1
  const direction = next.type === 'H' ? 'incoming' : 'outgoing'
  const flow = Math.sin(Math.max(0, Math.min(1, progress)) * Math.PI) // slack→mid→slack
  return {
    direction,
    prev,
    next,
    progress,
    flow,
    minutesSinceChange: Math.round((t - prev.time) / 60000),
    minutesToChange: Math.round((next.time - t) / 60000),
    atSlack: flow < 0.25,
    label: `${direction === 'incoming' ? 'Incoming' : 'Outgoing'} · ${flow > 0.6 ? 'strong flow' : flow < 0.25 ? 'near slack' : 'moving'}`,
  }
}

// Windows around each tide change (the classic bite trigger).
export function tideChangeWindows(events, { beforeMin = 45, afterMin = 75 } = {}) {
  return events.map((e) => ({
    event: e,
    center: e.time,
    start: new Date(e.time.getTime() - beforeMin * 60000),
    end: new Date(e.time.getTime() + afterMin * 60000),
    label: e.type === 'H' ? 'High-tide change' : 'Low-tide change',
  }))
}
