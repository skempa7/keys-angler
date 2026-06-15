import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { ZONES, ZONE_BY_ID } from '../config.js'
import { ALL_MARINE_ZONES, nearestStation } from '../data/stations.js'
import { useActiveLocation } from '../hooks/useActiveLocation.js'
import { useConditions } from '../hooks/useConditions.js'
import { planTrip } from '../services/tripPlan.js'
import { getReg } from '../data/regs.js'
import { fmtTime, fmtRange, fmtDateShort, fmtDayShort, toneColor, strengthColor, compass, sstColor } from '../utils/format.js'
import { IcX, IcCheck } from '../components/icons.jsx'
import WindArrow from '../components/WindArrow.jsx'
import FactorList from '../components/FactorList.jsx'
import TripFishMap from '../components/TripFishMap.jsx'
import { baitList, zoneTargets, depthLabel, shortTide } from '../engine/tripTargets.js'
import { mergeLoadouts } from '../engine/loadout.js'
import { downloadICS, tripCalendarEvent } from '../services/phase2.js'
import { graduateTrip } from '../services/tripLog.js'

const pad = (n) => String(n).padStart(2, '0')
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const ymdLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

// A tap-to-load strip ranking the next week so you fish your best free day.
function BestDays({ onPick }) {
  const { data, loading } = useConditions({ days: 7 })
  const out = data?.outlook
  if (loading || !out?.length) return null
  const best = out.reduce((a, b) => (b.score > a.score ? b : a), out[0])
  return (
    <div className="card stack-sm">
      <div className="eyebrow">Best days this week</div>
      <div className="outlook">
        {out.map((d, i) => {
          const win = d.windows?.[0]
          return (
            <button key={i} className={`day-card ${d === best ? 'day-best' : ''}`} onClick={() => onPick(ymdLocal(d.date), win ? hhmm(new Date(win.center)) : '06:30')}>
              <div className="day-name">{i === 0 ? 'Today' : fmtDayShort(d.date)}</div>
              <div className="day-score" style={{ color: toneColor(d.verdict.tone) }}>{d.score}</div>
              <div className="day-verdict faint">{d === best ? 'Best bet' : ''}</div>
              {win && <div className="day-window">{fmtTime(new Date(win.center))}</div>}
            </button>
          )
        })}
      </div>
      <div className="faint" style={{ fontSize: 11 }}>Tap a day to load it into the planner.</div>
    </div>
  )
}

