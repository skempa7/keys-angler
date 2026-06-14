import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { ZONES, ZONE_BY_ID } from '../config.js'
import { DEFAULTS, ALL_MARINE_ZONES } from '../data/stations.js'
import { useActiveLocation } from '../hooks/useActiveLocation.js'
import { planTrip } from '../services/tripPlan.js'
import { fmtTime, fmtRange, fmtDateShort, toneColor, strengthColor, compass } from '../utils/format.js'
import { IcX } from '../components/icons.jsx'
import { downloadICS, tripCalendarEvent } from '../services/phase2.js'

const pad = (n) => String(n).padStart(2, '0')
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }

export default function TripPlanner() {
  const loc = useActiveLocation()
  const trips = useLiveQuery(() => db.trips.orderBy('date').toArray(), [], [])
  const [form, setForm] = useState({ dateStr: tomorrowStr(), zoneId: 'reef', departTime: '06:30', returnTime: '', party: '', notes: '' })
  const [view, setView] = useState('home')
  const [current, setCurrent] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))
  const note = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const build = async () => {
    setBusy(true)
    try {
      const date = parseDate(form.dateStr)
      const departISO = `${form.dateStr}T${form.departTime || '06:30'}`
      const plan = await planTrip({ date, zoneId: form.zoneId, lat: loc.lat, lon: loc.lon, station: DEFAULTS.tideStation, zones: ALL_MARINE_ZONES, departISO })
      const meta = { ...form, locName: loc.name }
      const id = await db.trips.add({ date: date.getTime(), dateStr: form.dateStr, zoneId: form.zoneId, departISO, returnTime: form.returnTime, party: form.party, notes: form.notes, plan, locName: loc.name, createdAt: Date.now(), status: 'planned' })
      setCurrent({ id, plan, meta }); setView('brief')
    } catch (e) {
      note('Could not build — need WiFi once to cache this trip.')
    } finally { setBusy(false) }
  }

  const openTrip = (t) => { setCurrent({ id: t.id, plan: t.plan, meta: { dateStr: t.dateStr, departTime: (t.departISO || '').slice(11, 16), returnTime: t.returnTime, party: t.party, notes: t.notes, locName: t.locName } }); setView('brief') }
  const del = (e, id) => { e.stopPropagation(); db.trips.delete(id) }

  if (view === 'brief' && current) {
    return <Briefing current={current} loc={loc} onBack={() => { setCurrent(null); setView('home') }} note={note} msg={msg} />
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Trip planner</div>
        <h1 className="h1">Plan a trip</h1>
        <p className="muted">Builds &amp; caches the full briefing so it works offline on the water.</p>
      </header>

      {msg && <div className="alert-banner info">{msg}</div>}

      <div className="card stack-sm">
        <div className="row" style={{ gap: 8 }}>
          <label className="field" style={{ flex: 1 }}><span className="field-label">Date</span><input className="input" type="date" value={form.dateStr} onChange={set('dateStr')} /></label>
          <label className="field" style={{ flex: 1 }}><span className="field-label">Depart</span><input className="input" type="time" value={form.departTime} onChange={set('departTime')} /></label>
        </div>
        <div className="field">
          <span className="field-label">Target zone</span>
          <div className="row wrap" style={{ gap: 8 }}>
            {ZONES.map((z) => <button key={z.id} className={`chip ${form.zoneId === z.id ? 'active' : ''}`} onClick={() => setForm((s) => ({ ...s, zoneId: z.id }))}>{z.short}</button>)}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <label className="field" style={{ flex: 1 }}><span className="field-label">Planned return</span><input className="input" type="time" value={form.returnTime} onChange={set('returnTime')} placeholder="sunset" /></label>
          <label className="field" style={{ flex: 1 }}><span className="field-label">Party size</span><input className="input" inputMode="numeric" value={form.party} onChange={set('party')} /></label>
        </div>
        <label className="field"><span className="field-label">Notes</span><input className="input" value={form.notes} onChange={set('notes')} placeholder="Who's aboard, ramp, plan B…" /></label>
        <button className="btn primary block lg" onClick={build} disabled={busy}>{busy ? 'Building & caching…' : 'Build & cache plan'}</button>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Saved trips</div>
        {(!trips || trips.length === 0) && <p className="faint" style={{ fontSize: 13 }}>No trips yet. Build one above while on WiFi — it’ll be ready offline on the water.</p>}
        {(trips || []).map((t) => (
          <div key={t.id} className="catch-row" onClick={() => openTrip(t)} style={{ cursor: 'pointer' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 650 }}>{fmtDateShort(new Date(t.date))} · {ZONE_BY_ID[t.zoneId]?.short}</div>
              <div className="faint" style={{ fontSize: 12 }}>Score {t.plan?.score} · {t.plan?.verdict?.label}</div>
            </div>
            <button className="icon-btn" onClick={(e) => del(e, t.id)} aria-label="Delete trip"><IcX width={18} height={18} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildFloatPlan(p, meta, loc) {
  const ret = meta.returnTime || (p.sunset ? fmtTime(new Date(p.sunset)) : 'sunset')
  return [
    'KEYS ANGLER — FLOAT PLAN',
    `Launch: ${meta.locName || loc.name}`,
    `Date: ${fmtDateShort(new Date(p.date))}`,
    `Depart: ${meta.departTime || '—'}   Return by: ${ret}`,
    `Zone: ${p.zoneName}`,
    meta.party ? `Party: ${meta.party}` : '',
    `Targeting: ${(p.biting || []).map((b) => b.name).join(', ')}`,
    p.conditions?.windKn != null ? `Forecast: ${Math.round(p.conditions.windKn)} kn ${compass(p.conditions.windDir)}, ${p.conditions.waveFt?.toFixed(1)} ft seas` : '',
    p.windows?.[0] ? `Best window: ${fmtRange(new Date(p.windows[0].start), new Date(p.windows[0].end))}` : '',
    meta.notes ? `Notes: ${meta.notes}` : '',
    `If not back/heard from by a reasonable margin past return, contact USCG Sector Key West (VHF 16) or call 911.`,
  ].filter(Boolean).join('\n')
}

function Briefing({ current, loc, onBack, note }) {
  const { plan: p, meta } = current
  const date = new Date(p.date)
  const sunset = p.sunset ? new Date(p.sunset) : null
  const returnBy = meta.returnTime || (sunset ? fmtTime(sunset) : 'sunset')
  const top = (p.windows || []).slice(0, 3)

  const share = async () => {
    const text = buildFloatPlan(p, meta, loc)
    try {
      if (navigator.share) await navigator.share({ title: 'Keys Angler Float Plan', text })
      else { await navigator.clipboard.writeText(text); note('Float plan copied to clipboard.') }
    } catch { /* user cancelled */ }
  }

  return (
    <div className="stack">
      <button className="btn ghost" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Trips</button>

      <header className="page-head">
        <div className="eyebrow">{fmtDateShort(date)} · {p.zoneName}</div>
        <h1 className="display" style={{ color: toneColor(p.verdict?.tone) }}>{p.verdict?.label}</h1>
        <p className="muted">Score {p.score}/100 · Depart {meta.departTime || '—'} · <strong style={{ color: 'var(--gold)' }}>Return by {returnBy}</strong></p>
      </header>

      {!p.forecastAvailable && (
        <div className="alert-banner info">Marine forecast isn’t published this far out ({p.daysOut} days). Tides, solunar &amp; bite windows are ready now — reopen on WiFi within ~16 days to cache wind &amp; seas.</div>
      )}
      {(p.safety || []).map((s, i) => (
        <div key={i} className={`alert-banner ${s.level === 'danger' ? 'danger' : s.level === 'warn' ? 'warn' : 'info'}`}><strong>⚠ {s.text}</strong></div>
      ))}

      <div className="card stack-sm">
        <div className="eyebrow">Best bite windows</div>
        {top.length === 0 && <p className="faint" style={{ fontSize: 13 }}>No windows — connect on WiFi to cache tides for this date.</p>}
        {top.map((w, i) => (
          <div key={i} className="window-row" style={{ padding: '8px 0', borderTop: i ? '1px solid var(--border-soft)' : 'none' }}>
            <div className="row between">
              <div className="h2 tnum">{fmtRange(new Date(w.start), new Date(w.end))}</div>
              <span className="tag" style={{ color: strengthColor(w.strength) }}>{w.strength} · {w.score}</span>
            </div>
            <div className="faint" style={{ fontSize: 12 }}>{w.triggers.map((t) => t.label).join(' · ')}</div>
          </div>
        ))}
      </div>

      <div className="grid cols-2">
        <div className="card stat"><div className="eyebrow">Wind & sea</div><div className="stat-main">{p.conditions?.windKn != null ? `${Math.round(p.conditions.windKn)} kn` : '—'}</div><div className="faint stat-foot">{p.conditions?.waveFt != null ? `${p.conditions.waveFt.toFixed(1)} ft seas` : 'forecast pending'}</div></div>
        <div className="card stat"><div className="eyebrow">Water temp</div><div className="stat-main">{p.conditions?.sstF != null ? `${Math.round(p.conditions.sstF)}°F` : '—'}</div><div className="faint stat-foot">{p.moon?.phaseName}</div></div>
        <div className="card stat"><div className="eyebrow">Sunrise</div><div className="stat-main">{fmtTime(p.sunrise ? new Date(p.sunrise) : null)}</div><div className="faint stat-foot">Sunset {fmtTime(sunset)}</div></div>
        <div className="card stat"><div className="eyebrow">Tides</div><div className="faint stat-foot" style={{ marginTop: 6 }}>{(p.tideEvents || []).map((e, i) => <div key={i}>{e.type === 'H' ? 'High' : 'Low'} {fmtTime(new Date(e.time))} ({e.level.toFixed(1)} ft)</div>)}{(p.tideEvents || []).length === 0 && '—'}</div></div>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">What's biting · {p.zoneName}</div>
        <div className="row wrap" style={{ gap: 8 }}>
          {(p.biting || []).map((b) => (
            <span key={b.id} className="chip" style={{ color: b.cr ? 'var(--accent)' : b.keepable ? 'var(--good)' : 'var(--caution)' }}>
              {b.name} · {b.status}
            </span>
          ))}
        </div>
        {p.rig && <p className="muted" style={{ fontSize: 14, marginTop: 6 }}><strong>Rig:</strong> {p.rig}</p>}
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Export & safety</div>
        <button className="btn primary block" onClick={share}>Share float plan</button>
        <button className="btn ghost block" onClick={() => downloadICS('keys-angler-trip.ics', [tripCalendarEvent(p, meta)])}>Add to calendar (.ics)</button>
        <button className="btn ghost block" onClick={() => window.print()}>Print / save plan</button>
        <p className="faint" style={{ fontSize: 12 }}>Leave a float plan with someone ashore. This is a planning aid — verify the live NWS marine forecast before you leave the dock.</p>
      </div>
    </div>
  )
}
