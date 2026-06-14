import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { HOME_PORT, ZONES } from '../config.js'
import { FINFISH } from '../data/regs.js'
import { solunarDay, activePeriodAt } from '../engine/solunar.js'
import { speciesPatterns, overallStats, hourHistogram } from '../engine/patterns.js'
import { useConditions } from '../hooks/useConditions.js'
import { snapshotFromConditions } from '../services/conditions.js'
import { fmtTime, fmtDateShort } from '../utils/format.js'
import { IcX, IcShare, IcFish } from '../components/icons.jsx'
import { shareCatchCard } from '../services/catchCard.js'
import { haptic } from '../utils/haptic.js'

const SPECIES = [...FINFISH.map((f) => f.name), 'Stone Crab', 'Spiny Lobster', 'Shrimp', 'Other']
const TIDES = ['Incoming', 'Outgoing', 'High slack', 'Low slack', 'Tide change']
const FALLBACK_SPECIES = ['Yellowtail Snapper', 'Mahi-Mahi', 'Tarpon', 'Mutton Snapper', 'Bonefish']
const pad = (n) => String(n).padStart(2, '0')
const toLocal = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }
const num = (x) => (x === '' || x == null ? null : Number(x))

export default function CatchLog() {
  const { data } = useConditions({ days: 1 })
  const catches = useLiveQuery(() => db.catches.orderBy('caughtAt').reverse().toArray(), [], [])
  const list = catches || []

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [justLogged, setJustLogged] = useState(null)
  const blank = () => ({ species: list[0]?.species || 'Yellowtail Snapper', length: '', weight: '', when: toLocal(Date.now()), zone: list[0]?.zone || 'reef', tide: '', bait: '', spot: '', notes: '', lat: null, lon: null })
  const [f, setF] = useState(blank)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const quickSpecies = useMemo(() => {
    const recent = [...new Set(list.slice(0, 12).map((c) => c.species))].slice(0, 5)
    return [...new Set([...recent, ...FALLBACK_SPECIES])].slice(0, 6)
  }, [list])

  // One tap: snapshot everything now, default the species, fill GPS in the background.
  const quickLog = async () => {
    const snap = snapshotFromConditions(data, null)
    const id = await db.catches.add({
      species: list[0]?.species || 'Yellowtail Snapper', lengthIn: null, weightLb: null,
      caughtAt: Date.now(), zone: list[0]?.zone || 'reef', bait: '', spot: '', notes: '',
      scoreAtCatch: data?.nowScore?.score ?? null,
      createdAt: Date.now(), ...snap,
    })
    haptic(18)
    setJustLogged(id)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => db.catches.update(id, { lat: p.coords.latitude, lon: p.coords.longitude }),
        () => {}, { enableHighAccuracy: true, timeout: 8000 },
      )
    }
  }
  const setLoggedSpecies = (s) => { if (justLogged) db.catches.update(justLogged, { species: s }); haptic(); setJustLogged(null) }

  const editCatch = (c) => {
    setEditId(c.id)
    setF({ species: c.species, length: c.lengthIn ?? '', weight: c.weightLb ?? '', when: toLocal(c.caughtAt), zone: c.zone || 'reef', tide: c.tide || '', bait: c.bait || '', spot: c.spot || '', notes: c.notes || '', lat: c.lat ?? null, lon: c.lon ?? null })
    setJustLogged(null)
    setOpen(true)
  }

  const save = async () => {
    const date = new Date(f.when)
    const sol = solunarDay(date, HOME_PORT.lat, HOME_PORT.lon)
    const active = activePeriodAt(sol, date)
    const rec = {
      species: f.species, lengthIn: num(f.length), weightLb: num(f.weight), caughtAt: date.getTime(),
      zone: f.zone, tide: f.tide, bait: f.bait, spot: f.spot, notes: f.notes, lat: f.lat, lon: f.lon,
      moonPhase: sol.moon.phaseName, solunarType: active ? active.period.type : null,
    }
    if (editId) await db.catches.update(editId, rec)
    else await db.catches.add({ ...rec, createdAt: Date.now() })
    haptic()
    setEditId(null); setOpen(false); setF(blank())
  }

  const patterns = speciesPatterns(list)
  const stats = overallStats(list)
  const hist = hourHistogram(list)
  const newDate = (ms) => new Date(ms)

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Catch log</div>
        <h1 className="h1">Your fish</h1>
        <p className="muted">Private &amp; on-device. One tap captures the conditions; the app learns your patterns.</p>
      </header>

      {/* One-tap hero */}
      <div className="card raised stack-sm">
        <button className="btn primary block lg" onClick={quickLog}><IcFish width={20} height={20} /> Hooked up — log now</button>
        <div className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
          One tap logs it with this moment's tide, wind, water temp, moon &amp; GPS. Set the species below — refine size later.
        </div>
        {justLogged && (
          <div className="stack-sm" style={{ marginTop: 2 }}>
            <div className="eyebrow">What was it?</div>
            <div className="row wrap" style={{ gap: 8 }}>
              {quickSpecies.map((s) => <button key={s} className="chip" onClick={() => setLoggedSpecies(s)}>{s}</button>)}
              <button className="chip" onClick={() => { const c = list.find((x) => x.id === justLogged); if (c) editCatch(c) }}>More…</button>
            </div>
          </div>
        )}
        <button className="btn ghost block" onClick={() => { setEditId(null); setF(blank()); setOpen((o) => !o) }}>{open && !editId ? 'Close' : 'Manual entry / backdate'}</button>
      </div>

      {open && (
        <div className="card stack-sm">
          <div className="eyebrow">{editId ? 'Edit catch' : 'New catch'}</div>
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
          <div className="row" style={{ gap: 8 }}>
            <button className="btn primary block" onClick={save}>{editId ? 'Save changes' : 'Save catch'}</button>
            {editId && <button className="btn ghost" onClick={() => { db.catches.delete(editId); setEditId(null); setOpen(false); setF(blank()) }} style={{ color: 'var(--bad)' }}>Delete</button>}
          </div>
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
        <div className="eyebrow">Recent · tap to edit</div>
        {list.length === 0 && <p className="faint" style={{ fontSize: 13 }}>No catches yet. Tap “Hooked up” the second you boat one — species &amp; size can wait.</p>}
        {list.map((c) => (
          <div key={c.id} className="catch-row" onClick={() => editCatch(c)} style={{ cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 650 }}>{c.species}{c.lengthIn ? ` · ${c.lengthIn}"` : ''}</div>
              <div className="faint" style={{ fontSize: 12 }}>
                {fmtDateShort(newDate(c.caughtAt))} {fmtTime(newDate(c.caughtAt))}
                {c.tide ? ` · ${c.tide}` : ''}{c.cond?.sstF != null ? ` · ${Math.round(c.cond.sstF)}°F` : ''}{c.bait ? ` · ${c.bait}` : ''}
              </div>
            </div>
            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); shareCatchCard(c) }} aria-label="Share catch"><IcShare width={18} height={18} /></button>
            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); db.catches.delete(c.id) }} aria-label="Delete catch"><IcX width={18} height={18} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
