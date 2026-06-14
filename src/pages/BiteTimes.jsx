import { useState } from 'react'
import { useConditions } from '../hooks/useConditions.js'
import { fmtTime, fmtRange, fmtDayShort, strengthColor } from '../utils/format.js'

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)
// fraction of the day (0–100%) for a Date, relative to local midnight.
const pct = (d, dayStart) => Math.max(0, Math.min(100, ((d - dayStart) / 86_400_000) * 100))

export default function BiteTimes() {
  const { data, loading, error, refresh } = useConditions({ days: 5 })
  const [idx, setIdx] = useState(0)

  if (loading) return <Loading />
  if (error && !data) return <Err onRetry={refresh} />

  const day = data.outlook[idx]
  const dayStart = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate())
  const { sun, moon } = day.solunar
  const windows = day.windows
  const isToday = idx === 0
  const now = new Date()

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Bite times</div>
        <h1 className="h1">Feeding windows</h1>
        <p className="muted">Solunar majors &amp; minors overlaid on the tide — ranked, with the reasoning.</p>
      </header>

      <div className="row wrap" style={{ gap: 8 }}>
        {data.outlook.map((d, i) => (
          <button key={i} className={`chip ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)}>
            {i === 0 ? 'Today' : fmtDayShort(d.date)}
          </button>
        ))}
      </div>

      <div className="card stack-sm">
        <div className="row between">
          <div>
            <div className="eyebrow">Sun</div>
            <div className="tnum">↑ {fmtTime(sun.rise)} · ↓ {fmtTime(sun.set)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Moon</div>
            <div>{moon.phaseName} · {Math.round(moon.illum * 100)}%</div>
          </div>
        </div>

        <div className="timeline" aria-hidden="true">
          {sun.rise && sun.set && (
            <div className="tl-daylight" style={{ left: `${pct(sun.rise, dayStart)}%`, width: `${pct(sun.set, dayStart) - pct(sun.rise, dayStart)}%` }} />
          )}
          {windows.map((w, i) => (
            <div
              key={i}
              className="tl-window"
              style={{
                left: `${pct(w.start, dayStart)}%`,
                width: `${Math.max(2, pct(w.end, dayStart) - pct(w.start, dayStart))}%`,
                background: strengthColor(w.strength),
              }}
            />
          ))}
          {day.tideEvents.map((e, i) => (
            <div key={`t${i}`} className={`tl-tide ${e.type === 'H' ? 'hi' : 'lo'}`} style={{ left: `${pct(e.time, dayStart)}%` }}>
              <span>{e.type}</span>
            </div>
          ))}
          {isToday && <div className="tl-now" style={{ left: `${pct(now, dayStart)}%` }} />}
        </div>
        <div className="tl-axis"><span>12a</span><span>6a</span><span>noon</span><span>6p</span><span>12a</span></div>
      </div>

      <div className="stack-sm">
        {windows.map((w, i) => (
          <div key={i} className="card window-row">
            <div className="row between">
              <div className="row" style={{ gap: 12 }}>
                <span className="rank">#{i + 1}</span>
                <div>
                  <div className="h2 tnum">{fmtRange(w.start, w.end)}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{w.tide ? `${capitalize(w.tide.direction)} tide` : 'Solunar only'}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="window-score" style={{ color: strengthColor(w.strength) }}>{w.score}</div>
                <div className="tag" style={{ color: strengthColor(w.strength) }}>{w.strength}</div>
              </div>
            </div>
            <ul className="triggers" style={{ marginTop: 10 }}>
              {w.triggers.map((t, j) => (
                <li key={j}><span className="mono">+{t.points}</span> {t.label}</li>
              ))}
            </ul>
          </div>
        ))}
        {windows.length === 0 && (
          <div className="card placeholder">
            <p className="muted">No windows for this day yet — connect on WiFi to cache tides, or solunar-only windows will appear once moon data computes.</p>
          </div>
        )}
      </div>

      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        Majors center on the moon overhead/underfoot (~2 h); minors on moonrise/set (~1 h). Strongest when they stack with a moving tide and low light.
      </p>
    </div>
  )
}

function Loading() {
  return (
    <div className="stack">
      <div className="page-head"><div className="eyebrow">Bite times</div><h1 className="h1">Feeding windows</h1></div>
      <div className="card"><div className="skeleton" style={{ height: 64 }} /></div>
      {[0, 1, 2].map((i) => <div key={i} className="card"><div className="skeleton" style={{ height: 80 }} /></div>)}
    </div>
  )
}

function Err({ onRetry }) {
  return (
    <div className="stack">
      <div className="card placeholder">
        <div className="big">🌙</div>
        <p className="muted">Couldn't load — connect to WiFi once to cache tides for offline use.</p>
        <button className="btn primary" onClick={onRetry}>Try again</button>
      </div>
    </div>
  )
}
