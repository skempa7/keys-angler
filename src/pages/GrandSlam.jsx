import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { SLAMS, groupByDay, evalSlam, computeSlams, dayKey } from '../data/slams.js'
import { fmtDateShort } from '../utils/format.js'
import { IcCheck, IcTrophy } from '../components/icons.jsx'

export default function GrandSlam() {
  const catches = useLiveQuery(() => db.catches.toArray(), [], [])
  const byDay = groupByDay(catches || [])
  const todaySpecies = byDay[dayKey(Date.now())]?.species || []
  const history = computeSlams(catches || [])

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Challenges</div>
        <h1 className="h1">Grand Slam</h1>
        <p className="muted">Tracked automatically from your catch log.</p>
      </header>

      {SLAMS.map((slam) => {
        const res = evalSlam(slam, todaySpecies)
        return (
          <div key={slam.id} className={`card stack-sm ${res.complete ? 'slam-done' : ''}`}>
            <div className="row between">
              <div className="h2">{slam.name}</div>
              {res.complete ? (
                <span className="tag bg-good" style={{ color: 'var(--good)' }}><IcTrophy width={14} height={14} /> Today!</span>
              ) : (
                <span className="faint tnum">{res.count}/{slam.need} today</span>
              )}
            </div>
            <p className="faint" style={{ fontSize: 13 }}>{slam.blurb}</p>
            <div className="row wrap" style={{ gap: 8 }}>
              {slam.parts.map((p, i) => (
                <span key={p.label} className={`chip ${res.met[i] ? 'active' : ''}`}>
                  {res.met[i] && <IcCheck width={14} height={14} />} {p.label}
                </span>
              ))}
            </div>
          </div>
        )
      })}

      <div className="card stack-sm">
        <div className="eyebrow">Slam history</div>
        {history.length === 0 ? (
          <p className="faint" style={{ fontSize: 13 }}>No slams yet — log your catches and the app will catch the day you pull it off.</p>
        ) : (
          history.map((h, i) => (
            <div key={i} className="catch-row">
              <span style={{ color: 'var(--gold)' }}><IcTrophy width={20} height={20} /></span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 650 }}>{h.slamName}</div><div className="faint" style={{ fontSize: 12 }}>{fmtDateShort(h.date)}</div></div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
