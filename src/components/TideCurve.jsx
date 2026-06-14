// Smooth tide curve through the day's hi/lo events (cosine-interpolated, the natural
// tide shape), with labeled extremes and a "now" marker.
const shortTime = (d) => {
  let h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ap = h < 12 ? 'a' : 'p'
  h = h % 12 || 12
  return `${h}:${m}${ap}`
}

export default function TideCurve({ events = [], now, height = 116 }) {
  if (!events || events.length < 2) return null
  const W = 320, H = height, padX = 14, padTop = 24, padBot = 28
  const t0 = events[0].time.getTime()
  const t1 = events[events.length - 1].time.getTime()
  const levels = events.map((e) => e.level)
  let lo = Math.min(...levels), hi = Math.max(...levels)
  if (hi - lo < 0.5) { hi += 0.3; lo -= 0.3 }
  const span = hi - lo
  const X = (t) => padX + (W - 2 * padX) * ((t - t0) / (t1 - t0))
  const Y = (l) => padTop + (H - padTop - padBot) * (1 - (l - lo) / span)
  const lerp = (a, b, u) => a.level + (b.level - a.level) * (1 - Math.cos(Math.PI * u)) / 2

  const pts = []
  for (let i = 0; i < events.length - 1; i++) {
    const a = events[i], b = events[i + 1]
    for (let s = 0; s <= 16; s++) {
      const u = s / 16
      const t = a.time.getTime() + (b.time.getTime() - a.time.getTime()) * u
      pts.push([X(t), Y(lerp(a, b, u))])
    }
  }
  const line = 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')
  const fill = `${line} L ${X(t1).toFixed(1)} ${H - padBot} L ${X(t0).toFixed(1)} ${H - padBot} Z`

  let nowPt = null
  const nt = now ? now.getTime() : null
  if (nt != null && nt >= t0 && nt <= t1) {
    for (let i = 0; i < events.length - 1; i++) {
      const a = events[i], b = events[i + 1]
      if (nt >= a.time.getTime() && nt <= b.time.getTime()) {
        const u = (nt - a.time.getTime()) / (b.time.getTime() - a.time.getTime())
        nowPt = [X(nt), Y(lerp(a, b, u))]
        break
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto' }}>
      <defs>
        <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#tideFill)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {events.map((e, i) => {
        const ex = X(e.time.getTime()), ey = Y(e.level)
        const isH = e.type === 'H'
        return (
          <g key={i}>
            <circle cx={ex} cy={ey} r="3" fill="var(--accent)" />
            <text x={ex} y={isH ? ey - 8 : ey + 15} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--text-dim)">{isH ? 'H' : 'L'} {e.level.toFixed(1)}′</text>
            <text x={ex} y={H - 7} textAnchor="middle" fontSize="9" fill="var(--text-faint)">{shortTime(e.time)}</text>
          </g>
        )
      })}
      {nowPt && (
        <g>
          <line x1={nowPt[0]} y1={padTop - 8} x2={nowPt[0]} y2={H - padBot} stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx={nowPt[0]} cy={nowPt[1]} r="4.5" fill="var(--gold)" stroke="var(--bg)" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  )
}
