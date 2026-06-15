import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { db } from '../db/db.js'
import { useActiveLocation } from '../hooks/useActiveLocation.js'
import { useConditions } from '../hooks/useConditions.js'
import { getHabitat, crabHabitatScore } from '../services/habitat.js'
import { driftPlan, SPOT_TYPES } from '../engine/drift.js'
import { IcX, IcPin, IcFlame, IcDrift } from '../components/icons.jsx'
import SpotCrossSection from '../components/SpotCrossSection.jsx'

const C_DRIFT = '#36c5f0'
const C_CURRENT = '#13b9c9'
// Infer a drift spot-type from a saved spot's bottom/depth.
const inferType = (s) => {
  const b = (s.bottom || '').toLowerCase()
  const d = s.depth ? Number(s.depth) : null
  if (/wreck|bridge|rubble|rock/.test(b)) return 'wreck'
  if (/reef|pavement|hard\s?bottom|coral/.test(b)) return 'reef'
  if (d != null && d >= 120) return 'open'
  if (d != null && d <= 12) return 'patch'
  return 'reef'
}

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

  const { data } = useConditions()
  const [driftMode, setDriftMode] = useState(false)
  const [driftAt, setDriftAt] = useState(null) // { lat, lon, spotType, name?, spotId? }
  const driftRef = useRef(false)
  const driftLayerRef = useRef()
  driftRef.current = driftMode
  const driftPlanNow = useMemo(() => {
    if (!driftAt || !data?.nowConditions) return null
    const c = data.nowConditions
    return driftPlan({ windKn: c.windKn, windDir: c.windDir, currentKn: c.currentKn, currentDir: c.currentDir, tide: data.tideNow, spotType: driftAt.spotType })
  }, [driftAt, data])

  useEffect(() => {
    const map = L.map(elRef.current).setView([loc.lat, loc.lon], 12)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map)
    L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.on('click', (e) => {
      if (driftRef.current) setDriftAt({ lat: e.latlng.lat, lon: e.latlng.lng, spotType: 'reef' })
      else if (dropRef.current) setDraft({ lat: e.latlng.lat, lon: e.latlng.lng })
    })
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

  // Live drift vector overlay: an arrow from the anchored point along the estimated drift,
  // plus a thinner dashed current-set arrow. Cleared & redrawn whenever the anchor/plan changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (driftLayerRef.current) { map.removeLayer(driftLayerRef.current); driftLayerRef.current = null }
    if (!driftAt || !driftPlanNow) return
    const plan = driftPlanNow
    const lg = L.layerGroup().addTo(map)
    driftLayerRef.current = lg
    const cosLat = Math.cos((driftAt.lat * Math.PI) / 180) || 1
    const dest = (bearing, nm) => {
      const r = (bearing * Math.PI) / 180
      return [driftAt.lat + (nm / 60) * Math.cos(r), driftAt.lon + ((nm / 60) * Math.sin(r)) / cosLat]
    }
    if (plan.currentKn != null && plan.currentKn >= 0.05 && plan.currentToward != null) {
      L.polyline([[driftAt.lat, driftAt.lon], dest(plan.currentToward, Math.min(0.9, 0.1 + plan.currentKn * 0.3))], { color: C_CURRENT, weight: 2.5, dashArray: '4 5', opacity: 0.8 }).addTo(lg)
    }
    if (plan.driftKn != null && plan.driftToward != null) {
      const end = dest(plan.driftToward, Math.min(1.2, 0.15 + plan.driftKn * 0.35))
      L.polyline([[driftAt.lat, driftAt.lon], end], { color: C_DRIFT, weight: 4, opacity: 0.95 }).addTo(lg)
      const head = L.divIcon({ className: '', html: `<div style="transform:rotate(${plan.driftToward}deg);width:18px;height:18px"><svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9,0 14,12 9,9 4,12" fill="${C_DRIFT}"/></svg></div>`, iconSize: [18, 18], iconAnchor: [9, 9] })
      L.marker(end, { icon: head, interactive: false }).addTo(lg)
    }
    L.circleMarker([driftAt.lat, driftAt.lon], { radius: 4, color: '#fff', fillColor: C_DRIFT, fillOpacity: 1, weight: 1 }).addTo(lg)
  }, [driftAt, driftPlanNow])

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
        <button className={`chip ${dropMode ? 'active' : ''}`} onClick={() => { setDropMode((d) => !d); setDraft(null); setDriftMode(false) }}>
          {dropMode ? 'Tap the map to drop…' : '＋ Drop a spot'}
        </button>
        <button className={`chip ${driftMode ? 'active' : ''}`} onClick={() => { setDriftMode((d) => { const nd = !d; if (nd) { setDropMode(false); setDraft(null) } else setDriftAt(null); return nd }) }}>
          <IcDrift width={15} height={15} /> {driftMode ? 'Tap a spot to drift…' : 'Drift here'}
        </button>
        <button className="chip" onClick={locateMe}><IcPin width={15} height={15} /> My location</button>
        <button className={`chip ${heatMode ? 'active' : ''}`} onClick={() => setHeatMode((h) => !h)}><IcFlame width={15} height={15} /> {heatMode ? 'Heatmap on' : 'Catch heatmap'}</button>
      </div>

      <div ref={elRef} className="map-el" />

      {driftAt && (
        <div className="card stack-sm">
          <div className="row between">
            <div className="eyebrow">Drift at this spot{driftAt.name ? ` · ${driftAt.name}` : ''}</div>
            <button className="icon-btn" onClick={() => setDriftAt(null)} aria-label="Clear drift"><IcX width={16} height={16} /></button>
          </div>
          {!driftPlanNow ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>Open this once with a signal and the drift estimate works offline after.</p>
          ) : (
            <>
              <div className={`keep-result tone-${driftPlanNow.tone}`} style={{ padding: 12 }}>
                <div className="keep-verdict" style={{ fontSize: 24 }}>{driftPlanNow.verdict}</div>
                <div className="keep-rule">{driftPlanNow.why}{driftPlanNow.driftKn != null ? ` · ${driftPlanNow.driftKn} kn to ${driftPlanNow.driftCompass}` : ''}</div>
              </div>
              <div className="seg-row">
                {SPOT_TYPES.map((st) => (
                  <button key={st.id} className={`seg ${driftAt.spotType === st.id ? 'on' : ''}`} onClick={() => setDriftAt((a) => ({ ...a, spotType: st.id }))}>
                    <span className="seg-label">{st.label}</span><span className="seg-hint">{st.hint}</span>
                  </button>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 13.5 }}>{driftPlanNow.tip}</p>
              {driftPlanNow.slackNote && <p className="faint" style={{ margin: 0, fontSize: 12 }}>{driftPlanNow.slackNote}</p>}
              <Link className="btn ghost block" to="/drift">Full drift plan →</Link>
            </>
          )}
        </div>
      )}

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
        {mapped.length === 0 && (
          <div className="placeholder">
            <div className="big"><IcPin width={30} height={30} /></div>
            <p>No pinned spots yet. Tap “Drop a spot”, then tap the map (or use My location).</p>
          </div>
        )}
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
              <button className="chip" onClick={() => { setDriftMode(false); setDriftAt({ lat: s.lat, lon: s.lon, spotType: inferType(s), name: s.name, spotId: s.id }); mapRef.current?.setView([s.lat, s.lon], 14) }}>Drift</button>
              <button className="icon-btn" onClick={() => { if (driftAt?.spotId === s.id) setDriftAt(null); db.spots.delete(s.id) }} aria-label="Delete spot"><IcX width={18} height={18} /></button>
            </div>
          )
        })}
      </div>

      <SpotCrossSection spots={spots} />

      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        Charts: OpenStreetMap + OpenSeaMap (cached offline). Bottom type: FWC Reef Map · Depth: NOAA NCEI — guidance only, not for navigation.
      </p>
    </div>
  )
}
