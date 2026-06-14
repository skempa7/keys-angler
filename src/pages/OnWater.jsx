import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConditions } from '../hooks/useConditions.js'
import { snapshotFromConditions } from '../services/conditions.js'
import { tideStateAt } from '../engine/tideStage.js'
import { db } from '../db/db.js'
import { FINFISH } from '../data/regs.js'
import { fmtTime, relTime, compass, toneColor } from '../utils/format.js'
import WindArrow from '../components/WindArrow.jsx'
import { IcX, IcFish } from '../components/icons.jsx'
import { haptic } from '../utils/haptic.js'

// On-water mode: a sunlight-readable, glove-friendly cockpit screen for when he's
// actually fishing. Screen stays awake, everything is big, countdowns tick live,
// and one giant tap logs a fish with the full snapshot — all from cache, no signal.
const KEEPERS = ['yellowtail', 'mutton', 'hogfish', 'black-grouper']
const SHORT = { yellowtail: 'Yellowtail', mutton: 'Mutton', hogfish: 'Hogfish', 'black-grouper': 'Black grouper' }
const hm = (min) => { if (min == null) return '—'; const a = Math.max(0, Math.round(min)); return a < 60 ? `${a}m` : `${Math.floor(a / 60)}h ${a % 60}m` }

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
  const [flash, setFlash] = useState(null)
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(id) }, [])

  const quickLog = async () => {
    const snap = snapshotFromConditions(data, null)
    const id = await db.catches.add({
      species: 'Yellowtail Snapper', lengthIn: null, weightLb: null, caughtAt: Date.now(),
      zone: 'reef', bait: '', spot: '', notes: '', scoreAtCatch: data?.nowScore?.score ?? null,
      createdAt: Date.now(), ...snap,
    })
    haptic(22)
    setFlash('Logged ✓ — set the species in the log later')
    setTimeout(() => setFlash(null), 2800)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => db.catches.update(id, { lat: p.coords.latitude, lon: p.coords.longitude }),
        () => {}, { enableHighAccuracy: true, timeout: 8000 },
      )
    }
  }

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

  return (
    <div className="onwater">
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

      <button className="ow-log" onClick={quickLog}><IcFish width={32} height={32} /> LOG CATCH</button>
      {flash && <div className="ow-flash">{flash}</div>}
    </div>
  )
}
