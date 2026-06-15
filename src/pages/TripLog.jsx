import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { ZONES, ZONE_BY_ID } from '../config.js'
import { useConditions } from '../hooks/useConditions.js'
import { useActiveLocation } from '../hooks/useActiveLocation.js'
import { useTripCatches } from '../hooks/useTripCatches.js'
import {
  deriveTrips, createBackfillTrip, createManualTrip, toggleFavorite, toggleFolder,
  updateTrip, deleteTrip, refreshConditions, createFolder, deleteFolder, suggestFolders,
  localDateStr, todayStr,
} from '../services/tripLog.js'
import { fmtDateShort, fmtTime, fmtRange, toneColor, sstColor, compass, strengthColor } from '../utils/format.js'
import MoonGlyph from '../components/MoonGlyph.jsx'
import WindArrow from '../components/WindArrow.jsx'
import { IcStar, IcPlus, IcX, IcBook } from '../components/icons.jsx'
import { haptic } from '../utils/haptic.js'

const tripTitle = (t) => t.title || `${ZONE_BY_ID[t.zoneId]?.short || 'Trip'} · ${fmtDateShort(new Date(t.date))}`
const catchSummary = (catches) => {
  if (!catches.length) return 'No catches logged that day'
  const sp = [...new Set(catches.map((c) => c.species))]
  return `${catches.length} fish · ${sp.slice(0, 2).join(', ')}${sp.length > 2 ? '…' : ''}`
}

