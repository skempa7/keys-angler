import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { useConditions } from '../hooks/useConditions.js'
import { snapshotFromConditions } from '../services/conditions.js'
import { tideStateAt } from '../engine/tideStage.js'
import { db } from '../db/db.js'
import { FINFISH } from '../data/regs.js'
import { distanceNm } from '../data/stations.js'
import { fmtTime, relTime, compass, toneColor } from '../utils/format.js'
import WindArrow from '../components/WindArrow.jsx'
import { IcX, IcFish } from '../components/icons.jsx'
import { haptic } from '../utils/haptic.js'

// On-water mode: a sunlight-readable, glove-friendly cockpit screen for when he's
// actually fishing. Screen stays awake, everything is big, countdowns tick live,
// and one giant tap logs a fish with the full snapshot — all from cache, no signal.
const KEEPERS = ['yellowtail', 'mutton', 'hogfish', 'black-grouper']
const SHORT = { yellowtail: 'Yellowtail', mutton: 'Mutton', hogfish: 'Hogfish', 'black-grouper': 'Black grouper' }
const ROLL = ['Yellowtail Snapper', 'Mutton Snapper', 'Mahi-Mahi', 'Tarpon', 'Bonefish', 'Permit', 'Grouper', 'Hogfish', 'Snook', 'Kingfish']
const hm = (min) => { if (min == null) return '—'; const a = Math.max(0, Math.round(min)); return a < 60 ? `${a}m` : `${Math.floor(a / 60)}h ${a % 60}m` }
const toRad = (d) => (d * Math.PI) / 180
const bearing = (a, b, c, d) => { const y = Math.sin(toRad(d - b)) * Math.cos(toRad(c)); const x = Math.cos(toRad(a)) * Math.sin(toRad(c)) - Math.sin(toRad(a)) * Math.cos(toRad(c)) * Math.cos(toRad(d - b)); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360 }

function useWakeLock() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    let lock = null, cancelled = false
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator) {
          lock = await navigator.wakeLock.request('screen')
          if (!cancelled) setOn(true)
          lock.addEventListener?.('release', () => setOn(false))
        }
      } catch { setOn(false) }
    }
    acquire()
    const onVis = () => { if (document.visibilityState === 'visible') acquire() }
    document.addEventListener('visibilitychange', onVis)
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis); lock?.release?.().catch(() => {}) }
  }, [])
  return on
}

