import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { useConditions } from '../hooks/useConditions.js'
import { distanceNm } from '../data/stations.js'
import { compass } from '../utils/format.js'
import { IcPin } from '../components/icons.jsx'

const toRad = (d) => (d * Math.PI) / 180
const toDeg = (r) => (r * 180) / Math.PI
function bearing(lat1, lon1, lat2, lon2) {
  const a = toRad(lat1), b = toRad(lat2), dl = toRad(lon2 - lon1)
  const y = Math.sin(dl) * Math.cos(b)
  const x = Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(dl)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}
const pt = (cx, cy, r, deg) => [cx + r * Math.sin(toRad(deg)), cy - r * Math.cos(toRad(deg))]
const RELATIVE = ['dead ahead', 'off your starboard bow', 'on your starboard beam', 'off your starboard quarter', 'dead astern', 'off your port quarter', 'on your port beam', 'off your port bow']
const relName = (deg) => RELATIVE[Math.round(deg / 45) % 8]

export default function Compass() {
  const spots = useLiveQuery(() => db.spots.toArray(), [], [])
  const { data } = useConditions({ days: 1 })
  const [heading, setHeading] = useState(null)
  const [pos, setPos] = useState(null)
  const [status, setStatus] = useState('idle')
  const [spotId, setSpotId] = useState(null)
  const watchRef = useRef(null)

  const spotList = (spots || []).filter((s) => s.lat != null && s.lon != null)
  const spot = spotList.find((s) => s.id === spotId) || spotList[0]

  const enable = async () => {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const p = await DeviceOrientationEvent.requestPermission()
        if (p !== 'granted') { setStatus('denied'); return }
      }
      const onOrient = (e) => {
        const h = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.alpha != null ? (360 - e.alpha) % 360 : null)
        if (h != null) setHeading(h)
      }
      window.addEventListener('deviceorientation', onOrient, true)
      if (navigator.geolocation) watchRef.current = navigator.geolocation.watchPosition((p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }), () => {}, { enableHighAccuracy: true })
      setStatus('on')
    } catch { setStatus('unsupported') }
  }
  useEffect(() => () => { if (watchRef.current != null) navigator.geolocation?.clearWatch(watchRef.current) }, [])

  const h = heading ?? 0
  const brg = pos && spot ? bearing(pos.lat, pos.lon, spot.lat, spot.lon) : null
  const dist = pos && spot ? distanceNm(pos.lat, pos.lon, spot.lat, spot.lon) : null
  const windDir = data?.nowConditions?.windKn != null ? data.nowConditions.windDir : null
  const windRel = windDir != null && heading != null ? (windDir - h + 360) % 360 : null
  const [sx, sy] = brg != null ? pt(110, 110, 76, brg - h) : [110, 34]

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Compass</div>
        <h1 className="h1">Heading &amp; bearing</h1>
        <p className="muted">Live heading, the line to your spot, and where the wind sits relative to your bow.</p>
      </header>

      <div className="card stack-sm" style={{ alignItems: 'center' }}>
        <svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="compass">
          <circle cx="110" cy="110" r="92" fill="var(--surface-2)" stroke="var(--border-soft)" strokeWidth="2" />
          <g transform={`rotate(${-h} 110 110)`}>
            {Array.from({ length: 24 }).map((_, i) => {
              const [x1, y1] = pt(110, 110, 92, i * 15)
              const [x2, y2] = pt(110, 110, i % 6 === 0 ? 80 : 86, i * 15)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-faint)" strokeWidth={i % 6 === 0 ? 2.2 : 1} />
            })}
            {['N', 'E', 'S', 'W'].map((d, i) => { const [x, y] = pt(110, 110, 66, i * 90); return <text key={d} x={x} y={y + 5} textAnchor="middle" fill={d === 'N' ? 'var(--bad)' : 'var(--text-dim)'} fontSize="16" fontWeight="700">{d}</text> })}
          </g>
          {/* lubber line (where the bow points) */}
          <path d="M110 14 l8 14 h-16 z" fill="var(--accent)" />
          {/* needle to spot */}
          {brg != null && <line x1="110" y1="110" x2={sx} y2={sy} stroke="var(--gold)" strokeWidth="3.5" strokeLinecap="round" />}
          <circle cx="110" cy="110" r="5" fill="var(--text)" />
          <text x="110" y="120" textAnchor="middle" fill="var(--text)" fontSize="30" fontWeight="800" fontFamily="var(--font-display)">{heading != null ? `${Math.round(h)}°` : '—'}</text>
          <text x="110" y="142" textAnchor="middle" fill="var(--text-dim)" fontSize="13">{heading != null ? compass(h) : 'enable below'}</text>
        </svg>
      </div>

      {status !== 'on' && (
        <button className="btn primary block" onClick={enable}>Enable compass</button>
      )}
      {status === 'denied' && <p className="faint" style={{ fontSize: 13, textAlign: 'center' }}>Compass permission was denied — enable Motion &amp; Orientation access in your browser settings.</p>}
      {status === 'on' && heading == null && <p className="faint" style={{ fontSize: 13, textAlign: 'center' }}>Waiting for the compass… move the phone in a figure-8 to calibrate.</p>}

      <div className="card stack-sm">
        <div className="eyebrow">Point me to</div>
        {spotList.length === 0 ? (
          <p className="faint" style={{ fontSize: 13 }}>Save a spot with GPS coordinates (Map &amp; Spots) and it'll show the bearing &amp; distance here.</p>
        ) : (
          <>
            <div className="row wrap" style={{ gap: 8 }}>
              {spotList.map((s) => <button key={s.id} className={`chip ${(spot && s.id === spot.id) ? 'active' : ''}`} onClick={() => setSpotId(s.id)}><IcPin width={13} height={13} /> {s.name}</button>)}
            </div>
            {brg != null ? (
              <div className="h2">{spot.name}: head <b style={{ color: 'var(--gold)' }}>{Math.round(brg)}° {compass(brg)}</b> · {dist != null ? `${dist.toFixed(dist < 10 ? 1 : 0)} nm` : ''}</div>
            ) : <p className="faint" style={{ fontSize: 13 }}>Enable the compass (and allow location) to see the bearing.</p>}
          </>
        )}
      </div>

      {windRel != null && (
        <div className="card quiet stack-sm">
          <div className="eyebrow">Wind</div>
          <div className="h2">{Math.round(data.nowConditions.windKn)} kn — {relName(windRel)}</div>
          <div className="faint" style={{ fontSize: 12 }}>Wind from {compass(windDir)} relative to your {Math.round(h)}° heading.</div>
        </div>
      )}
    </div>
  )
}
