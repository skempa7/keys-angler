import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { IcX } from './icons.jsx'

// Private, on-device user spots, ranked by a track record of "hits". The single
// highest-value layer for trapping — productivity is hyper-local and in no dataset.
export default function Spots({ kind, title = 'Your spots', bottoms }) {
  const spots = useLiveQuery(() => db.spots.where('kind').equals(kind).toArray(), [kind], [])
  const [name, setName] = useState('')
  const [depth, setDepth] = useState('')
  const [bottom, setBottom] = useState('')
  const [notes, setNotes] = useState('')
  const [open, setOpen] = useState(false)

  const ranked = [...(spots || [])].sort((a, b) => (b.hits || 0) - (a.hits || 0))

  const add = async () => {
    if (!name.trim()) return
    await db.spots.add({ kind, name: name.trim(), depth, bottom, notes, hits: 0, createdAt: Date.now() })
    setName(''); setDepth(''); setBottom(''); setNotes(''); setOpen(false)
  }

  return (
    <div className="card stack-sm">
      <div className="row between">
        <div className="eyebrow">{title}</div>
        <button className="chip" onClick={() => setOpen((o) => !o)}>{open ? 'Cancel' : '+ Add spot'}</button>
      </div>

      {open && (
        <div className="stack-sm">
          <input className="input" placeholder="Spot name (e.g. ‘rock pile off marker 5’)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="row" style={{ gap: 8 }}>
            <input className="input" placeholder="Depth (ft)" inputMode="numeric" value={depth} onChange={(e) => setDepth(e.target.value)} />
            <select className="input" value={bottom} onChange={(e) => setBottom(e.target.value)}>
              <option value="">Bottom…</option>
              {(bottoms || ['Hard/rocky', 'Patch reef', 'Pavement', 'Ledge', 'Grass edge', 'Channel']).map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <input className="input" placeholder="Notes (markers, range, depth band)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="btn primary block" onClick={add}>Save spot</button>
        </div>
      )}

      {ranked.length === 0 ? (
        <p className="faint" style={{ fontSize: 13 }}>No spots yet. Mark a productive spot, then tap “+1” each time it produces — they’ll rank by track record.</p>
      ) : (
        ranked.map((s) => (
          <div key={s.id} className="spot">
            <div className="spot-body">
              <div style={{ fontWeight: 650 }}>{s.name}</div>
              <div className="faint" style={{ fontSize: 12 }}>{[s.bottom, s.depth && `${s.depth} ft`, s.notes].filter(Boolean).join(' · ') || '—'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="spot-hits">{s.hits || 0}</div>
              <div className="faint" style={{ fontSize: 10 }}>hits</div>
            </div>
            <button className="chip" onClick={() => db.spots.update(s.id, { hits: (s.hits || 0) + 1, lastHit: Date.now() })}>+1</button>
            <button className="icon-btn" onClick={() => db.spots.delete(s.id)} aria-label="Delete spot"><IcX width={18} height={18} /></button>
          </div>
        ))
      )}
    </div>
  )
}
