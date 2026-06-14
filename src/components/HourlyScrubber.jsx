import { useState } from 'react'
import { toneColor } from '../utils/format.js'

const fmtH = (hr) => { const ap = hr < 12 ? 'a' : 'p'; const hh = hr % 12 || 12; return `${hh}${ap}` }

// Scrub the composite score across the day; sparkline + slider.
export default function HourlyScrubber({ hourly, nowHour = 12 }) {
  const [h, setH] = useState(Math.max(0, Math.min(23, nowHour)))
  if (!hourly?.length) return null
  const sel = hourly[h] || hourly[0]
  const W = 320, H = 64, pad = 6
  const x = (i) => pad + (W - 2 * pad) * (i / 23)
  const y = (sc) => pad + (H - 2 * pad) * (1 - sc / 100)
  const line = 'M ' + hourly.map((p, i) => `${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`).join(' L ')
  const area = `${line} L ${x(23).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`

  return (
    <div className="card stack-sm">
      <div className="row between">
        <div className="eyebrow">Conditions by hour</div>
        <div><span className="h2" style={{ color: toneColor(sel.tone) }}>{sel.score}</span> <span className="faint" style={{ fontSize: 13 }}>at {fmtH(h)}</span></div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs><linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
        <path d={area} fill="url(#hrFill)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
        <line x1={x(h)} y1={pad} x2={x(h)} y2={H - pad} stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx={x(h)} cy={y(sel.score)} r="4" fill="var(--gold)" stroke="var(--bg)" strokeWidth="1.5" />
      </svg>
      <input className="scrubber" type="range" min="0" max="23" value={h} onChange={(e) => setH(+e.target.value)} aria-label="Hour of day" />
      <div className="row between faint" style={{ fontSize: 11 }}><span>12a</span><span>6a</span><span>noon</span><span>6p</span><span>12a</span></div>
    </div>
  )
}
