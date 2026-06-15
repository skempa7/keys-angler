import { useEffect, useState } from 'react'
import { useActiveLocation, setActiveLocation } from '../hooks/useActiveLocation.js'
import { KEYS_AREAS } from '../data/areas.js'
import { IcPin, IcX, IcCheck } from './icons.jsx'

// Global "where are you fishing?" picker. Opened from anywhere via the
// `ka-location` event (the dashboard location chip dispatches it). Pick a Keys
// area or drop your GPS spot; every screen recalculates for that location.
export default function LocationSheet() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const loc = useActiveLocation()

  useEffect(() => {
    const onOpen = () => { setErr(null); setOpen(true) }
    window.addEventListener('ka-location', onOpen)
    return () => window.removeEventListener('ka-location', onOpen)
  }, [])

  if (!open) return null

  const isCurrent = (a) => Math.abs(a.lat - loc.lat) < 0.02 && Math.abs(a.lon - loc.lon) < 0.02
  const pick = (a) => { setActiveLocation({ name: a.name, label: a.label, lat: a.lat, lon: a.lon, radiusNm: a.radiusNm }); setOpen(false) }
  const useGps = () => {
    if (!navigator.geolocation) { setErr('Location services aren’t available on this device.'); return }
    setBusy(true); setErr(null)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setActiveLocation({ name: 'My location', label: 'My location (GPS)', lat: Math.round(p.coords.latitude * 1e4) / 1e4, lon: Math.round(p.coords.longitude * 1e4) / 1e4, radiusNm: 30 })
        setBusy(false); setOpen(false)
      },
      () => { setBusy(false); setErr('Couldn’t get your location — pick an area instead.') },
      { timeout: 8000, maximumAge: 300000 },
    )
  }

  return (
    <div className="cmd-wrap" onClick={() => setOpen(false)} role="dialog" aria-label="Choose fishing area">
      <div className="cmd" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input" style={{ paddingBottom: 4 }}>
          <IcPin width={18} height={18} />
          <span style={{ flex: 1, fontWeight: 650 }}>Where are you fishing?</span>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><IcX width={18} height={18} /></button>
        </div>
        <button className="cmd-row" onClick={useGps} disabled={busy}>
          <span className="cmd-kind">GPS</span>
          <span style={{ flex: 1 }}>{busy ? 'Locating…' : 'Use my current location'}</span>
        </button>
        {err && <div className="faint" style={{ fontSize: 12, padding: '4px 8px', color: 'var(--bad)' }}>{err}</div>}
        <div className="cmd-results">
          {KEYS_AREAS.map((a) => (
            <button key={a.id} className="cmd-row" onClick={() => pick(a)}>
              <span style={{ flex: 1 }}>{a.name}{a.home ? ' · home' : ''}</span>
              {isCurrent(a) && <IcCheck width={16} height={16} style={{ color: 'var(--accent)' }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
