import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { downloadICS } from '../services/phase2.js'
import { fmtDateShort } from '../utils/format.js'
import { HOME_PORT } from '../config.js'
import { distanceNm } from '../data/stations.js'
import { IcX, IcPin } from './icons.jsx'

const DAY = 86_400_000
const pad = (n) => String(n).padStart(2, '0')
const nowLocal = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}` }

function status(set) {
  const pullBy = set.setAt + (set.soakDays || 7) * DAY
  const daysLeft = Math.round((pullBy - Date.now()) / DAY)
  if (daysLeft > 1) return { label: `Soaking · ${daysLeft} days left`, tone: 'soak', pullBy, daysLeft }
  if (daysLeft >= 0) return { label: 'Ready to pull', tone: 'good', pullBy, daysLeft }
  return { label: `Overdue ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}`, tone: 'bad', pullBy, daysLeft }
}

// A pull plan: if ≥2 sets carry GPS, a nearest-neighbor run from the home port;
// otherwise ordered by urgency (most overdue first).
function pullPlan(active) {
  const gps = active.filter((s) => s.lat != null && s.lon != null)
  if (gps.length >= 2) {
    const remaining = [...gps], order = []
    let cur = { lat: HOME_PORT.lat, lon: HOME_PORT.lon }, total = 0
    while (remaining.length) {
      let bi = 0, bd = Infinity
      remaining.forEach((s, i) => { const d = distanceNm(cur.lat, cur.lon, s.lat, s.lon); if (d < bd) { bd = d; bi = i } })
      total += bd; cur = remaining.splice(bi, 1)[0]; order.push(cur)
    }
    const noGps = active.filter((s) => s.lat == null || s.lon == null).sort((a, b) => status(a).pullBy - status(b).pullBy)
    return { order: [...order, ...noGps], totalNm: total, byDistance: true }
  }
  return { order: [...active].sort((a, b) => status(a).pullBy - status(b).pullBy), totalNm: null, byDistance: false }
}

export default function TrapTracker() {
  const sets = useLiveQuery(() => db.trapSets.toArray(), [], [])
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ when: nowLocal(), traps: '5', spot: '', soakDays: '7', lat: null, lon: null })
  const active = (sets || []).filter((s) => !s.pulledAt).sort((a, b) => a.setAt - b.setAt)
  const plan = pullPlan(active)

  const useGps = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (p) => setF((s) => ({ ...s, lat: p.coords.latitude, lon: p.coords.longitude })),
      () => {}, { enableHighAccuracy: true, timeout: 8000 },
    )
  }
  const add = async () => {
    await db.trapSets.add({ setAt: new Date(f.when).getTime(), traps: Number(f.traps) || null, spot: f.spot.trim(), soakDays: Number(f.soakDays) || 7, lat: f.lat, lon: f.lon, pulledAt: null, createdAt: Date.now() })
    setF((s) => ({ ...s, when: nowLocal(), spot: '', lat: null, lon: null }))
    setOpen(false)
  }
  const remind = (s) => {
    const st = status(s)
    downloadICS('pull-traps.ics', [{ title: `Pull stone-crab traps${s.spot ? ` — ${s.spot}` : ''}`, start: new Date(st.pullBy), allDay: true, description: `${s.traps || ''} traps set ${fmtDateShort(new Date(s.setAt))}. Soak ${s.soakDays || 7} days.` }])
  }

  return (
    <div className="card stack-sm">
      <div className="row between">
        <div className="eyebrow">Trap sets</div>
        <button className="chip" onClick={() => setOpen((o) => !o)}>{open ? 'Cancel' : '+ Log a set'}</button>
      </div>

      {open && (
        <div className="stack-sm">
          <label className="field"><span className="field-label">Set on</span><input className="input" type="datetime-local" value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })} /></label>
          <div className="row" style={{ gap: 8 }}>
            <label className="field" style={{ flex: 1 }}><span className="field-label"># Traps</span><input className="input" inputMode="numeric" value={f.traps} onChange={(e) => setF({ ...f, traps: e.target.value })} /></label>
            <label className="field" style={{ flex: 1 }}><span className="field-label">Soak days</span><input className="input" inputMode="numeric" value={f.soakDays} onChange={(e) => setF({ ...f, soakDays: e.target.value })} /></label>
          </div>
          <input className="input" placeholder="Spot / area (optional)" value={f.spot} onChange={(e) => setF({ ...f, spot: e.target.value })} />
          <button className="chip" onClick={useGps} style={{ alignSelf: 'flex-start' }}><IcPin width={13} height={13} /> {f.lat != null ? 'Pin dropped ✓' : 'Drop GPS pin (for the pull route)'}</button>
          <button className="btn primary block" onClick={add}>Save set</button>
        </div>
      )}

      {active.length === 0 && !open && (
        <p className="faint" style={{ fontSize: 13 }}>No traps out. Log the day you set them and Keys Angler reminds you when they’re ready to pull (bait stays fresh about a week — default 7 days).</p>
      )}

      {plan.order.length >= 2 && (
        <div className="card quiet stack-sm">
          <div className="eyebrow">Pull plan{plan.byDistance ? ` · ~${plan.totalNm.toFixed(0)} nm run` : ' · by readiness'}</div>
          {plan.order.map((s, i) => {
            const st = status(s)
            return (
              <div key={s.id} className="row between" style={{ fontSize: 13 }}>
                <span><b className="faint">{i + 1}.</b> {s.spot || (s.traps ? `${s.traps} traps` : 'Traps')}{s.lat != null ? '' : ' · no pin'}</span>
                <span style={{ color: st.tone === 'good' ? 'var(--good)' : st.tone === 'bad' ? 'var(--bad)' : 'var(--text-dim)' }}>{st.tone === 'soak' ? `${st.daysLeft}d` : st.label.replace('Ready to pull', 'ready')}</span>
              </div>
            )
          })}
          <div className="faint" style={{ fontSize: 11 }}>{plan.byDistance ? 'Shortest loop from the ramp through your pinned strings.' : 'Drop GPS pins on your sets to get a distance-optimized loop.'}</div>
        </div>
      )}

      {active.map((s) => {
        const st = status(s)
        return (
          <div key={s.id} className="trapset">
            <div className="row between">
              <div style={{ fontWeight: 650 }}>{s.traps ? `${s.traps} traps` : 'Traps'}{s.spot ? ` · ${s.spot}` : ''}{s.lat != null ? ' 📍' : ''}</div>
              <span className="tag" style={{ background: 'var(--surface-2)', color: st.tone === 'good' ? 'var(--good)' : st.tone === 'bad' ? 'var(--bad)' : 'var(--text-dim)' }}>{st.label}</span>
            </div>
            <div className="faint" style={{ fontSize: 12 }}>Set {fmtDateShort(new Date(s.setAt))} · pull by {fmtDateShort(new Date(st.pullBy))}</div>
            <div className="row" style={{ gap: 8, marginTop: 6 }}>
              <button className="chip" onClick={() => db.trapSets.update(s.id, { pulledAt: Date.now() })}>Mark pulled</button>
              <button className="chip" onClick={() => remind(s)}>＋ Reminder</button>
              <button className="icon-btn" onClick={() => db.trapSets.delete(s.id)} aria-label="Delete set" style={{ marginLeft: 'auto' }}><IcX width={18} height={18} /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