export default function TripPlanner() {
  const loc = useActiveLocation()
  // Fetch ALL then JS-filter/sort — orderBy('date') would drop template rows (no date index).
  const trips = useLiveQuery(() => db.trips.toArray(), [], [])
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
      const plan = await planTrip({ date, zoneId: form.zoneId, lat: loc.lat, lon: loc.lon, station: nearestStation(loc.lat, loc.lon).id, zones: ALL_MARINE_ZONES, departISO })
      const meta = { ...form, locName: loc.name }
      const id = await db.trips.add({ date: date.getTime(), dateStr: form.dateStr, zoneId: form.zoneId, departISO, returnTime: form.returnTime, party: form.party, notes: form.notes, plan, locName: loc.name, createdAt: Date.now(), status: 'planned' })
      setCurrent({ id, plan, meta }); setView('brief')
    } catch (e) {
      note('Could not build — need WiFi once to cache this trip.')
    } finally { setBusy(false) }
  }

  const openTrip = (t) => { setCurrent({ id: t.id, plan: t.plan, meta: { dateStr: t.dateStr, departTime: (t.departISO || '').slice(11, 16), returnTime: t.returnTime, party: t.party, notes: t.notes, locName: t.locName } }); setView('brief') }
  const del = (e, id) => { e.stopPropagation(); db.trips.delete(id) }
  const copyToForm = (t) => { setForm({ dateStr: t.dateStr || form.dateStr, departTime: (t.departISO || '').slice(11, 16) || '06:30', zoneId: t.zoneId, returnTime: t.returnTime || '', party: t.party || '', notes: t.notes || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); note('Loaded into the planner — adjust the date and rebuild.') }
  const renameTrip = (t) => { const n = window.prompt('Name this trip', t.name || ''); if (n != null) db.trips.update(t.id, { name: n.trim() }) }
  const saveTemplate = async () => {
    const dflt = `${ZONE_BY_ID[form.zoneId]?.short || 'Trip'} run`
    const n = window.prompt('Name this template', dflt); if (n == null) return
    await db.trips.add({ template: 1, status: 'template', name: n.trim() || dflt, zoneId: form.zoneId, departISO: `2000-01-01T${form.departTime || '06:30'}`, returnTime: form.returnTime, party: form.party, notes: form.notes, createdAt: Date.now() })
    note('Template saved.')
  }
  // JS-filter (NOT .notEqual — Dexie drops undefined-indexed rows). Templates = inputs, not cached briefings.
  const planned = (trips || []).filter((t) => t.template !== 1).sort((a, b) => (a.date || 0) - (b.date || 0))
  const templates = (trips || []).filter((t) => t.template === 1).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

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

      <BestDays onPick={(dateStr, departTime) => setForm((s) => ({ ...s, dateStr, departTime }))} />

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
        <button className="btn ghost block" onClick={saveTemplate}>Save these settings as a template</button>
      </div>

      {templates.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Templates</div>
          {templates.map((t) => (
            <div key={t.id} className="catch-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 650 }}>{t.name}</div>
                <div className="faint" style={{ fontSize: 12 }}>{ZONE_BY_ID[t.zoneId]?.short || 'Trip'} · depart {(t.departISO || '').slice(11, 16) || '06:30'}</div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <button className="chip" onClick={() => copyToForm(t)}>Use</button>
                  <button className="chip" onClick={() => renameTrip(t)}>Rename</button>
                </div>
              </div>
              <button className="icon-btn" onClick={(e) => del(e, t.id)} aria-label="Delete template"><IcX width={18} height={18} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="card stack-sm">
        <div className="eyebrow">Saved trips</div>
        {planned.length === 0 && <p className="faint" style={{ fontSize: 13 }}>No trips yet. Build one above while on WiFi — it’ll be ready offline on the water.</p>}
        {planned.map((t) => (
          <div key={t.id} className="catch-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 650, cursor: 'pointer' }} onClick={() => openTrip(t)}>{t.name || `${fmtDateShort(new Date(t.date))} · ${ZONE_BY_ID[t.zoneId]?.short}`}</div>
              <div className="faint" style={{ fontSize: 12 }}>{t.name ? `${fmtDateShort(new Date(t.date))} · ` : ''}Score {t.plan?.score} · {t.plan?.verdict?.label}</div>
              <div className="row" style={{ gap: 6, marginTop: 6 }}>
                <button className="chip" onClick={() => copyToForm(t)}>Copy</button>
                <button className="chip" onClick={() => renameTrip(t)}>Rename</button>
              </div>
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
  const [grad, setGrad] = useState(false)
  const date = new Date(p.date)
  const sunset = p.sunset ? new Date(p.sunset) : null
  const returnBy = meta.returnTime || (sunset ? fmtTime(sunset) : 'sunset')
  const top = (p.windows || []).slice(0, 3)
  const buffer = { backcountry: 20, reef: 35, offshore: 60 }[p.zoneId] || 30
  const leaveBy = p.windows?.[0] ? new Date(p.windows[0].start).getTime() - buffer * 60000 : null
  const targetsDeep = zoneTargets(p.zoneId, p.conditions?.sstF, p.biting) // shallow → deep
  const bait = baitList(targetsDeep)
  const gear = useLiveQuery(() => db.gear.toArray(), [], [])
  const loadout = mergeLoadouts(targetsDeep.map((t) => t.sp), gear)
  // Top windows by score, then ordered through the day; earliest → shallowest target.
  const runWindows = [...(p.windows || [])].slice(0, 4).sort((a, b) => a.start - b.start)
  const runSteps = runWindows.map((w, i) => ({ w, t: targetsDeep[Math.min(i, targetsDeep.length - 1)] })).filter((s) => s.t)
  const cc = p.conditions || {}
  const pack = []
  if (cc.uv != null && cc.uv >= 7) pack.push('Sun hoodie, zinc & polarized')
  if (cc.precipProb != null && cc.precipProb >= 40) pack.push('Foul-weather top + dry bag')
  if ((cc.gustKn != null && cc.gustKn >= 18) || (cc.waveFt != null && cc.waveFt >= 3)) pack.push('Lash it down · Bonine')
  if (cc.airF != null && cc.airF <= 68) pack.push('A layer for the run out')
  pack.push('Ice · water · chum')
  const permits = [...new Set(targetsDeep.map((t) => getReg(t.sp.regsKey)?.permit).filter(Boolean))]
  const conf = !p.forecastAvailable ? { pm: 15, label: 'Low' } : p.daysOut <= 2 ? { pm: 6, label: 'High' } : { pm: 10, label: 'Medium' }

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
        <p className="faint" style={{ fontSize: 12 }}>±{conf.pm} · {conf.label} confidence{!p.forecastAvailable ? ' — wind &amp; seas aren’t forecast this far out yet' : ''}</p>
      </header>

      {!p.forecastAvailable && (
        <div className="alert-banner info">Marine forecast isn’t published this far out ({p.daysOut} days). Tides, solunar &amp; bite windows are ready now — reopen on WiFi within ~16 days to cache wind &amp; seas.</div>
      )}
      {(p.safety || []).map((s, i) => (
        <div key={i} className={`alert-banner ${s.level === 'danger' ? 'danger' : s.level === 'warn' ? 'warn' : 'info'}`}><strong>⚠ {s.text}</strong></div>
      ))}

      {p.factors?.length > 0 && (
        <div className="card stack-sm">
          <div className="row between"><div className="h2">Why this score</div><span className="faint" style={{ fontSize: 12 }}>tap a factor</span></div>
          <FactorList factors={p.factors} />
          {leaveBy && <div className="faint" style={{ fontSize: 12 }}>Leave the dock by <b style={{ color: 'var(--text)' }}>{fmtTime(new Date(leaveBy))}</b> to be fishing when the {fmtTime(new Date(p.windows[0].start))} window opens.</div>}
        </div>
      )}

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
        <div className="card stat"><div className="row between"><div className="eyebrow">Wind & sea</div><WindArrow dir={p.conditions?.windDir} /></div><div className="stat-main">{p.conditions?.windKn != null ? `${Math.round(p.conditions.windKn)} kn` : '—'}</div><div className="faint stat-foot">{p.conditions?.waveFt != null ? `${p.conditions.waveFt.toFixed(1)} ft seas` : 'forecast pending'}</div></div>
        <div className="card stat"><div className="eyebrow">Water temp</div><div className="stat-main" style={{ color: sstColor(p.conditions?.sstF) }}>{p.conditions?.sstF != null ? `${Math.round(p.conditions.sstF)}°F` : '—'}</div><div className="faint stat-foot">{p.moon?.phaseName}</div></div>
        <div className="card stat"><div className="eyebrow">Sunrise</div><div className="stat-main">{fmtTime(p.sunrise ? new Date(p.sunrise) : null)}</div><div className="faint stat-foot">Sunset {fmtTime(sunset)}</div></div>
        <div className="card stat"><div className="eyebrow">Tides</div><div className="faint stat-foot" style={{ marginTop: 6 }}>{(p.tideEvents || []).map((e, i) => <div key={i}>{e.type === 'H' ? 'High' : 'Low'} {fmtTime(new Date(e.time))} ({e.level.toFixed(1)} ft)</div>)}{(p.tideEvents || []).length === 0 && '—'}</div></div>
      </div>

      <TripFishMap zoneId={p.zoneId} sstF={p.conditions?.sstF} biting={p.biting} />

      {runSteps.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Run sheet · work the day shallow → deep</div>
          {runSteps.map((s, i) => (
            <div key={i} className="row" style={{ gap: 10, alignItems: 'baseline' }}>
              <span className="faint" style={{ fontWeight: 700 }}>{i + 1}.</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 650 }}>{fmtTime(s.w.start)} · {s.t.sp.name.split(/[ (]/)[0]}</div>
                <div className="faint" style={{ fontSize: 12 }}>{depthLabel(s.t.sp)} · {shortTide(s.t.sp)}</div>
              </div>
              <span className="tag" style={{ background: 'var(--surface-2)', color: strengthColor(s.w.strength) }}>{s.w.strength}</span>
            </div>
          ))}
        </div>
      )}

      {bait.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Bait stop · buy it the night before</div>
          {bait.slice(0, 8).map((b) => (
            <div key={b.label} className="row between" style={{ fontSize: 13 }}>
              <span>{b.label}</span>
              <span className="faint" style={{ fontSize: 11 }}>{b.count > 1 ? `${b.count} targets` : b.species[0]}</span>
            </div>
          ))}
          <p className="faint" style={{ fontSize: 11 }}>Shared across your targets — the top of the list covers the most fish.</p>
        </div>
      )}

      {loadout.slots.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Tackle load-out · pull it the night before</div>
          {loadout.gearEmpty ? (
            <p className="faint" style={{ fontSize: 13 }}>Set up your gear locker to see what you already own for this trip.</p>
          ) : (
            <>
              <div className="h2" style={{ fontSize: 16 }}>You own {loadout.ownedCount} of {loadout.neededCount} categories</div>
              <div className="row wrap" style={{ gap: 8 }}>
                {loadout.slots.map((s) => (
                  <span key={s.key} className={`chip ${s.owned ? 'sel' : ''}`} style={s.owned ? undefined : { color: 'var(--text-dim)' }}>
                    {s.owned ? <IcCheck width={12} height={12} style={{ verticalAlign: '-1px', marginRight: 3 }} /> : null}{s.label}
                  </span>
                ))}
              </div>
              <p className="faint" style={{ fontSize: 11 }}>Filled = in your locker. Open chips are what to grab before you go.</p>
            </>
          )}
        </div>
      )}

      <div className="card stack-sm">
        <div className="eyebrow">Before you go</div>
        <div className="row wrap" style={{ gap: 8 }}>{pack.map((x) => <span key={x} className="chip">{x}</span>)}</div>
        {permits.length > 0 && <p className="faint" style={{ fontSize: 12 }}>⚠ Permit needed: {permits.join(' · ')}</p>}
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Export & safety</div>
        {new Date(p.date) < startOfToday() && (
          <button className="btn ghost block" disabled={grad} onClick={async () => { setGrad(true); try { const r = await graduateTrip({ id: current.id, plan: p, meta }); note(r ? 'Saved to your Trip Log.' : 'Already in your Trip Log.') } finally { setGrad(false) } }}>Log this as a past trip</button>
        )}
        <button className="btn primary block" onClick={share}>Share float plan</button>
        <button className="btn ghost block" onClick={() => downloadICS('keys-angler-trip.ics', [tripCalendarEvent(p, meta)])}>Add to calendar (.ics)</button>
        <button className="btn ghost block" onClick={() => window.print()}>Print / save plan</button>
        <p className="faint" style={{ fontSize: 12 }}>Leave a float plan with someone ashore. This is a planning aid — verify the live NWS marine forecast before you leave the dock.</p>
      </div>
    </div>
  )
}
