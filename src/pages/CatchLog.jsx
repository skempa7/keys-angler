import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { HOME_PORT, ZONES } from '../config.js'
import { FINFISH } from '../data/regs.js'
import { solunarDay, activePeriodAt } from '../engine/solunar.js'
import { speciesPatterns, overallStats, hourHistogram } from '../engine/patterns.js'
import { fmtTime, fmtDateShort } from '../utils/format.js'
import { IcX, IcShare } from '../components/icons.jsx'
import { shareCatchCard } from '../services/catchCard.js'

const SPECIES = [...FINFISH.map((f) => f.name), 'Stone Crab', 'Spiny Lobster', 'Shrimp', 'Other']
const TIDES = ['Incoming', 'Outgoing', 'High slack', 'Low slack', 'Tide change']
const pad = (n) => String(n).padStart(2, '0')
const nowLocal = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }
const num = (x) => (x === '' || x == null ? null : Number(x))

export default function CatchLog() {
  const catches = useLiveQuery(() => db.catches.orderBy('caughtAt').reverse().toArray(), [], [])
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ species: 'Yellowtail Snapper', length: '', weight: '', when: nowLocal(), zone: 'reef', tide: '', bait: '', spot: '', notes: '', lat: null, lon: null })

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const pinLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setF((s) => ({ ...s, lat: p.coords.latitude, lon: p.coords.longitude })),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const save = async () => {
    const date = new Date(f.when)
    const sol = solunarDay(date, HOME_PORT.lat, HOME_PORT.lon)
    const active = activePeriodAt(sol, date)
    await db.catches.add({
      species: f.species, lengthIn: num(f.length), weightLb: num(f.weight),
      caughtAt: date.getTime(), zone: f.zone, tide: f.tide, bait: f.bait, spot: f.spot, notes: f.notes,
      lat: f.lat, lon: f.lon,
      moonPhase: sol.moon.phaseName, solunarType: active ? active.period.type : null, createdAt: Date.now(),
    })
    setF((s) => ({ ...s, length: '', weight: '', bait: '', spot: '', notes: '', when: nowLocal(), lat: null, lon: null }))
    setOpen(false)
  }

  const list = catches || []
  const patterns = speciesPatterns(list)
  const stats = overallStats(list)
  const hist = hourHistogram(list)

  return (
    <div className="stack">
      <header className="page-head">
        <div className="row between">
          <div><div className="eyebrow">Catch log</div><h1 className="h1">Your fish</h1></div>
          <button className="btn primary" onClick={() => setOpen((o) => !o)}>{open ? 'Cancel' : '+ Log'}</button>
        </div>
        <p className="muted">Private &amp; on-device. The app learns your patterns over time.</p>
      </header>

      {open && (
        <div className="card stack-sm">
          <label className="field"><span className="field-label">Species</span>
            <select className="input" value={f.species} onChange={set('species')}>{SPECIES.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <div className="row" style={{ gap: 8 }}>
            <label className="field" style={{ flex: 1 }}><span className="field-label">Length (in)</span><input className="input" inputMode="decimal" value={f.length} onChange={set('length')} /></label>
            <label className="field" style={{ flex: 1 }}><span className="field-label">Weight (lb)</span><input className="input" inputMode="decimal" value={f.weight} onChange={set('weight')} /></label>
          </div>
          <label className="field"><span className="field-label">When</span><input className="input" type="datetime-local" value={f.when} onChange={set('when')} /></label>
          <div className="row" style={{ gap: 8 }}>
            <label className="field" style={{ flex: 1 }}><span className="field-label">Zone</span>
              <select className="input" value={f.zone} onChange={set('zone')}>{ZONES.map((z) => <option key={z.id} value={z.id}>{z.short}</option>)}</select>
            </label>
            <label className="field" style={{ flex: 1 }}><span className="field-label">Tide</span>
              <select className="input" value={f.tide} onChange={set('tide')}><option value="">—</option>{TIDES.map((t) => <option key={t}>{t}</option>)}</select>
            </label>
          </div>
          <label className="field"><span className="field-label">Bait / lure</span><input className="input" value={f.bait} onChange={set('bait')} /></label>
          <label className="field"><span className="field-label">Spot</span><input className="input" value={f.spot} onChange={set('spot')} placeholder="optional" /></label>
          <button type="button" className={`chip ${f.lat != null ? 'active' : ''}`} onClick={pinLocation} style={{ alignSelf: 'flex-start' }}>
            {f.lat != null ? '📍 Location pinned' : '📍 Pin my location'}
          </button>
          <button className="btn primary block lg" onClick={save}>Save catch</button>
        </div>
      )}

      {list.length > 0 && (
        <div className="grid cols-2">
          <div className="card stat"><div className="eyebrow">Logged</div><div className="stat-main">{stats.total}</div><div className="faint stat-foot">{stats.species} species</div></div>
          <div className="card stat"><div className="eyebrow">Biggest</div><div className="stat-main">{stats.biggest?.lengthIn ? `${stats.biggest.lengthIn}"` : '—'}</div><div className="faint stat-foot">{stats.biggest?.species || ''}</div></div>
        </div>
      )}

      {patterns.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Your patterns</div>
          {patterns.map((p) => (
            <div key={p.species} className="pattern">
              <div style={{ fontWeight: 650 }}>{p.species} <span className="faint">· {p.count}</span></div>
              <div className="muted" style={{ fontSize: 13 }}>{p.insights.length ? p.insights.join(' · ') : 'building a pattern…'}</div>
            </div>
          ))}
        </div>
      )}

      {list.length >= 3 && (
        <div className="card stack-sm">
          <div className="eyebrow">When you catch fish</div>
          <div className="hist">
            {hist.map((h) => (
              <div key={h.label} className="hist-col">
                <div className="hist-track"><div className="hist-bar" style={{ height: `${Math.round(h.pct * 100)}%` }} /></div>
                <div className="hist-n">{h.count}</div>
                <div className="hist-l">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card stack-sm">
        <div className="eyebrow">Recent</div>
        {list.length === 0 && <p className="faint" style={{ fontSize: 13 }}>No catches logged yet. Tap “+ Log” after you boat one — the more you log, the sharper your patterns.</p>}
        {list.map((c) => (
          <div key={c.id} className="catch-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 650 }}>{c.species}{c.lengthIn ? ` · ${c.lengthIn}"` : ''}</div>
              <div className="faint" style={{ fontSize: 12 }}>
                {fmtDateShort(new Date(c.caughtAt))} {fmtTime(new Date(c.caughtAt))}
                {c.tide ? ` · ${c.tide}` : ''}{c.bait ? ` · ${c.bait}` : ''}{c.spot ? ` · ${c.spot}` : ''}
              </div>
            </div>
            <button className="icon-btn" onClick={() => shareCatchCard(c)} aria-label="Share catch"><IcShare width={18} height={18} /></button>
            <button className="icon-btn" onClick={() => db.catches.delete(c.id)} aria-label="Delete catch"><IcX width={18} height={18} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
