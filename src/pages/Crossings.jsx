import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { useConditions } from '../hooks/useConditions.js'
import { fmtTime } from '../utils/format.js'
import { IcShield } from '../components/icons.jsx'
import { CROSSINGS, CROSSINGS_NOTE } from '../data/crossings.js'

// Linear-interpolate tide height (ft above MLLW) at `when` from the day's hi/lo events.
function tideHeightAt(events, when) {
  if (!events?.length) return null
  let prev = null, next = null
  for (const e of events) { if (e.time <= when) prev = e; else { next = e; break } }
  if (prev && next) { const f = (when - prev.time) / (next.time - prev.time); return prev.level + f * (next.level - prev.level) }
  return (prev || next).level
}

export default function Crossings() {
  const { data } = useConditions({ days: 1 })
  const boats = useLiveQuery(() => db.boats.toArray(), [], [])
  const draftIn = (boats || []).map((b) => b.draftIn).find((d) => d != null)
  const draftFt = draftIn != null ? draftIn / 12 : null

  const events = data?.today?.tideEvents || []
  const now = data?.when || new Date()
  const tideH = tideHeightAt(events, now)
  const falling = data?.tideNow?.direction === 'outgoing'
  const nextLow = events.find((e) => e.type === 'L' && e.time > now)
  const wind = data?.nowConditions

  const BUFFER = 0.5 // keep half a foot under the keel
  const rows = CROSSINGS.map((x) => {
    const avail = tideH != null ? x.controlFt + tideH : null
    const clearance = avail != null && draftFt != null ? avail - draftFt - BUFFER : null
    let tone = 'unknown'
    if (clearance != null) tone = clearance >= 1.5 ? 'good' : clearance >= 0.5 ? 'caution' : 'bad'
    return { ...x, avail, clearance, tone }
  }).sort((a, b) => (a.avail ?? 0) - (b.avail ?? 0))

  const TONE = { good: 'var(--good)', caution: 'var(--caution)', bad: 'var(--bad)', unknown: 'var(--text-faint)' }

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Getting there & back</div>
        <h1 className="h1">Bar crossings</h1>
        <p className="muted">Skinny Upper-Keys cuts vs. the tide right now and your boat's draft.</p>
      </header>

      <div className="card stack-sm">
        <div className="row between">
          <div className="eyebrow">Right now</div>
          <span className="faint" style={{ fontSize: 12 }}>{tideH != null ? `${tideH >= 0 ? '+' : ''}${tideH.toFixed(1)} ft tide · ${falling ? 'falling' : 'rising'}` : 'no tide data'}</span>
        </div>
        <div className="muted" style={{ fontSize: 14 }}>
          {draftFt != null ? <>Your draft: <b style={{ color: 'var(--text)' }}>{draftIn}"</b> (+ {BUFFER * 12}" buffer)</> : <>Set your boat draft to see clearance — <Link to="/gear" className="chip" style={{ marginLeft: 4 }}>Gear & Boat →</Link></>}
        </div>
        {falling && nextLow && <div className="faint" style={{ fontSize: 12 }}>⚠ Tide is dropping — water tightens until low at <b style={{ color: 'var(--caution)' }}>{fmtTime(nextLow.time)}</b>. Cross the skinny cuts before then or take Channel Five.</div>}
      </div>

      <div className="card stack-sm">
        {rows.map((x) => (
          <div key={x.id} className="crossing">
            <div className="row between">
              <div style={{ fontWeight: 650 }}>{x.name}</div>
              <span className="tag" style={{ background: 'var(--surface-2)', color: TONE[x.tone] }}>
                {x.avail != null ? `~${x.avail.toFixed(1)} ft now` : `${x.controlFt} ft MLLW`}
              </span>
            </div>
            <div className="faint" style={{ fontSize: 12 }}>
              {x.controlFt} ft at MLLW
              {x.clearance != null ? ` · clears your draft by ${x.clearance >= 0 ? x.clearance.toFixed(1) : '0'} ft${x.clearance < 0.5 ? ' — tight' : ''}` : ''}
              {' · '}{x.note}
            </div>
          </div>
        ))}
      </div>

      {wind?.windKn != null && wind.windKn >= 15 && (
        <div className="alert-banner info"><strong>Wind {Math.round(wind.windKn)} kn</strong> — a hard breeze against the outgoing stacks standing chop in the cuts. Run them with the tide, not against it.</div>
      )}

      <p className="faint" style={{ fontSize: 12, textAlign: 'center', padding: '0 8px' }}>
        <IcShield width={13} height={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{CROSSINGS_NOTE}
      </p>
    </div>
  )
}