export default function TripLog() {
  const loc = useActiveLocation()
  const { data } = useConditions({ days: 1 })
  const trips = useLiveQuery(() => db.logTrips.orderBy('date').reverse().toArray(), [], [])
  const folders = useLiveQuery(() => db.logFolders.orderBy('sort').toArray(), [], [])
  const allCatches = useLiveQuery(() => db.catches.toArray(), [], [])

  const [view, setView] = useState('list')
  const [selId, setSelId] = useState(null)
  const [form, setForm] = useState(null) // null | {mode:'new'|'edit', ...fields}
  const [filter, setFilter] = useState({ type: 'all', id: null })

  const catchesByDate = useMemo(() => {
    const by = {}
    for (const c of allCatches || []) { const ds = localDateStr(c.caughtAt); (by[ds] || (by[ds] = [])).push(c) }
    return by
  }, [allCatches])

  const loggedSet = useMemo(() => new Set((trips || []).map((t) => t.dateStr)), [trips])
  const suggestions = useMemo(() => deriveTrips(allCatches || [], loggedSet), [allCatches, loggedSet])

  const shown = useMemo(() => {
    let list = trips || []
    if (filter.type === 'fav') list = list.filter((t) => t.favorite)
    else if (filter.type === 'folder') list = list.filter((t) => (t.folderIds || []).includes(filter.id))
    return list
  }, [trips, filter])

  const folderCount = (fid) => (trips || []).filter((t) => (t.folderIds || []).includes(fid)).length
  const sel = (trips || []).find((t) => t.id === selId)

  if (view === 'detail' && sel) {
    const sameDay = (trips || []).filter((t) => t.dateStr === sel.dateStr).length
    return <TripDetail trip={sel} folders={folders || []} sameDay={sameDay} onBack={() => { setView('list'); setSelId(null) }}
      onEdit={() => { setForm({ mode: 'edit', ...sel, party: sel.partyOf ?? '' }); setView('list'); setSelId(null) }} />
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Trip log</div>
        <h1 className="h1">Your trips</h1>
        <p className="muted">Every day on the water — the conditions, the catches, your way. Favorite the good ones, file them in folders.</p>
      </header>

      {!form && (
        <button className="btn primary block lg" onClick={() => { setForm({ mode: 'new', dateStr: todayStr(), zoneId: 'reef', title: '', party: '', notes: '', favorite: 0, folderIds: [] }); haptic() }}>
          ＋ Log a trip
        </button>
      )}
      {form && (
        <TripForm form={form} setForm={setForm} folders={folders || []} loc={loc} data={data}
          onClose={() => setForm(null)} />
      )}

      {/* Backfill suggestions from catch history */}
      {suggestions.length > 0 && (
        <div className="card stack-sm">
          <div className="row between">
            <div className="eyebrow">Suggested from your catches</div>
            <button className="chip" onClick={async () => { for (const s of suggestions) await createBackfillTrip(s); haptic(18) }}>Add all {suggestions.length}</button>
          </div>
          {suggestions.slice(0, 8).map((s) => (
            <div key={s.dateStr} className="catch-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 650 }}>{fmtDateShort(new Date(s.ms))} · {ZONE_BY_ID[s.zoneId]?.short || 'Trip'}</div>
                <div className="faint" style={{ fontSize: 12 }}>{s.count} fish · {s.species.slice(0, 3).join(', ')}{s.species.length > 3 ? '…' : ''}</div>
              </div>
              <button className="chip" onClick={async () => { await createBackfillTrip(s); haptic() }}>Add</button>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="row wrap" style={{ gap: 8 }}>
        <button className={`chip ${filter.type === 'all' ? 'active' : ''}`} onClick={() => setFilter({ type: 'all', id: null })}>All{trips ? ` · ${trips.length}` : ''}</button>
        <button className={`chip ${filter.type === 'fav' ? 'active' : ''}`} onClick={() => setFilter({ type: 'fav', id: null })}>★ Favorites</button>
        {(folders || []).map((f) => (
          <button key={f.id} className={`chip ${filter.type === 'folder' && filter.id === f.id ? 'active' : ''}`} onClick={() => setFilter({ type: 'folder', id: f.id })}>
            {f.emoji ? `${f.emoji} ` : ''}{f.name} · {folderCount(f.id)}
          </button>
        ))}
        <FolderCreator catches={allCatches || []} folders={folders || []} />
      </div>

      {/* Trip list */}
      {shown.length === 0 ? (
        <div className="placeholder">
          <div className="big"><IcBook width={34} height={34} /></div>
          <p>{filter.type === 'all'
            ? 'No trips yet. Log your first one above — or add a day you already logged catches.'
            : filter.type === 'fav'
              ? 'No favorites yet — tap the star on a trip to file it here.'
              : `No trips in “${(folders || []).find((f) => f.id === filter.id)?.name || 'this folder'}” yet.`}</p>
        </div>
      ) : (
        <div className="card stack-sm">
          {shown.map((t) => {
            const dayCatches = catchesByDate[t.dateStr] || []
            return (
              <div key={t.id} className="catch-row" onClick={() => { setSelId(t.id); setView('detail') }} style={{ cursor: 'pointer' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 650 }}>{tripTitle(t)}</div>
                  <div className="faint" style={{ fontSize: 12 }}>
                    {catchSummary(dayCatches)}{t.dayLabel ? ` · ${t.dayLabel}` : ''}
                  </div>
                  {(t.folderIds || []).length > 0 && (
                    <div className="row wrap" style={{ gap: 4, marginTop: 4 }}>
                      {t.folderIds.map((fid) => { const f = (folders || []).find((x) => x.id === fid); return f ? <span key={fid} className="tag" style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-dim)' }}>{f.name}</span> : null })}
                    </div>
                  )}
                </div>
                {t.moon && <MoonGlyph illum={t.moon.illum} phaseDeg={t.moon.phaseDeg} size={26} />}
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); toggleFavorite(t); haptic() }} aria-pressed={!!t.favorite} aria-label={t.favorite ? 'Unfavorite trip' : 'Favorite trip'}>
                  <IcStar width={18} height={18} style={{ color: t.favorite ? 'var(--gold)' : 'var(--text-faint)' }} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TripDetail({ trip, folders, sameDay = 1, onBack, onEdit }) {
  const catches = useTripCatches(trip.dateStr)
  const c = trip.conditions
  const windows = trip.windows || []

  return (
    <div className="stack">
      <button className="btn ghost" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Trips</button>

      <header className="page-head">
        <div className="eyebrow">{fmtDateShort(new Date(trip.date))} · {ZONE_BY_ID[trip.zoneId]?.short || ''}{trip.locName ? ` · ${trip.locName}` : ''}</div>
        <div className="row between">
          <h1 className="display" style={{ color: trip.verdict ? toneColor(trip.verdict.tone) : 'var(--text)' }}>{trip.title || trip.dayLabel || trip.verdict?.label || 'Trip'}</h1>
          <button className="icon-btn" onClick={() => { toggleFavorite(trip); haptic() }} aria-pressed={!!trip.favorite} aria-label={trip.favorite ? 'Unfavorite trip' : 'Favorite trip'}>
            <IcStar width={22} height={22} style={{ color: trip.favorite ? 'var(--gold)' : 'var(--text-faint)' }} />
          </button>
        </div>
        <p className="muted">{trip.score != null ? `Score ${trip.score}/100 · ` : ''}{trip.moon?.phaseName || ''}{trip.source === 'graduated' ? ' · from planner' : ''}</p>
      </header>

      {/* Folder chips */}
      {folders.length > 0 && (
        <div className="row wrap" style={{ gap: 8 }}>
          {folders.map((f) => {
            const on = (trip.folderIds || []).includes(f.id)
            return <button key={f.id} className={`chip ${on ? 'active' : ''}`} onClick={() => { toggleFolder(trip, f.id); haptic() }}>{on ? '✓ ' : '+ '}{f.name}</button>
          })}
        </div>
      )}

      {/* Conditions */}
      {c ? (
        <div className="grid cols-2">
          <div className="card stat"><div className="row between"><div className="eyebrow">Wind & sea</div><WindArrow dir={c.windDir} /></div><div className="stat-main">{c.windKn != null ? `${Math.round(c.windKn)} kn` : '—'}</div><div className="faint stat-foot">{c.waveFt != null ? `${c.waveFt.toFixed(1)} ft seas` : (c.windDir != null ? compass(c.windDir) : '')}</div></div>
          <div className="card stat"><div className="eyebrow">Water temp</div><div className="stat-main" style={{ color: sstColor(c.sstF) }}>{c.sstF != null ? `${Math.round(c.sstF)}°F` : '—'}</div><div className="faint stat-foot">{c.tideDir ? `${c.tideDir} tide` : ''}</div></div>
        </div>
      ) : (
        <div className="card quiet"><p className="faint" style={{ fontSize: 13 }}>Logged from memory — conditions weren't captured for this day. Moon &amp; solunar are computed; wind &amp; seas weren't recorded.</p></div>
      )}

      {/* Bite windows (graduated trips) */}
      {windows.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Bite windows that day</div>
          {windows.slice(0, 3).map((w, i) => (
            <div key={i} className="window-row" style={{ padding: '8px 0', borderTop: i ? '1px solid var(--border-soft)' : 'none' }}>
              <div className="row between"><div className="h2 tnum">{fmtRange(new Date(w.start), new Date(w.end))}</div><span className="tag" style={{ color: strengthColor(w.strength) }}>{w.strength}</span></div>
            </div>
          ))}
        </div>
      )}

      {/* Catches that day */}
      <div className="card stack-sm">
        <div className="row between">
          <div className="eyebrow">Catches · {catches.length}</div>
          {catches.length > 0 && !c && <button className="chip" onClick={() => { refreshConditions(trip, catches); haptic() }}>Pull conditions from catches</button>}
        </div>
        {sameDay > 1 && <p className="faint" style={{ fontSize: 12 }}>Showing every catch logged that day (you have more than one trip on {fmtDateShort(new Date(trip.date))}).</p>}
        {catches.length === 0 && <p className="faint" style={{ fontSize: 13 }}>No catches logged on this day.</p>}
        {catches.map((ct) => (
          <div key={ct.id} className="catch-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 650 }}>{ct.species}{ct.lengthIn ? ` · ${ct.lengthIn}"` : ''}</div>
              <div className="faint" style={{ fontSize: 12 }}>{fmtTime(new Date(ct.caughtAt))}{ct.tide ? ` · ${ct.tide}` : ''}{ct.bait ? ` · ${ct.bait}` : ''}</div>
            </div>
          </div>
        ))}
      </div>

      {trip.notes && <div className="card stack-sm"><div className="eyebrow">Notes</div><p style={{ fontSize: 14 }}>{trip.notes}</p></div>}

      <div className="row" style={{ gap: 8 }}>
        <button className="btn ghost block" onClick={onEdit}>Edit trip</button>
        <button className="btn ghost" onClick={() => { if (window.confirm('Delete this trip from your log? Your catches stay put.')) { deleteTrip(trip.id); onBack() } }} style={{ color: 'var(--bad)' }}>Delete</button>
      </div>
    </div>
  )
}

function TripForm({ form, setForm, folders, loc, data, onClose }) {
  const isEdit = form.mode === 'edit'
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }))
  const toggleF = (fid) => setForm((s) => { const set2 = new Set(s.folderIds || []); set2.has(fid) ? set2.delete(fid) : set2.add(fid); return { ...s, folderIds: [...set2] } })

  const save = async () => {
    if (isEdit) {
      const p = Number(form.party)
      await updateTrip(form.id, {
        zoneId: form.zoneId, title: (form.title || '').trim(), notes: (form.notes || '').trim(),
        folderIds: form.folderIds || [],
        partyOf: form.party === '' || form.party == null || !Number.isFinite(p) || p <= 0 ? null : p,
      })
    } else {
      await createManualTrip(form, loc, data)
    }
    haptic(); onClose()
  }

  return (
    <div className="card stack-sm">
      <div className="eyebrow">{isEdit ? 'Edit trip' : 'Log a trip'}</div>
      {!isEdit && (
        <label className="field"><span className="field-label">Date</span><input className="input" type="date" value={form.dateStr} onChange={set('dateStr')} max={todayStr()} /></label>
      )}
      <div className="field">
        <span className="field-label">Zone</span>
        <div className="row wrap" style={{ gap: 8 }}>
          {ZONES.map((z) => <button key={z.id} className={`chip ${form.zoneId === z.id ? 'active' : ''}`} onClick={() => setForm((s) => ({ ...s, zoneId: z.id }))}>{z.short}</button>)}
        </div>
      </div>
      <label className="field"><span className="field-label">Title <span className="faint">(optional)</span></span><input className="input" value={form.title || ''} onChange={set('title')} placeholder="e.g. Dawn tarpon, Channel #5" /></label>
      <div className="row" style={{ gap: 8 }}>
        <label className="field" style={{ flex: 1 }}><span className="field-label">Party size</span><input className="input" inputMode="numeric" value={form.party ?? ''} onChange={set('party')} /></label>
      </div>
      <label className="field"><span className="field-label">Notes</span><input className="input" value={form.notes || ''} onChange={set('notes')} placeholder="How it went, where, what worked…" /></label>
      {folders.length > 0 && (
        <div className="field">
          <span className="field-label">Folders</span>
          <div className="row wrap" style={{ gap: 8 }}>
            {folders.map((f) => <button key={f.id} className={`chip ${(form.folderIds || []).includes(f.id) ? 'active' : ''}`} onClick={() => toggleF(f.id)}>{f.name}</button>)}
          </div>
        </div>
      )}
      <div className="row" style={{ gap: 8 }}>
        <button className="btn primary block" onClick={save}>{isEdit ? 'Save changes' : 'Save trip'}</button>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

function FolderCreator({ catches, folders }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const existing = new Set(folders.map((f) => f.name.toLowerCase()))
  const ideas = suggestFolders(catches).filter((s) => !existing.has(s.name.toLowerCase()))

  if (!open) return <button className="chip" onClick={() => setOpen(true)}><IcPlus width={14} height={14} /> Folder</button>
  return (
    <div className="card stack-sm" style={{ width: '100%' }}>
      <div className="row between"><div className="eyebrow">New folder</div><button className="icon-btn" onClick={() => { setOpen(false); setName('') }} aria-label="Close"><IcX width={16} height={16} /></button></div>
      <div className="row" style={{ gap: 8 }}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name (e.g. Tarpon, Bahia Honda)" style={{ flex: 1 }} />
        <button className="btn primary" onClick={async () => { if (await createFolder({ name })) { setName(''); setOpen(false); haptic() } }}>Add</button>
      </div>
      {ideas.length > 0 && (
        <div className="row wrap" style={{ gap: 8 }}>
          {ideas.map((s) => <button key={s.seedKey} className="chip" onClick={async () => { if (await createFolder(s)) { setName(''); setOpen(false); haptic() } }}>+ {s.name}</button>)}
        </div>
      )}
    </div>
  )
}