export default function OnWater() {
  const navigate = useNavigate()
  const { data, loading } = useConditions({ days: 1 })
  const wake = useWakeLock()
  const [now, setNow] = useState(() => Date.now())
  const [justLogged, setJustLogged] = useState(null)
  const recent = useLiveQuery(() => db.catches.orderBy('caughtAt').reverse().limit(10).toArray(), [], [])
  const [track, setTrack] = useState(null)
  const watchRef = useRef(null)
  const swipeRef = useRef(null)
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(id) }, [])
  useEffect(() => () => { if (watchRef.current != null) navigator.geolocation?.clearWatch(watchRef.current) }, [])

  const toggleTrack = () => {
    if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; setTrack((t) => (t ? { ...t, recording: false } : null)); haptic(); return }
    if (!navigator.geolocation) return
    setTrack({ fixes: [], speedKn: null, dirDeg: null, distNm: 0, recording: true })
    haptic(18)
    watchRef.current = navigator.geolocation.watchPosition((p) => {
      setTrack((t) => {
        const fix = { lat: p.coords.latitude, lon: p.coords.longitude, t: p.timestamp || Date.now() }
        const fixes = [...(t?.fixes || []), fix]
        let { speedKn = null, dirDeg = null, distNm = 0 } = t || {}
        if (fixes.length >= 2) {
          const a = fixes[fixes.length - 2]
          const d = distanceNm(a.lat, a.lon, fix.lat, fix.lon)
          const hrs = (fix.t - a.t) / 3600000
          if (hrs > 0 && d > 0.0005) { speedKn = d / hrs; dirDeg = bearing(a.lat, a.lon, fix.lat, fix.lon); distNm += d }
        }
        return { fixes, speedKn, dirDeg, distNm, recording: true }
      })
    }, () => {}, { enableHighAccuracy: true, maximumAge: 2000 })
  }

  const quickLog = async () => {
    const snap = snapshotFromConditions(data, null)
    const id = await db.catches.add({
      species: 'Yellowtail Snapper', lengthIn: null, weightLb: null, caughtAt: Date.now(),
      zone: 'reef', bait: '', spot: '', notes: '', scoreAtCatch: data?.nowScore?.score ?? null,
      createdAt: Date.now(), ...snap,
    })
    haptic.logged()
    setJustLogged(id)
    setTimeout(() => setJustLogged((cur) => (cur === id ? null : cur)), 8000)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => db.catches.update(id, { lat: p.coords.latitude, lon: p.coords.longitude }),
        () => {}, { enableHighAccuracy: true, timeout: 8000 },
      )
    }
  }
  const setSpecies = (s) => { if (justLogged) db.catches.update(justLogged, { species: s }); haptic(); setJustLogged(null) }
  const undoLog = () => { if (justLogged) db.catches.delete(justLogged); haptic(); setJustLogged(null) }
  // Swipe in from the right edge to exit (thumb-reachable; the top X is a backup).
  const onTouchStart = (e) => { const t = e.touches[0]; swipeRef.current = t && t.clientX > window.innerWidth - 36 ? t.clientX : null }
  const onTouchEnd = (e) => { if (swipeRef.current == null) return; const x = e.changedTouches[0]?.clientX ?? swipeRef.current; if (swipeRef.current - x > 70) navigate('/'); swipeRef.current = null }

  if (loading || !data) {
    return (
      <div className="onwater">
        <button className="ow-x" onClick={() => navigate('/')} aria-label="Exit"><IcX width={26} height={26} /></button>
        <div className="ow-loading">Loading your water…</div>
      </div>
    )
  }

  const nowDate = new Date(now)
  const tide = data.today?.tideEvents?.length ? tideStateAt(data.today.tideEvents, nowDate) : data.tideNow
  const windows = data.today?.windows || []
  const inWindow = windows.find((w) => w.start <= nowDate && nowDate <= w.end)
  const upcoming = windows.filter((w) => w.end >= nowDate).sort((a, b) => a.start - b.start)[0]
  const c = data.nowConditions || {}
  const tone = data.nowScore?.verdict?.tone
  const fetchedAts = Object.values(data.sources || {}).map((s) => s.fetchedAt).filter(Boolean)
  const lastUpdated = fetchedAts.length ? Math.min(...fetchedAts) : null
  const keepers = KEEPERS.map((id) => FINFISH.find((f) => f.id === id)).filter((f) => f && f.minSizeIn)
  const sun = data.today?.solunar?.sun
  const night = sun?.rise && sun?.set ? nowDate < sun.rise || nowDate > sun.set : false
  const rollSpecies = [...new Set([...(recent || []).map((c) => c.species), ...ROLL])].filter(Boolean).slice(0, 8)

  return (
    <div className={`onwater ${night ? 'night' : ''}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="ow-top">
        <button className="ow-x" onClick={() => navigate('/')} aria-label="Exit on-water mode"><IcX width={26} height={26} /></button>
        <div className="ow-asof">{wake ? 'screen on · ' : ''}data {relTime(lastUpdated)}</div>
      </div>

      <div className="ow-verdict" style={{ color: toneColor(tone) }}>{data.nowScore?.verdict?.label || '—'}</div>

      <div className="ow-grid">
        <div className="ow-tile">
          <div className="ow-k">Tide</div>
          {tide ? (
            <>
              <div className="ow-v">{tide.direction === 'incoming' ? 'INCOMING' : 'OUTGOING'}</div>
              <div className="ow-sub">turns in {hm(tide.minutesToChange)} → {tide.next?.type === 'H' ? 'High' : 'Low'} {tide.next?.time ? fmtTime(tide.next.time) : ''}</div>
            </>
          ) : <div className="ow-v ow-dim">offshore</div>}
        </div>

        <div className="ow-tile">
          <div className="ow-k">Bite window</div>
          {inWindow ? (
            <>
              <div className="ow-v ow-hot">ON NOW</div>
              <div className="ow-sub">{hm((inWindow.end - nowDate) / 60000)} left{inWindow.strength ? ` · ${inWindow.strength}` : ''}</div>
            </>
          ) : upcoming ? (
            <>
              <div className="ow-v">{fmtTime(upcoming.start)}</div>
              <div className="ow-sub">in {hm((upcoming.start - nowDate) / 60000)}{upcoming.strength ? ` · ${upcoming.strength}` : ''}</div>
            </>
          ) : <div className="ow-v ow-dim">—</div>}
        </div>

        <div className="ow-tile">
          <div className="ow-k">Wind</div>
          <div className="ow-v ow-rowv"><WindArrow dir={c.windDir} size={30} /> {c.windKn != null ? Math.round(c.windKn) : '—'}<span className="ow-unit">kn</span></div>
          <div className="ow-sub">{c.windDir != null ? compass(c.windDir) : ''}{c.gustKn != null ? ` · gust ${Math.round(c.gustKn)}` : ''}</div>
        </div>

        <div className="ow-tile">
          <div className="ow-k">Seas</div>
          <div className="ow-v">{c.waveFt != null ? c.waveFt.toFixed(1) : '—'}<span className="ow-unit">ft</span></div>
          <div className="ow-sub">{c.sstF != null ? `${Math.round(c.sstF)}°F water` : ''}</div>
        </div>
      </div>

      {keepers.length > 0 && (
        <div className="ow-keepers">
          <span className="ow-k">Keeper min</span>
          {keepers.map((f) => <span key={f.id} className="ow-keep">{SHORT[f.id] || f.name} <b>{f.minSizeIn}"</b></span>)}
        </div>
      )}

      <button className="ow-drift" onClick={toggleTrack}>
        {track?.recording
          ? `◉ Drift ${track.speedKn != null ? track.speedKn.toFixed(1) : '…'} kn ${track.dirDeg != null ? compass(track.dirDeg) : ''} · ${track.distNm.toFixed(2)} nm — stop`
          : 'Record drift'}
      </button>

      <button className="ow-log" onClick={quickLog}><IcFish width={32} height={32} /> LOG CATCH</button>

      {justLogged && (
        <div className="ow-roll">
          <div className="ow-roll-top"><b style={{ color: 'var(--good)' }}>Logged ✓ — what was it?</b><button className="chip" onClick={undoLog}>Undo</button></div>
          <div className="ow-roll-chips">
            {rollSpecies.map((s) => <button key={s} className="ow-roll-chip" onClick={() => setSpecies(s)}>{s}</button>)}
          </div>
        </div>
      )}
    </div>
  )
}
