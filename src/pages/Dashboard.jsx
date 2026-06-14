import { Link } from 'react-router-dom'
import { useConditions } from '../hooks/useConditions.js'
import ScoreRing from '../components/ScoreRing.jsx'
import FactorList from '../components/FactorList.jsx'
import { HOME_PORT } from '../config.js'
import { fmtTime, fmtRange, fmtDayShort, relTime, compass, toneColor, weatherLabel, dayLabel } from '../utils/format.js'

export default function Dashboard() {
  const { data, loading, error, refreshing, online, refresh } = useConditions({ days: 5 })

  if (loading) return <Skeleton />
  if (error && !data) return <ErrorState error={error} onRetry={refresh} />

  const { nowScore, nowConditions: c, tideNow, alerts, today, outlook, nextWindow, sources } = data
  const tone = nowScore.verdict.tone
  const best = today.windows[0]
  const fetchedAts = Object.values(sources).map((s) => s.fetchedAt).filter(Boolean)
  const lastUpdated = fetchedAts.length ? Math.min(...fetchedAts) : null
  const stale = !online || Object.values(sources).some((s) => s.stale)
  const nextTide = today.tideEvents.find((e) => e.time > data.when)
  const m = today.solunar.moon

  return (
    <div className="stack">
      <header className="page-head">
        <div className="row between">
          <div className="eyebrow">Should I go fishing?</div>
          <button className="chip" onClick={refresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
        <h1 className="display" style={{ color: toneColor(tone) }}>{nowScore.verdict.label}</h1>
        <p className="muted">
          {HOME_PORT.label} · {stale ? 'cached' : 'updated'} {relTime(lastUpdated)}
          {stale && <span className="v-poor"> · offline/stale</span>}
        </p>
      </header>

      {alerts.length > 0 && (
        <div className="stack-sm">
          {alerts.map((a, i) => (
            <div key={i} className={`alert-banner ${/(hurricane|gale|storm|hazardous)/i.test(a.event) ? 'danger' : /small craft/i.test(a.event) ? 'warn' : 'info'}`}>
              <strong>⚠ {a.event}</strong>
              <span className="muted"> — {a.area}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card hero">
        <ScoreRing score={nowScore.score} tone={tone} />
        <div className="hero-body">
          <div className="eyebrow">Conditions right now</div>
          <div className="h2">{c.windKn != null ? `${Math.round(c.windKn)} kn ${compass(c.windDir)} · ` : ''}{c.waveFt != null ? `${c.waveFt.toFixed(1)} ft seas` : ''}</div>
          {best && (
            <p className="muted" style={{ marginTop: 4 }}>
              Best window today <strong style={{ color: 'var(--text)' }}>{fmtRange(best.start, best.end)}</strong> · {best.strength}
            </p>
          )}
          {nextWindow && (
            <Link to="/bite" className="chip sel" style={{ marginTop: 10 }}>
              Next bite window {fmtTime(nextWindow.start)} →
            </Link>
          )}
        </div>
      </div>

      <div className="card stack-sm">
        <div className="row between">
          <div className="h2">What's driving the score</div>
          <span className="faint" style={{ fontSize: 12 }}>tap a factor</span>
        </div>
        <FactorList factors={nowScore.factors} />
      </div>

      {nextWindow && (
        <div className="card stack-sm">
          <div className="row between">
            <div className="eyebrow">Next bite window</div>
            <span className={`tag bg-good`} style={{ color: 'var(--good)' }}>{nextWindow.strength}</span>
          </div>
          <div className="h1">{fmtRange(nextWindow.start, nextWindow.end)}</div>
          <ul className="triggers">
            {nextWindow.triggers.map((t, i) => (
              <li key={i}><span className="mono faint">+{t.points}</span> {t.label}</li>
            ))}
          </ul>
          <Link to="/bite" className="btn ghost block">See full day timeline →</Link>
        </div>
      )}

      <div className="grid cols-2">
        <Stat label="Tide now" main={tideNow ? capitalize(tideNow.direction) : '—'}
          sub={tideNow ? tideNow.label.split('·')[1]?.trim() : 'no station data'}
          foot={nextTide ? `Next ${nextTide.type === 'H' ? 'high' : 'low'} ${fmtTime(nextTide.time)} (${nextTide.level.toFixed(1)} ft)` : ''} />
        <Stat label="Wind & sea" main={c.windKn != null ? `${Math.round(c.windKn)} kn` : '—'}
          sub={c.windDir != null ? `${compass(c.windDir)}${c.gustKn ? ` · gusts ${Math.round(c.gustKn)}` : ''}` : ''}
          foot={c.waveFt != null ? `${c.waveFt.toFixed(1)} ft @ ${Math.round(c.wavePeriod || 0)} s` : ''} />
        <Stat label="Water temp" main={c.sstF != null ? `${Math.round(c.sstF)}°F` : '—'}
          sub={c.weatherCode != null ? weatherLabel(c.weatherCode) : ''}
          foot={c.airF != null ? `Air ${Math.round(c.airF)}°F` : ''} />
        <Stat label="Sun & moon" main={`${fmtTime(today.solunar.sun.rise)}`}
          sub={`☀ up · down ${fmtTime(today.solunar.sun.set)}`}
          foot={`${m.phaseName} · ${Math.round(m.illum * 100)}%`} />
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Next {outlook.length} days</div>
        <div className="outlook">
          {outlook.map((d, i) => (
            <div key={i} className="day-card">
              <div className="day-name">{i === 0 ? 'Today' : fmtDayShort(d.date)}</div>
              <div className="day-score" style={{ color: toneColor(d.verdict.tone) }}>{d.score}</div>
              <div className="day-verdict faint">{dayLabel(d.score)}</div>
              {d.windows[0] && <div className="day-window">{fmtTime(d.windows[0].center)}</div>}
            </div>
          ))}
        </div>
      </div>

      <p className="faint" style={{ fontSize: 12, textAlign: 'center', padding: '0 8px' }}>
        Planning aid only. Tides: NOAA CO-OPS · Marine: Open-Meteo · Warnings: NWS · Sun/moon computed on-device.
        Always verify safety with the latest NWS marine forecast.
      </p>
    </div>
  )
}

function Stat({ label, main, sub, foot }) {
  return (
    <div className="card stat">
      <div className="eyebrow">{label}</div>
      <div className="stat-main">{main}</div>
      {sub ? <div className="muted stat-sub">{sub}</div> : null}
      {foot ? <div className="faint stat-foot">{foot}</div> : null}
    </div>
  )
}

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

function Skeleton() {
  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Should I go fishing?</div>
        <h1 className="display">Reading the water…</h1>
      </div>
      <div className="card hero">
        <div className="skeleton" style={{ width: 188, height: 188, borderRadius: '50%' }} />
        <div className="hero-body stack-sm" style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 18, width: '60%' }} />
          <div className="skeleton" style={{ height: 28, width: '80%' }} />
        </div>
      </div>
      <div className="card"><div className="skeleton" style={{ height: 180 }} /></div>
      <div className="grid cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="card"><div className="skeleton" style={{ height: 60 }} /></div>)}</div>
    </div>
  )
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="stack">
      <div className="page-head"><h1 className="h1">Couldn't load conditions</h1></div>
      <div className="card placeholder">
        <div className="big">📡</div>
        <p className="muted">{error?.message || 'No cached data yet. Connect to WiFi once to prime the app for offline use.'}</p>
        <button className="btn primary" onClick={onRetry}>Try again</button>
      </div>
    </div>
  )
}
