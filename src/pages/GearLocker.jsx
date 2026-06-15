import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { IcX, IcAnchor } from '../components/icons.jsx'
import EmptyState from '../components/EmptyState.jsx'

const CATEGORIES = ['Rods', 'Reels', 'Line', 'Leaders', 'Lures / flies', 'Bait rigs', 'Traps', 'Nets']
const BLANK_BOAT = { name: '', lengthFt: '', draftFt: '', rangeNm: '', electronics: '', notes: '' }

export default function GearLocker() {
  const boat = useLiveQuery(() => db.boats.toCollection().first(), [], undefined)
  const gear = useLiveQuery(() => db.gear.toArray(), [], [])

  const [editing, setEditing] = useState(false)
  const [bf, setBf] = useState(BLANK_BOAT)
  const [g, setG] = useState({ category: 'Rods', name: '', detail: '' })

  const startEdit = () => { setBf(boat ? { ...BLANK_BOAT, ...boat } : BLANK_BOAT); setEditing(true) }
  const saveBoat = async () => {
    if (boat?.id) await db.boats.update(boat.id, { ...bf })
    else await db.boats.add({ ...bf })
    setEditing(false)
  }
  const addGear = async () => {
    if (!g.name.trim()) return
    await db.gear.add({ category: g.category, name: g.name.trim(), detail: g.detail })
    setG({ category: g.category, name: '', detail: '' })
  }

  const byCat = CATEGORIES.map((c) => ({ cat: c, items: (gear || []).filter((x) => x.category === c) })).filter((x) => x.items.length)

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Gear & boat locker</div>
        <h1 className="h1">Your rig</h1>
        <p className="muted">Recommendations across the app filter to what you actually own.</p>
      </header>

      {/* Boat */}
      <div className="card stack-sm">
        <div className="row between">
          <div className="eyebrow">Boat</div>
          {!editing && <button className="chip" onClick={startEdit}>{boat ? 'Edit' : '+ Add boat'}</button>}
        </div>
        {editing ? (
          <div className="stack-sm">
            <input className="input" placeholder="Boat name / model" value={bf.name} onChange={(e) => setBf({ ...bf, name: e.target.value })} />
            <div className="row" style={{ gap: 8 }}>
              <input className="input" placeholder="Length (ft)" inputMode="decimal" value={bf.lengthFt} onChange={(e) => setBf({ ...bf, lengthFt: e.target.value })} />
              <input className="input" placeholder="Draft (ft)" inputMode="decimal" value={bf.draftFt} onChange={(e) => setBf({ ...bf, draftFt: e.target.value })} />
              <input className="input" placeholder="Range (nm)" inputMode="numeric" value={bf.rangeNm} onChange={(e) => setBf({ ...bf, rangeNm: e.target.value })} />
            </div>
            <input className="input" placeholder="Electronics (GPS, sonar, radar…)" value={bf.electronics} onChange={(e) => setBf({ ...bf, electronics: e.target.value })} />
            <textarea className="input" placeholder="Notes" value={bf.notes} onChange={(e) => setBf({ ...bf, notes: e.target.value })} />
            <div className="row" style={{ gap: 8 }}>
              <button className="btn primary block" onClick={saveBoat}>Save boat</button>
              <button className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : boat ? (
          <div>
            <div className="h2">{boat.name || 'My boat'}</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {[boat.lengthFt && `${boat.lengthFt}′`, boat.draftFt && `${boat.draftFt}′ draft`, boat.rangeNm && `${boat.rangeNm} nm range`].filter(Boolean).join(' · ')}
            </div>
            {boat.electronics && <div className="faint" style={{ fontSize: 13, marginTop: 4 }}>{boat.electronics}</div>}
          </div>
        ) : (
          <p className="faint" style={{ fontSize: 13 }}>Add your boat so trip plans can flag range &amp; draft limits.</p>
        )}
      </div>

      {/* Gear */}
      <div className="card stack-sm">
        <div className="eyebrow">Add tackle</div>
        <div className="row" style={{ gap: 8 }}>
          <select className="input" style={{ flex: '0 0 40%' }} value={g.category} onChange={(e) => setG({ ...g, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="input" placeholder="e.g. 7′ 20 lb spinning" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} />
        </div>
        <input className="input" placeholder="Detail (optional)" value={g.detail} onChange={(e) => setG({ ...g, detail: e.target.value })} />
        <button className="btn primary block" onClick={addGear}>Add to locker</button>
      </div>

      {byCat.length === 0 ? (
        <EmptyState icon={IcAnchor} title="Your locker is empty" note="Add rods, reels, line classes, leaders, lures, traps & nets — the app will only suggest rigs you can actually build." />
      ) : (
        byCat.map(({ cat, items }) => (
          <div key={cat} className="card stack-sm">
            <div className="eyebrow">{cat}</div>
            {items.map((it) => (
              <div key={it.id} className="catch-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 650 }}>{it.name}</div>
                  {it.detail && <div className="faint" style={{ fontSize: 12 }}>{it.detail}</div>}
                </div>
                <button className="icon-btn" onClick={() => db.gear.delete(it.id)} aria-label="Remove"><IcX width={18} height={18} /></button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
