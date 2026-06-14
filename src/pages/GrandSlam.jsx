import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { fmtDateShort } from '../utils/format.js'
import { IcCheck, IcTrophy } from '../components/icons.jsx'

const SLAMS = [
  {
    id: 'grand', name: 'Islamorada Grand Slam', need: 3,
    blurb: 'Tarpon, bonefish & permit in a single day — the flats crown.',
    parts: [
      { label: 'Tarpon', test: (s) => /tarpon/i.test(s) },
      { label: 'Bonefish', test: (s) => /bonefish/i.test(s) },
      { label: 'Permit', test: (s) => /permit/i.test(s) },
    ],
  },
  {
    id: 'backcountry', name: 'Backcountry Slam', need: 3,
    blurb: 'Snook, redfish & tarpon in a day.',
    parts: [
      { label: 'Snook', test: (s) => /snook/i.test(s) },
      { label: 'Redfish', test: (s) => /red(fish| drum)/i.test(s) },
      { label: 'Tarpon', test: (s) => /tarpon/i.test(s) },
    ],
  },
  {
    id: 'reef', name: 'Reef Slam', need: 3,
    blurb: 'Any three of: yellowtail, mutton, grouper, hogfish.',
    parts: [
      { label: 'Yellowtail', test: (s) => /yellowtail/i.test(s) },
      { label: 'Mutton', test: (s) => /mutton/i.test(s) },
      { label: 'Grouper', test: (s) => /grouper/i.test(s) },
      { label: 'Hogfish', test: (s) => /hogfish/i.test(s) },
    ],
  },
]

const dayKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }

export default function GrandSlam() {
  const catches = useLiveQuery(() => db.catches.toArray(), [], [])

  const byDay = {}
  for (const c of catches || []) {
    const k = dayKey(c.caughtAt)
    ;(byDay[k] || (byDay[k] = { ms: c.caughtAt, species: [] })).species.push(c.species)
  }
  const todaySpecies = byDay[dayKey(Date.now())]?.species || []

  const evalSlam = (slam, species) => {
    const met = slam.parts.map((p) => species.some(p.test))
    const count = met.filter(Boolean).length
    return { met, count, complete: count >= slam.need }
  }

  const history = []
  for (const day of Object.values(byDay)) {
    for (const slam of SLAMS) {
      if (evalSlam(slam, day.species).complete) history.push({ date: new Date(day.ms), slam: slam.name })
    }
  }
  history.sort((a, b) => b.date - a.date)

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Challenges</div>
        <h1 className="h1">Grand Slam</h1>
        <p className="muted">Tracked automatically from your catch log.</p>
      </header>

      {SLAMS.map((slam) => {
        const r = evalSlam(slam, todaySpecies)
        return (
          <div key={slam.id} className={`card stack-sm ${r.complete ? 'slam-done' : ''}`}>
            <div className="row between">
              <div className="h2">{slam.name}</div>
              {r.complete ? (
                <span className="tag bg-good" style={{ color: 'var(--good)' }}><IcTrophy width={14} height={14} /> Today!</span>
              ) : (
                <span className="faint tnum">{r.count}/{slam.need} today</span>
              )}
            </div>
            <p className="faint" style={{ fontSize: 13 }}>{slam.blurb}</p>
            <div className="row wrap" style={{ gap: 8 }}>
              {slam.parts.map((p, i) => (
                <span key={p.label} className={`chip ${r.met[i] ? 'active' : ''}`}>
                  {r.met[i] && <IcCheck width={14} height={14} />} {p.label}
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
              <div style={{ flex: 1 }}><div style={{ fontWeight: 650 }}>{h.slam}</div><div className="faint" style={{ fontSize: 12 }}>{fmtDateShort(h.date)}</div></div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
