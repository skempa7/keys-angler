import { useEffect, useMemo, useState } from 'react'
import { useConditions } from '../hooks/useConditions.js'
import { fmtRange, fmtTime, compass, strengthColor } from '../utils/format.js'
import { haptic } from '../utils/haptic.js'
import { IcTrophy, IcShare, IcStorm } from '../components/icons.jsx'

// Winter-circuit prep: rank today's bite windows inside your tournament hours,
// read the classic post-frontal kite setup, and tap a timed release tally.
const todayKey = () => { const d = new Date(); return `tourney:${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* no storage */ } }

function kiteRead(windDir, windKn) {
  if (windDir == null || windKn == null) return { level: 'unknown', text: 'No wind data — pull a forecast on WiFi.' }
  const oct = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(windDir / 45) % 8]
  const northerly = ['N', 'NE', 'NW'].includes(oct)
  if (northerly && windKn >= 8 && windKn <= 22) return { level: 'good', text: `${oct} ${Math.round(windKn)} kn against the north-running Stream — classic kite sailfish setup. Get the kites up.` }
  if (northerly && windKn > 22) return { level: 'warn', text: `${oct} ${Math.round(windKn)} kn — kite weather but rough; small-craft caution and a wild ride to the edge.` }
  if (windKn < 6) return { level: 'warn', text: `Light & ${oct} — too slack to fly kites well; live-bait flat lines and look for tailers.` }
  return { level: 'warn', text: `${oct} ${Math.round(windKn)} kn — not the textbook north push; fish flat lines / dredge and watch for a front.` }
}

export default function Tournament() {
  const { data } = useConditions({ days: 1 })
  const [hours, setHours] = useState(() => load('tourney:hours', { start: '07:30', end: '15:30' }))
  const [releases, setReleases] = useState(() => load(todayKey(), []))
  useEffect(() => save('tourney:hours', hours), [hours])
  useEffect(() => save(todayKey(), releases), [releases])

  const windows = useMemo(() => {
    const all = data?.today?.windows || []
    const day = data?.when || new Date()
    const mk = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime() }
    const s = mk(hours.start), e = mk(hours.end)
    return all.filter((w) => w.end.getTime() >= s && w.start.getTime() <= e).sort((a, b) => b.score - a.score)
  }, [data, hours])

  const c = data?.nowConditions || {}
  const kite = kiteRead(c.windDir, c.windKn)
  const addRelease = () => { setReleases((r) => [...r, Date.now()]); haptic(20) }
  const undo = () => setReleases((r) => r.slice(0, -1))

  const share = async () => {
    const txt = `🎣 Tournament day — ${releases.length} release${releases.length === 1 ? '' : 's'}\n${releases.map((t, i) => `#${i + 1} ${fmtTime(new Date(t))}`).join('\n')}`
    try { if (navigator.share) await navigator.share({ title: 'Keys Angler — release tally', text: txt }); else await navigator.clipboard.writeText(txt) } catch { /* cancelled */ }
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Tournament</div>
        <h1 className="h1">Sailfish prep & release tally</h1>
        <p className="muted">Your windows inside the lines, the kite read, and a one-tap timed release counter.</p>
      </header>

      <div className={`alert-banner ${kite.level === 'good' ? 'info' : 'warn'}`}>
        <strong><IcStorm width={15} height={15} style={{ verticalAlign: '-2px' }} /> Kite read</strong> — {kite.text}
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Tournament hours</div>
        <div className="row" style={{ gap: 8 }}>
          <label className="field" style={{ flex: 1 }}><span className="field-label">Lines in</span><input className="input" type="time" value={hours.start} onChange={(e) => setHours((h) => ({ ...h, start: e.target.value }))} /></label>
          <label className="field" style={{ flex: 1 }}><span className="field-label">Lines out</span><input className="input" type="time" value={hours.end} onChange={(e) => setHours((h) => ({ ...h, end: e.target.value }))} /></label>
        </div>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Best windows in your hours</div>
        {windows.length === 0 && <p className="faint" style={{ fontSize: 13 }}>No solunar/tide windows fall in those hours today — fish the whole block and watch the kites.</p>}
        {windows.map((w, i) => (
          <div key={i} className="row between" style={{ padding: '6px 0', borderTop: i ? '1px solid var(--border-soft)' : 'none' }}>
            <div className="h2 tnum" style={{ fontSize: 17 }}>{fmtRange(w.start, w.end)}</div>
            <span className="tag" style={{ color: strengthColor(w.strength) }}>{w.strength} · {w.score}</span>
          </div>
        ))}
      </div>

      <div className="card raised stack-sm" style={{ textAlign: 'center' }}>
        <div className="eyebrow">Releases today</div>
        <div className="display" style={{ fontSize: 56, color: 'var(--gold)' }}>{releases.length}</div>
        <button className="btn primary block lg" onClick={addRelease}><IcTrophy width={20} height={20} /> Tap a release</button>
        {releases.length > 0 && (
          <>
            <div className="row wrap" style={{ gap: 6, justifyContent: 'center' }}>
              {releases.map((t, i) => <span key={i} className="chip">#{i + 1} {fmtTime(new Date(t))}</span>)}
            </div>
            <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
              <button className="chip" onClick={undo}>Undo last</button>
              <button className="chip" onClick={share}><IcShare width={14} height={14} /> Share tally</button>
              <button className="chip" onClick={() => { if (window.confirm('Clear today\'s release tally?')) setReleases([]) }} style={{ color: 'var(--bad)' }}>Reset</button>
            </div>
          </>
        )}
        <p className="faint" style={{ fontSize: 12 }}>Each tap stamps the time. Tally is private &amp; on-device, reset daily.</p>
      </div>
    </div>
  )
}
