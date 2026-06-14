import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { db } from '../db/db.js'
import { useActiveLocation } from '../hooks/useActiveLocation.js'
import { getHabitat, crabHabitatScore } from '../services/habitat.js'
import { IcX } from '../components/icons.jsx'

const KIND = {
  fish: { label: 'Fishing', color: '#36c5f0' },
  crab: { label: 'Stone crab', color: '#f2c14e' },
  lobster: { label: 'Lobster', color: '#ff8a4c' },
}
const CATCH_COLOR = '#3ddc84'
const esc = (s) => (s || '').replace(/[<>&]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[m]))

export default function MapSpots() {
  const loc = useActiveLocation()
  const spots = useLiveQuery(() => db.spots.toArray(), [], [])
  const catches = useLiveQuery(() => db.catches.toArray(), [], [])
  const elRef = useRef()
  const mapRef = useRef()
  const layerRef = useRef()
  const heatLayerRef = useRef()
  const [heatMode, setHeatMode] = useState(false)
  const [dropMode, setDropMode] = useState(false)
  const dropRef = useRef(false)
  const [draft, setDraft] = useState(null)
  const [form, setForm] = useState({ name: '', kind: 'fish' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const note = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2600) }
  dropRef.current = dropMode

  useEffect(() => {
    const map = L.map(elRef.current).setView([loc.lat, loc.lon], 12)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map)
    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.on('click', (e) => { if (dropRef.current) setDraft({ lat: e.latlng.lat, lon: e.latlng.lng }) })
    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 120)
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const lg = layerRef.current
    const map = mapRef.current
    if (!lg || !map) return
    lg.clearLayers()
    ;(spots || []).filter((s) => s.lat != null).forEach((s) => {
      const col = KIND[s.kind]?.color || KIND.fish.color
      L.circleMarker([s.lat, s.lon], { radius: 7, color: col, fillColor: col, fillOpacity: 0.85, weight: 2 })
        .bindPopup(`<b>${esc(s.name)}</b><br>${[KIND[s.kind]?.label, s.bottom, s.depth && `${s.depth} ft`].filter(Boolean).join(' · ')}`)
        .addTo(lg)
    })
    const catchPts = (catches || []).filter((c) => c.lat != null)
    if (heatLayerRef.current) { map.removeLayer(heatLayerRef.current); heatLayerRef.current = null }
    if (heatMode) {
      if (catchPts.length && L.heatLayer) {
        heatLayerRef.current = L.heatLayer(catchPts.map((c) => [c.lat, c.lon, 0.9]), { radius: 30, blur: 22, maxZoom: 15, gradient: { 0.3: '#1b7fa3', 0.6: '#3ddc84', 1: '#f2c14e' } }).addTo(map)
      }
    } else {
      catchPts.forEach((c) => {
        L.circleMarker([c.lat, c.lon], { radius: 5, color: CATCH_COLOR, fillColor: CATCH_COLOR, fillOpacity: 0.55, weight: 1 })
          .bindPopup(`<b>${esc(c.species)}</b>${c.lengthIn ? ` · ${c.lengthIn}"` : ''}`)
          .addTo(lg)
      })
    }
    if (draft) L.circleMarker([draft.lat, draft.lon], { radius: 8, color: '#ffffff', fillColor: KIND[form.kind].color, fillOpacity: 0.9, weight: 2 }).addTo(lg)
  }, [spots, catches, draft, form.kind, heatMode])

  const locateMe = () => {
    if (!navigator.geolocation) return note('Geolocation not available')
    navigator.geolocation.getCurrentPosition(
      (p) => { mapRef.current?.setView([p.coords.latitude, p.coords.longitude], 14); if (dropRef.current) setDraft({ lat: p.coords.latitude, lon: p.coords.longitude }) },
      () => note('Location permission denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const saveSpot = async () => {
    if (!draft || !form.name.trim()) return
    setBusy(true)
    let h = {}
    try { h = await getHabitat(draft.lat, draft.lon) } catch { /* offline */ }
    await db.spots.add({ kind: form.kind, name: form.name.trim(), lat: draft.lat, lon: draft.lon, bottom: h.bottom || '', depth: h.depthFt != null ? String(h.depthFt) : '', hits: 0, createdAt: Date.now() })
    setBusy(false); setDraft(null); setForm({ name: '', kind: 'fish' }); setDropMode(false)
    note(h.bottom || h.depthFt != null ? `Saved — ${[h.bottom, h.depthFt != null && `${h.depthFt} ft`].filter(Boolean).join(', ')}` : 'Spot saved.')
  }

  const mapped = (spots || []).filter((s) => s.lat != null)
  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Map &amp; spots</div>
        <h1 className="h1">Your waters</h1>
        <p className="muted">Drop spots, see your catches, and get bottom-type + depth where you pin.</p>
      </header>

      {msg && <div className="alert-banner info">{msg}</div>}

      <div className="map-toolbar">
        <button className={`chip ${dropMode ? 'active' : ''}`} onClick={() => { setDropMode((d) => !d); setDraft(null) }}>
          {dropMode ? 'Tap the map to drop…' : '＋ Drop a spot'}
        </button>
        <button className="chip" onClick={locateMe}>📍 My location</button>
        <button className={`chip ${heatMode ? 'active' : ''}`} onClick={() => setHeatMode((h) => !h)}>{heatMode ? '🔥 Heatmap on' : '🔥 Catch heatmap'}</button>
      </div>

      <div ref={elRef} className="map-el" />

      {draft && (
        <div className="card stack-sm">
          <div className="eyebrow">New spot</div>
          <input className="input" placeholder="Spot name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="row wrap" style={{ gap: 8 }}>
            {Object.entries(KIND).map(([k, v]) => (
              <button key={k} className={`chip ${form.kind === k ? 'active' : ''}`} onClick={() => setForm({ ...form, kind: k })}>{v.label}</button>
            ))}
          </div>
          <div className="faint" style={{ fontSize: 12 }}>{draft.lat.toFixed(4)}, {draft.lon.toFixed(4)} · bottom &amp; depth looked up on save (when online)</div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn primary block" onClick={saveSpot} disabled={busy}>{busy ? 'Saving…' : 'Save spot'}</button>
            <button className="btn ghost" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card stack-sm">
        <div className="eyebrow">Mapped spots · {mapped.length}</div>
        {mapped.length === 0 && <p className="faint" style={{ fontSize: 13 }}>No pinned spots yet. Tap “Drop a spot”, then tap the map (or use My location).</p>}
        {mapped.map((s) => {
          const score = s.kind === 'crab' ? crabHabitatScore({ bottom: s.bottom, depthFt: s.depth ? Number(s.depth) : null }) : null
          return (
            <div key={s.id} className="catch-row">
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: KIND[s.kind]?.color, flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 650 }}>{s.name}</div>
                <div className="faint" style={{ fontSize: 12 }}>{[KIND[s.kind]?.label, s.bottom, s.depth && `${s.depth} ft`, score && score.rating].filter(Boolean).join(' · ') || '—'}</div>
              </div>
              <button className="chip" onClick={() => mapRef.current?.setView([s.lat, s.lon], 15)}>View</button>
              <button className="icon-btn" onClick={() => db.spots.delete(s.id)} aria-label="Delete spot"><IcX width={18} height={18} /></button>
            </div>
          )
        })}
      </div>

      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        Charts: OpenStreetMap + OpenSeaMap (cached offline). Bottom type: FWC Reef Map · Depth: NOAA NCEI — guidance only, not for navigation.
      </p>
    </div>
  )
}
