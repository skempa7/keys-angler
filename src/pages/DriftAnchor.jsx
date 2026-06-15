import { useMemo, useState } from 'react'
import { useConditions } from '../hooks/useConditions.js'
import { driftPlan, SPOT_TYPES } from '../engine/drift.js'
import { compass } from '../utils/format.js'

const C_DRIFT = 'var(--accent)'
const C_CURRENT = '#13b9c9'
const C_WIND = 'var(--text-faint)'

function Arrow({ bearing, len, color, width = 3 }) {
  if (bearing == null || !len) return null
  const r = (bearing * Math.PI) / 180
  const ux = Math.sin(r), uy = -Math.cos(r) // north = up
  const x2 = 100 + len * ux, y2 = 100 + len * uy
  const bx = x2 - 11 * ux, by = y2 - 11 * uy
  const px = Math.cos(r), py = Math.sin(r) // perpendicular
  const pts = `${x2.toFixed(1)},${y2.toFixed(1)} ${(bx + 5.5 * px).toFixed(1)},${(by + 5.5 * py).toFixed(1)} ${(bx - 5.5 * px).toFixed(1)},${(by - 5.5 * py).toFixed(1)}`
  return (
    <g stroke={color} fill={color}>
      <line x1="100" y1="100" x2={bx.toFixed(1)} y2={by.toFixed(1)} strokeWidth={width} strokeLinecap="round" />
      <polygon points={pts} stroke="none" />
    </g>
  )
}

function DriftRose({ plan }) {
  const scale = (kn, max) => 16 + Math.min(1, (kn || 0) / max) * 58
  return (
    <svg viewBox="0 0 200 200" className="drift-rose" role="img" aria-label="Wind, current and drift directions">
      <circle cx="100" cy="100" r="80" fill="none" stroke="var(--border-soft)" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="42" fill="none" stroke="var(--border-soft)" strokeWidth="1" strokeDasharray="2 4" />
      {['N', 'E', 'S', 'W'].map((d, i) => {
        const r = (i * 90 * Math.PI) / 180
        const x = 100 + 92 * Math.sin(r), y = 100 - 92 * Math.cos(r)
        return <text key={d} x={x} y={y + 4} textAnchor="middle" fontSize="11" fill="var(--text-faint)" fontWeight="700">{d}</text>
      })}
      {plan.currentToward != null && <Arrow bearing={plan.currentToward} len={scale(plan.currentKn, 3)} color={C_CURRENT} width={3} />}
      {plan.windToward != null && <Arrow bearing={plan.windToward} len={scale(plan.windKn, 25)} color={C_WIND} width={2.5} />}
      {plan.driftToward != null && <Arrow bearing={plan.driftToward} len={scale(plan.driftKn, 3)} color={C_DRIFT} width={4.5} />}
      <circle cx="100" cy="100" r="4" fill="var(--text)" />
    </svg>
  )
}

export default function DriftAnchor() {
  const { data, loading } = useConditions()
  const [spot, setSpot] = useState('reef')
  const c = data?.nowConditions

  const plan = useMemo(
    () => (c ? driftPlan({ windKn: c.windKn, windDir: c.windDir, currentKn: c.currentKn, currentDir: c.currentDir, tide: data?.tideNow, spotType: spot }) : null),
    [c, data, spot],
  )

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">On the water</div>
        <h1 className="h1">Drift or anchor?</h1>
        <p className="muted">How the wind and current line up at your spot right now — and how to set up on it.</p>
      </header>

      <div className="seg-row" role="group" aria-label="Spot type">
        {SPOT_TYPES.map((s) => (
          <button key={s.id} className={`seg ${spot === s.id ? 'on' : ''}`} onClick={() => setSpot(s.id)}>
            <span className="seg-label">{s.label}</span>
            <span className="seg-hint">{s.hint}</span>
          </button>
        ))}
      </div>

      {loading && !plan && <div className="card"><div className="skeleton" style={{ height: 220 }} /></div>}

      {!loading && !plan && (
        <div className="card"><p className="muted" style={{ margin: 0 }}>No live conditions yet — open this once with a signal and it’ll work offline after.</p></div>
      )}

      {plan && (
        <>
          <div className={`card keep-result tone-${plan.tone}`}>
            <div className="keep-verdict" style={{ fontSize: 30 }}>{plan.verdict}</div>
            <div className="keep-rule">{plan.why}</div>
          </div>

          <div className="card">
            <div className="drift-wrap">
              <DriftRose plan={plan} />
              <div className="drift-read">
                <div className="drift-stat">
                  <span className="drift-dot" style={{ background: C_DRIFT }} />
                  <span className="drift-k">Drift</span>
                  <strong>{plan.driftKn != null ? `${plan.driftKn} kn` : '—'}</strong>
                  <span className="faint">{plan.driftCompass ? `to ${plan.driftCompass}` : ''}</span>
                </div>
                <div className="drift-stat">
                  <span className="drift-dot" style={{ background: C_CURRENT }} />
                  <span className="drift-k">Current</span>
                  <strong>{plan.currentKn != null ? `${plan.currentKn} kn` : 'light'}</strong>
                  <span className="faint">{plan.currentToward != null ? `set ${compass(plan.currentToward)}` : ''}</span>
                </div>
                <div className="drift-stat">
                  <span className="drift-dot" style={{ background: '#8aa0b4' }} />
                  <span className="drift-k">Wind</span>
                  <strong>{plan.windKn != null ? `${Math.round(plan.windKn)} kn` : '—'}</strong>
                  <span className="faint">{plan.windToward != null ? `to ${compass(plan.windToward)}` : ''}</span>
                </div>
              </div>
            </div>
            <p className="drift-rel">{plan.relText}</p>
          </div>

          <div className="card stack-sm">
            <div className="eyebrow" style={{ margin: 0 }}>Set up</div>
            <p style={{ margin: 0, fontSize: 14.5 }}>{plan.tip}</p>
            {plan.slackNote && <p className="faint" style={{ margin: 0, fontSize: 13 }}>{plan.slackNote}</p>}
          </div>

          <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
            Drift is an estimate from the model surface current + ~3% wind leeway — your boat, baits &amp; sea state vary it. Inshore the offshore set is weak, so trust the tide and your eyes.
          </p>
        </>
      )}
    </div>
  )
}
