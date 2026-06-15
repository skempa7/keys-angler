import { useState } from 'react'
import { placeSpots } from '../engine/crossSection.js'
import { IcPin } from './icons.jsx'

// Your saved spots laid onto the same Keys depth cross-section the trip planner uses —
// so you see your numbers in the water column (flats → reef → blue water), by depth.
export default function SpotCrossSection({ spots }) {
  const [selId, setSelId] = useState(null)
  const { placed, without } = placeSpots(spots)

  if (!placed.length && !without.length) {
    return (
      <div className="card stack-sm">
        <div className="eyebrow">Your spots by depth</div>
        <div className="placeholder"><div className="big"><IcPin width={30} height={30} /></div><p>Mark spots with a depth and they’ll show up here in the water column.</p></div>
      </div>
    )
  }

  const sel = placed.find((p) => p.spot.id === selId) || null
  return (
    <div className="card stack-sm">
      <div className="row between">
        <div className="eyebrow">Your spots by depth</div>
        <span className="faint" style={{ fontSize: 11 }}>{placed.length} placed</span>
      </div>

      <svg className="fishmap" viewBox="0 0 346 196" role="img" aria-label="Your spots on the Keys depth cross-section">
        <defs>
          <linearGradient id="sx-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0e2d3a" /><stop offset="1" stopColor="#06141b" />
          </linearGradient>
        </defs>
        <rect x="0" y="18" width="346" height="178" fill="url(#sx-water)" />
        <line x1="0" y1="18" x2="346" y2="18" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
        <path d="M0 78 L108 96 L122 96 L222 168 L236 168 L346 190 L346 196 L0 196 Z" fill="#13212a" stroke="#1d3a48" strokeWidth="1" />
        {[['Flats', 62], ['Reef', 172], ['Blue water', 283]].map(([label, x]) => (
          <text key={label} x={x} y="192" textAnchor="middle" fontSize="9" fill="var(--text-faint)" fontWeight="700">{String(label).toUpperCase()}</text>
        ))}
        {[114, 230].map((x) => <line key={x} x1={x} y1="18" x2={x} y2="184" stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />)}
        {placed.map((p) => {
          const showLabel = p.spot.id === selId || (p.spot.hits || 0) > 0
          const labelY = Math.max(13, p.y - 9)
          return (
            <g key={p.spot.id} onClick={() => setSelId(p.spot.id)} style={{ cursor: 'pointer' }}>
              {showLabel && <line x1={p.x} y1={p.y - 5} x2={p.x} y2={labelY + 2} stroke="var(--border-soft)" strokeWidth="1" />}
              <circle cx={p.x} cy={p.y} r={p.spot.id === selId ? 6 : 5} fill="var(--accent)" stroke="#03141a" strokeWidth="1" />
              {showLabel && <text x={p.x} y={labelY} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text)">{(p.spot.name || '').split(/[ (]/)[0]}</text>}
            </g>
          )
        })}
      </svg>

      {sel ? (
        <div className="faint" style={{ fontSize: 12.5 }}>
          <b style={{ color: 'var(--accent)' }}>{sel.spot.name}</b> · {sel.depthFt} ft{sel.spot.bottom ? ` · ${sel.spot.bottom}` : ''}{(sel.spot.hits || 0) > 0 ? ` · ${sel.spot.hits} hits` : ''}
        </div>
      ) : (
        <div className="faint" style={{ fontSize: 11 }}>Tap a pin for its depth &amp; bottom. Deep blue-water spots sit on the bottom row.</div>
      )}
      {without.length > 0 && <div className="faint" style={{ fontSize: 11 }}>{without.length} spot{without.length > 1 ? 's' : ''} need a depth to appear here.</div>}
    </div>
  )
}
