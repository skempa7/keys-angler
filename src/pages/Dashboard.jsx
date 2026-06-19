import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useConditions } from '../hooks/useConditions.js'
import { db } from '../db/db.js'
import { edgeNow } from '../engine/personalEdge.js'
import { oneAnswer, answerCountdown, sinceLastLook } from '../engine/headline.js'
import { momentChip } from '../engine/momentChip.js'
import { todaysPlaybook } from '../engine/playbook.js'
import { watchList } from '../engine/watchlist.js'
import { armAlerts } from '../services/notify.js'
import ScoreRing from '../components/ScoreRing.jsx'
import FactorList from '../components/FactorList.jsx'
import TideCurve from '../components/TideCurve.jsx'
import MoonGlyph from '../components/MoonGlyph.jsx'
import ReefBackdrop from '../components/ReefBackdrop.jsx'
import HourlyScrubber from '../components/HourlyScrubber.jsx'
import OfflineButton from '../components/OfflineButton.jsx'
import { HOME_PORT } from '../config.js'
import { useActiveLocation } from '../hooks/useActiveLocation.js'
import { fmtTime, fmtRange, fmtDayShort, relTime, compass, toneColor, weatherLabel, dayLabel, sstColor } from '../utils/format.js'
import WindArrow from '../components/WindArrow.jsx'
import WeatherCard from '../components/WeatherCard.jsx'
import { IcStorm, IcWaves, IcPin, IcMoon, IcSun } from '../components/icons.jsx'
import { useOldSalt } from '../hooks/useOldSalt.js'
import { saltRead } from '../engine/oldSalt.js'
import { taleOfTheDay } from '../data/fishTales.js'

const MOMENT_ICONS = { IcWaves, IcMoon, IcSun }

