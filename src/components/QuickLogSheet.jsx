import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/db.js'
import { useActiveLocation } from '../hooks/useActiveLocation.js'
import { loadConditions, snapshotFromConditions } from '../services/conditions.js'
import { nearestStation, ALL_MARINE_ZONES } from '../data/stations.js'
import { haptic } from '../utils/haptic.js'

// Global one-tap logger: the bottom-nav "+" fires 'ka-quicklog'; we create the catch
// instantly (so the moment isn't lost), enrich it with the cached condition snapshot
// + GPS in the background, and pop a species quick-pick + undo without leaving the page.
const FALLBACK = ['Yellowtail Snapper', 'Mahi-Mahi', 'Mutton Snapper', 'Tarpon', 'Bonefish', 'Grouper']

export default function QuickLogSheet() {
  const navigate = useNavigate()
  const loc = useActiveLocation()
  const catches = useLiveQuery(() => db.catches.orderBy('caughtAt').reverse().limit(12).toArray(), [], [])
  const [open, setOpen] = useState(false)
  const [id, setId] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    const onTrigger = async () => {
      const list = catches || []
      const newId = await db.catches.add({
        species: list[0]?.species || 'Yellowtail Snapper', lengthIn: null, weightLb: null, caughtAt: Date.now(),
        zone: list[0]?.zone || 'reef', bait: '', spot: '', notes: '', createdAt: Date.now(),
      })
      haptic(22); setId(newId); setOpen(true)
      clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 7000)
      // enrich from the cached conditions (no waiting on the tap)
      loadConditions({ lat: loc.lat, lon: loc.lon, station: nearestStation(loc.lat, loc.lon).id, zones: ALL_MARINE_ZONES, days: 1, when: new Date() })
        .then((data) => { if (data) db.catches.update(newId, { ...snapshotFromConditions(data, null), scoreAtCatch: data.nowScore?.score ?? null }) })
        .catch(() => {})
      if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => db.catches.update(newId, { lat: p.coords.latitude, lon: p.coords.longitude }), () => {}, { enableHighAccuracy: true, timeout: 8000 })
    }
    window.addEventListener('ka-quicklog', onTrigger)
    return () => { window.removeEventListener('ka-quicklog', onTrigger); clearTimeout(timer.current) }
  }, [loc.lat, loc.lon, catches])

  const setSpecies = (s) => { if (id) db.catches.update(id, { species: s }); haptic(); setOpen(false) }
  const undo = () => { if (id) db.catches.delete(id); haptic(); setOpen(false) }

  if (!open) return null
  const recent = [...new Set((catches || []).map((c) => c.species))].slice(0, 4)
  const chips = [...new Set([...recent, ...FALLBACK])].slice(0, 6)
  return (
    <div className="ql-sheet" role="dialog" aria-label="Quick log">
      <div className="ql-row"><b style={{ color: 'var(--good)' }}>Hooked up — logged ✓</b><button className="chip" onClick={undo}>Undo</button></div>
      <div className="ql-q">What was it?</div>
      <div className="row wrap" style={{ gap: 8 }}>
        {chips.map((s) => <button key={s} className="chip" onClick={() => setSpecies(s)}>{s}</button>)}
        <button className="chip" onClick={() => { setOpen(false); navigate('/log') }}>More / size…</button>
      </div>
    </div>
  )
}
