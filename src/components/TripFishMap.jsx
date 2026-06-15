import { useState } from 'react'
import { SPECIES } from '../data/species.js'
import { zoneTargets, depthLabel, shortTide, midDepth, FIT_LABEL } from '../engine/tripTargets.js'
import { SEG, FIT_COLOR, depthY } from '../engine/crossSection.js'

// "Where the fish are" — a schematic Keys cross-section (flats → reef → blue water)
// with every species placed in its zone at its depth, the trip's targets lit up by
// SST fit, plus an expandable ranked target list with the where-&-how. Geometry
// (SEG/FIT_COLOR/depthY) is shared with SpotCrossSection via engine/crossSection.js.
const firstSentence = (t) => (t || '').split(/(?<=[.])\s/)[0]

export default function TripFishMap({ zoneId, sstF, biting = [] }) {
  const [openId, setOpenId] = useState(null)
  const targets = zoneTargets(zoneId, sstF, biting)
  const targetIds = new Set(targets.map((t) => t.sp.id))

  // Place every KB species by its zone segment + depth (context); light the targets.
  const placed = ['backcountry', 'reef', 'offshore'].flatMap((z) => {
    const list = SPECIES.filter((s) => s.zone === z).sort((a, b) => midDepth(a) - midDepth(b))
    const [x0, x1] = SEG[z]
    return list.map((s, i) => {
      const x = list.length === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (list.length - 1)
      const on = targetIds.has(s.id)
      const fit = targets.find((t) => t.sp.id === s.id)?.fit || 'unknown'
      return { s, x, y: depthY(midDepth(s)), on, fit, tier: i % 3 }
    })
  })

  return (
    <div className="card stack-sm">
      <div className="row between">
        <div className="eyebrow">Where the fish are</div>
        <span className="faint" style={{ fontSize: 11 }}>{sstF != null ? `${Math.round(sstF)}°F water` : 'by zone & depth'}</span>
      </div>

      <svg className="fishmap" viewBox="0 0 346 196" role="img" aria-label="Keys depth cross-section with target species">
        <defs>
          <linearGradient id="fm-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0e2d3a" /><stop offset="1" stopColor="#06141b" />
          </linearGradient>
        </defs>
        <rect x="0" y="18" width="346" height="178" fill="url(#fm-water)" />
        <line x1="0" y1="18" x2="346" y2="18" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
        {/* sloping seabed: flats → reef → drop-off */}
        <path d="M0 78 L108 96 L122 96 L222 168 L236 168 L346 190 L346 196 L0 196 Z" fill="#13212a" stroke="#1d3a48" strokeWidth="1" />
        {/* zone dividers + labels */}
        {[['Flats', 62], ['Reef', 172], ['Blue water', 283]].map(([label, x]) => (
          <text key={label} x={x} y="192" textAnchor="middle" fontSize="9" fill="var(--text-faint)" fontWeight="700">{label.toUpperCase()}</text>
        ))}
        {[114, 230].map((x) => <line key={x} x1={x} y1="18" x2={x} y2="184" stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />)}
        {placed.map(({ s, x, y, on, fit, tier }) => {
          const labelY = Math.max(13, y - 10 - tier * 11)
          return (
            <g key={s.id} opacity={on ? 1 : 0.32}>
              {on && <line x1={x} y1={y - 5} x2={x} y2={labelY + 2} stroke="var(--border-soft)" strokeWidth="1" />}
              <circle cx={x} cy={y} r={on ? 5 : 3.5} fill={on ? FIT_COLOR[fit] : 'var(--text-faint)'} stroke={on ? '#03141a' : 'none'} strokeWidth="1" />
              {on && <text x={x} y={labelY} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text)">{s.name.split(/[ (]/)[0]}</text>}
            </g>
          )
        })}
      </svg>

      <div className="row wrap" style={{ gap: 10, fontSize: 11 }}>
        <span className="faint"><b style={{ color: 'var(--good)' }}>●</b> in temp band</span>
        <span className="faint"><b style={{ color: 'var(--accent)' }}>●</b> running cool</span>
        <span className="faint"><b style={{ color: 'var(--caution)' }}>●</b> running warm</span>
      </div>

      <div className="stack-sm" style={{ marginTop: 2 }}>
        {targets.map((t) => {
          const open = openId === t.id
          return (
            <div key={t.id} className="fm-target" onClick={() => setOpenId(open ? null : t.id)} style={{ cursor: 'pointer' }}>
              <div className="row between">
                <div style={{ fontWeight: 650 }}>
                  <span style={{ color: FIT_COLOR[t.fit] }}>●</span> {t.sp.name}
                </div>
                {t.status && <span className="tag" style={{ background: 'var(--surface-2)', color: t.cr ? 'var(--accent)' : t.keepable ? 'var(--good)' : 'var(--caution)' }}>{t.status}</span>}
              </div>
              <div className="faint" style={{ fontSize: 12 }}>{depthLabel(t.sp)} · {shortTide(t.sp)}{t.fit !== 'unknown' && t.fit !== 'ideal' ? ` · ${FIT_LABEL[t.fit]}` : ''}</div>
              {open && (
                <div className="stack-sm" style={{ marginTop: 6 }}>
                  <p style={{ fontSize: 13 }}><b>Rig:</b> {t.sp.rig}</p>
                  <p className="muted" style={{ fontSize: 13 }}><b>How:</b> {firstSentence(t.sp.technique)}</p>
                  <p className="faint" style={{ fontSize: 12.5 }}>💡 {firstSentence(t.sp.proTip)}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