export default function Dashboard() {
  const { data, loading, error, refreshing, online, refresh, cal } = useConditions({ days: 5 })
  const activeLoc = useActiveLocation()
  const catches = useLiveQuery(() => db.catches.toArray(), [], [])
  const { on: oldSalt } = useOldSalt()
  const [tick, setTick] = useState(() => Date.now())
  const [delta, setDelta] = useState(null)
  const looked = useRef(false)
  useEffect(() => { const id = setInterval(() => setTick(Date.now()), 30000); return () => clearInterval(id) }, [])
  useEffect(() => {
    if (looked.current || !data) return
    looked.current = true
    const cur = { score: data.nowScore?.score, windKn: data.nowConditions?.windKn, waveFt: data.nowConditions?.waveFt, sstF: data.nowConditions?.sstF, storm: data.stormToday?.level }
    try {
      const prev = JSON.parse(localStorage.getItem('ka_lastlook') || 'null')
      const age = prev ? Date.now() - prev.at : Infinity
      if (prev && age >= 40 * 60000 && age <= 48 * 3600e3) {
        const phrases = sinceLastLook(prev, cur)
        if (phrases) setDelta({ phrases, at: prev.at })
      }
      if (!prev || age >= 40 * 60000) localStorage.setItem('ka_lastlook', JSON.stringify({ ...cur, at: Date.now() }))
    } catch { /* private mode / no storage — skip the delta */ }
    armAlerts(data).catch(() => {}) // re-arm today's bite alerts (no-op unless opted in)
  }, [data])

  if (loading) return <Skeleton />
  if (error && !data) return <ErrorState error={error} onRetry={refresh} />

  const { nowScore, nowConditions: c, tideNow, alerts, today, outlook, nextWindow, sources, stormToday, buoy, marineForecast } = data
  const edge = edgeNow(catches || [], tideNow)
  const ans = oneAnswer(data, new Date(tick))
  const countdown = answerCountdown(ans, new Date(tick))
  const moment = momentChip(data, new Date(tick), ans)
  const playbook = todaysPlaybook({ conditions: data.nowConditions, pressureTrend: data.pressureTrend, tideNow: data.tideNow, solunar: data.today.solunar, stormToday: data.stormToday, sun: data.today.solunar?.sun, now: new Date(tick) })
  const watch = watchList({ data, now: new Date(tick) })
  const tone = nowScore.verdict.tone
  const saltLine = oldSalt ? saltRead({ score: nowScore.score, data, now: new Date(tick) }) : null
  const tale = taleOfTheDay(new Date(tick))
  const best = today.windows[0]
  const fetchedAts = Object.values(sources).map((s) => s.fetchedAt).filter(Boolean)
  const lastUpdated = fetchedAts.length ? Math.min(...fetchedAts) : null
  const stale = !online || Object.values(sources).some((s) => s.stale)
  const nextTide = today.tideEvents.find((e) => e.time > data.when)
  const m = today.solunar.moon
  // Week-at-a-glance summary (fills the outlook's right side on wide screens).
  const dn = (d) => (d === outlook[0] ? 'Today' : fmtDayShort(d.date))
  const bestDay = outlook.reduce((a, b) => (b.score > a.score ? b : a), outlook[0])
  const peakSol = outlook.reduce((a, b) => ((b.solunar?.lunarStrength ?? 0) > (a.solunar?.lunarStrength ?? 0) ? b : a), outlook[0])
  const primeDays = outlook.filter((d) => d.score >= 78).length
  const weekTrend = outlook[outlook.length - 1].score - outlook[0].score
  const weekNote = primeDays >= 2 ? `${primeDays} prime days this week — pick your window.` : weekTrend <= -10 ? 'Bite eases as the week goes on.' : weekTrend >= 10 ? 'Building later in the week.' : 'Steady, fishable week ahead.'

  return (
    <div className="stack">
      <header className="page-head">
        <div className="row between">
          <div className="eyebrow">Should I go fishing?</div>
          <div className="row" style={{ gap: 6 }}>
            <OfflineButton variant="chip" />
            <button className="chip" onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : '↻ Refresh'}</button>
          </div>
        </div>
        <h1 className="display" style={{ color: toneColor(tone) }}>{nowScore.verdict.label}</h1>
        <p className="answer-line" role="status" aria-live="polite">
          <b style={{ color: toneColor(ans.tone) }}>{ans.verb}</b> — {ans.detail}
          {ans.target && countdown ? <span className="answer-count"> · {countdown}</span> : null}
          {ans.caveat ? <span className="answer-caveat"> · {ans.caveat}</span> : null}
        </p>
        {moment && (() => {
          const MIcon = MOMENT_ICONS[moment.icon] || IcWaves
          return (
            <div className={`moment-chip tone-${moment.tone}`} role="status" aria-live="polite">
              <MIcon width={14} height={14} /><b>{moment.label}</b><span className="mc-sub"> · {moment.sub}</span>
            </div>
          )
        })()}
        {saltLine && <p className="salt-read"><span className="anchor">⚓</span><i>{saltLine}</i></p>}
        {delta && (
          <p className="answer-delta">Since your last look ({relTime(delta.at)}): {delta.phrases.join(' · ')}</p>
        )}
        <p className="muted small">
          <button className="loc-chip" onClick={() => window.dispatchEvent(new CustomEvent('ka-location'))} aria-label="Change fishing area">
            <IcPin width={12} height={12} /> {activeLoc.label || activeLoc.name}
          </button>
          {' · '}{stale ? 'cached' : 'updated'} {relTime(lastUpdated)}
          {stale && <span className="v-poor"> · offline/stale</span>}
        </p>
      </header>

      <div className="quick-actions">
        <Link to="/log" className="btn primary">＋ Log a catch</Link>
        <Link to="/plan" className="btn ghost">Plan a trip</Link>
      </div>
      <Link to="/onwater" className="btn block ow-launch"><IcWaves width={18} height={18} /> On-water mode — big &amp; glanceable, screen stays on</Link>

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

      {stormToday && stormToday.level !== 'low' && (
        <div className={`alert-banner ${stormToday.level === 'high' ? 'warn' : 'info'}`}>
          <strong><IcStorm width={15} height={15} style={{ verticalAlign: '-2px' }} /> {stormToday.level === 'high' ? 'Storm risk' : 'Showers possible'}</strong> — {stormToday.text}
        </div>
      )}

      {watch.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Keep in mind today</div>
          {watch.map((w, i) => (
            <div key={i} className="row" style={{ gap: 8, alignItems: 'baseline', fontSize: 13.5 }}>
              <span style={{ color: toneColor(w.tone === 'bad' ? 'bad' : w.tone === 'caution' ? 'caution' : 'accent'), flex: 'none', fontWeight: 700 }}>•</span>
              <span>{w.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card hero raised">
        <ReefBackdrop />
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

      <WeatherCard wx={data.weatherToday} sun={today.solunar.sun} when={data.when} />

      {edge && (
        <div className="card stack-sm">
          <div className="row between">
            <div className="eyebrow">Your edge</div>
            {edge.match && <span className="tag bg-good" style={{ color: 'var(--good)' }}>Pattern ON</span>}
          </div>
          <div className="h2">{edge.match ? `Your ${edge.pattern.species} bite is dialed in` : `${edge.pattern.species}: you favor the ${edge.pattern.dir} tide`}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            You've boated {edge.pattern.species.toLowerCase()} on the {edge.pattern.dir} tide {edge.pattern.hits} of {edge.pattern.total} times.{' '}
            {edge.currentDir ? (edge.match ? `It's ${edge.currentDir} right now — go.` : `Tide is ${edge.currentDir} now; your window is the ${edge.pattern.dir}.`) : ''}
          </div>
        </div>
      )}

      <div className="card stack-sm">
        <div className="row between">
          <div className="h2">What's driving the score</div>
          {cal?.gated
            ? <span className="tag" style={{ background: 'var(--surface-2)', color: 'var(--good)' }}>Tuned · {cal.n} fish</span>
            : <span className="faint" style={{ fontSize: 12 }}>tap a factor</span>}
        </div>
        <FactorList factors={nowScore.factors} />
      </div>

      {playbook.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Today's playbook · what's different</div>
          {playbook.map((p, i) => (
            <div key={i} className="row" style={{ gap: 10, alignItems: 'baseline' }}>
              <span className="tag" style={{ flex: 'none', minWidth: 74, justifyContent: 'center', background: 'var(--surface-2)', color: toneColor(p.tone === 'good' ? 'good' : p.tone === 'caution' ? 'caution' : 'accent') }}>{p.tag}</span>
              <span style={{ fontSize: 13.5 }}>{p.tip}</span>
            </div>
          ))}
          <div className="faint" style={{ fontSize: 11 }}>Adjustments vs. a normal day, read from today's conditions — your local knowledge wins ties.</div>
        </div>
      )}

      {tale && (
        <div className="card stack-sm tale-feature">
          <div className="row between">
            <div className="eyebrow">Today in Keys fishing</div>
            <Link to="/tales" className="faint" style={{ fontSize: 12 }}>More tales →</Link>
          </div>
          <div className="tale-head"><strong style={{ fontSize: 15 }}>{tale.title}</strong>{tale.tag && <span className="chip sm">{tale.tag}</span>}</div>
          <p className="muted" style={{ margin: 0, lineHeight: 1.5, fontSize: 14 }}>{tale.body}</p>
        </div>
      )}

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
          foot={c.waveFt != null ? `${c.waveFt.toFixed(1)} ft @ ${Math.round(c.wavePeriod || 0)} s` : ''}
          glyph={<WindArrow dir={c.windDir} />} />
        <Stat label="Water temp" main={c.sstF != null ? `${Math.round(c.sstF)}°F` : '—'}
          sub={c.weatherCode != null ? weatherLabel(c.weatherCode) : ''}
          foot={c.airF != null ? `Air ${Math.round(c.airF)}°F` : ''}
          mainColor={sstColor(c.sstF)} />
        <Stat label="Sun & moon" main={`${fmtTime(today.solunar.sun.rise)}`}
          sub={`☀ up · down ${fmtTime(today.solunar.sun.set)}`}
          foot={`${m.phaseName} · ${Math.round(m.illum * 100)}%`}
          glyph={<MoonGlyph illum={m.illum} phaseDeg={m.phaseDeg} size={30} />} />
      </div>

      {buoy && (
        <div className="card quiet stack-sm">
          <div className="row between">
            <div className="eyebrow">Live buoy{buoy.name ? ` · ${buoy.name}` : ''}{buoy.distNm ? ` · ~${Math.round(buoy.distNm)} nm` : ''}</div>
            <span className="faint" style={{ fontSize: 11 }}>{buoy.timestamp ? relTime(new Date(buoy.timestamp).getTime()) : ''}</span>
          </div>
          <div className="row wrap" style={{ gap: 'var(--sp-5)' }}>
            {buoy.windKn != null && <div><div className="faint" style={{ fontSize: 11 }}>Wind</div><div style={{ fontWeight: 700 }}>{Math.round(buoy.windKn)}{buoy.gustKn ? ` g${Math.round(buoy.gustKn)}` : ''} kn {compass(buoy.windDir)}</div></div>}
            {buoy.sstF != null && <div><div className="faint" style={{ fontSize: 11 }}>Water</div><div style={{ fontWeight: 700, color: sstColor(buoy.sstF) }}>{Math.round(buoy.sstF)}°F</div></div>}
            {buoy.airTempF != null && <div><div className="faint" style={{ fontSize: 11 }}>Air</div><div style={{ fontWeight: 700 }}>{Math.round(buoy.airTempF)}°F</div></div>}
            {buoy.pressureInHg != null && <div><div className="faint" style={{ fontSize: 11 }}>Baro</div><div style={{ fontWeight: 700 }}>{buoy.pressureInHg.toFixed(2)}"</div></div>}
          </div>
          <div className="faint" style={{ fontSize: 11 }}>Observed — the real reading vs. the model above.</div>
        </div>
      )}

      {marineForecast?.text && (
        <details className="card quiet forecast-card">
          <summary>
            <span className="eyebrow">NWS marine forecast</span>
            <span className="faint" style={{ fontSize: 11 }}> · {marineForecast.issued ? `issued ${relTime(new Date(marineForecast.issued).getTime())}` : 'tap to read'}</span>
          </summary>
          <pre className="forecast-text">{marineForecast.text}</pre>
        </details>
      )}

      {today.tideEvents.length >= 2 && (
        <div className="card stack-sm">
          <div className="row between">
            <div className="eyebrow">Today's tide</div>
            {tideNow && <span className="faint" style={{ fontSize: 12 }}>{capitalize(tideNow.direction)}{nextTide ? ` · next ${nextTide.type === 'H' ? 'high' : 'low'} ${fmtTime(nextTide.time)}` : ''}</span>}
          </div>
          <TideCurve events={today.tideEvents} now={data.when} />
          {data.tideStation && <div className="faint" style={{ fontSize: 11, textAlign: 'center' }}>Tides: {data.tideStation.name} · {data.tideStation.distNm} nm away</div>}
        </div>
      )}

      <HourlyScrubber hourly={today.hourlyScores} nowHour={data.when.getHours()} />

      <div className="card stack-sm">
        <div className="eyebrow">Next {outlook.length} days</div>
        <div className="outlook-wrap">
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
          <div className="week-summary">
            <div className="eyebrow">This week</div>
            <div className="wk-row"><span className="faint">Best day</span><strong style={{ color: toneColor(bestDay.verdict.tone) }}>{dn(bestDay)} · {bestDay.score} {dayLabel(bestDay.score)}</strong></div>
            <div className="wk-row"><span className="faint">Peak solunar</span><strong>{dn(peakSol)} · {peakSol.solunar.moon.phaseName}</strong></div>
            <div className="wk-note">{weekNote}</div>
            <Link to="/calendar" className="chip" style={{ alignSelf: 'flex-start' }}>Open month calendar →</Link>
          </div>
        </div>
      </div>

      <p className="faint" style={{ fontSize: 12, textAlign: 'center', padding: '0 8px' }}>
        Planning aid only. Tides: NOAA CO-OPS · Marine: Open-Meteo · Warnings: NWS · Sun/moon computed on-device.
        Always verify safety with the latest NWS marine forecast.
      </p>
    </div>
  )
}

function Stat({ label, main, sub, foot, glyph, mainColor }) {
  return (
    <div className="card stat">
      <div className="row between"><div className="eyebrow">{label}</div>{glyph || null}</div>
      <div className="stat-main" style={mainColor ? { color: mainColor } : undefined}>{main}</div>
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
