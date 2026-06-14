import { useMemo, useState } from 'react'
import { solunarDay } from '../engine/solunar.js'
import { useActiveLocation } from '../hooks/useActiveLocation.js'
import { MIGRATIONS, monthName } from '../data/migrations.js'
import MoonGlyph from '../components/MoonGlyph.jsx'
import { fmtDateShort } from '../utils/format.js'

const dotColor = (s) => (s > 0.8 ? 'var(--good)' : s > 0.55 ? 'var(--ok)' : s > 0.3 ? 'var(--caution)' : 'var(--text-faint)')

export default function Calendar() {
  const loc = useActiveLocation()
  const [offset, setOffset] = useState(0)
  const base = new Date()
  const view = new Date(base.getFullYear(), base.getMonth() + offset, 1)
  const year = view.getFullYear()
  const month = view.getMonth()
  const todayKey = `${base.getFullYear()}-${base.getMonth()}-${base.getDate()}`

  const days = useMemo(() => {
    const n = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: n }, (_, i) => {
      const date = new Date(year, month, i + 1)
      const sol = solunarDay(date, loc.lat, loc.lon)
      return { d: i + 1, date, strength: sol.lunarStrength, phase: sol.moon.phaseDeg, illum: sol.moon.illum }
    })
  }, [year, month, loc.lat, loc.lon])

  const firstDow = new Date(year, month, 1).getDay()
  const best = [...days].sort((a, b) => b.strength - a.strength).slice(0, 5)
  const migrations = MIGRATIONS[month] || []

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Plan ahead</div>
        <h1 className="h1">Calendar</h1>
        <p className="muted">Best fishing days (solunar) &amp; what’s running.</p>
      </header>

      <div className="card stack-sm">
        <div className="row between">
          <button className="chip" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month">‹</button>
          <div className="h2">{monthName(month)} {year}</div>
          <button className="chip" onClick={() => setOffset((o) => o + 1)} aria-label="Next month">›</button>
        </div>
        <div className="cal-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => <div key={i} className="cal-dow">{w}</div>)}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {days.map((day) => (
            <div key={day.d} className={`cal-cell ${`${year}-${month}-${day.d}` === todayKey ? 'today' : ''}`}>
              <div className="cal-d">{day.d}</div>
              <MoonGlyph illum={day.illum} phaseDeg={day.phase} size={15} />
              <div className="cal-dot" style={{ background: dotColor(day.strength) }} />
            </div>
          ))}
        </div>
        <div className="faint" style={{ fontSize: 11 }}>Dot = solunar strength (peaks at new &amp; full moon); the disc shows that day’s moon phase.</div>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Best days this month</div>
        {best.map((b, i) => (
          <div key={i} className="row between" style={{ padding: '5px 0' }}>
            <div className="row" style={{ gap: 8 }}><MoonGlyph illum={b.illum} phaseDeg={b.phase} size={18} /><span style={{ fontWeight: 600 }}>{fmtDateShort(b.date)}</span></div>
            <span className="faint" style={{ fontSize: 12 }}>{b.strength > 0.85 ? 'Peak solunar' : b.strength > 0.6 ? 'Strong' : 'Good'}</span>
          </div>
        ))}
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Running in {monthName(month)}</div>
        <div className="row wrap" style={{ gap: 8 }}>
          {migrations.map((m, i) => <span key={i} className={`chip ${m.hot ? 'active' : ''}`}>{m.s}{m.hot ? ' 🔥' : ''}</span>)}
        </div>
        <ul className="rules-list" style={{ marginTop: 4 }}>
          {migrations.filter((m) => m.note).map((m, i) => <li key={i}><b>{m.s}:</b> {m.note}</li>)}
        </ul>
      </div>

      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        Solunar days computed on-device for any month. Seasons/migrations are typical Keys timing — verify open seasons in Regulations.
      </p>
    </div>
  )
}
