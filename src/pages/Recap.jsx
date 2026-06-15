import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { computeRecap, catchYears, personalBests } from '../engine/recap.js'
import { fmtDateShort } from '../utils/format.js'
import { IcFlame, IcFish, IcTrophy, IcShare, IcStar } from '../components/icons.jsx'

export default function Recap() {
  const catches = useLiveQuery(() => db.catches.toArray(), [], [])
  const years = useMemo(() => catchYears(catches), [catches])
  const [year, setYear] = useState(null) // null = all time
  const recap = useMemo(() => computeRecap(catches, year), [catches, year])
  const bests = useMemo(() => personalBests(catches), [catches])

  const share = async () => {
    if (!recap) return
    const lines = [
      `🎣 Keys Angler — ${year || 'All-time'} recap`,
      `${recap.total} fish · ${recap.species} species · ${recap.daysFished} days on the water`,
      recap.biggest ? `Biggest: ${recap.biggest.lengthIn}" ${recap.biggest.species}` : '',
      recap.bestMonth?.count ? `Best month: ${recap.bestMonth.month}` : '',
      recap.bestTide ? `Hot tide: ${recap.bestTide.value}` : '',
      recap.bestMoon ? `Hot moon: ${recap.bestMoon.value}` : '',
      recap.streak > 1 ? `Longest streak: ${recap.streak} days` : '',
    ].filter(Boolean).join('\n')
    try { if (navigator.share) await navigator.share({ title: 'Keys Angler recap', text: lines }); else await navigator.clipboard.writeText(lines) } catch { /* cancelled */ }
  }

  const maxMonth = recap ? Math.max(1, ...recap.byMonth.map((m) => m.count)) : 1

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Season recap</div>
        <h1 className="h1">Your year on the water</h1>
        <p className="muted">Everything your logbook knows — a year (or a lifetime) of fish at a glance.</p>
      </header>

      <div className="row wrap" style={{ gap: 8 }}>
        <button className={`chip ${year == null ? 'active' : ''}`} onClick={() => setYear(null)}>All-time</button>
        {years.map((y) => <button key={y} className={`chip ${year === y ? 'active' : ''}`} onClick={() => setYear(y)}>{y}</button>)}
      </div>

      {!recap ? (
        <div className="placeholder"><div className="big"><IcFlame width={34} height={34} /></div><p>No catches logged yet. Your recap fills in as you fish.</p></div>
      ) : (
        <>
          <div className="grid cols-2">
            <div className="card stat"><div className="eyebrow">Fish landed</div><div className="stat-main">{recap.total}</div><div className="faint stat-foot">{recap.daysFished} days out</div></div>
            <div className="card stat"><div className="eyebrow">Species</div><div className="stat-main">{recap.species}</div><div className="faint stat-foot">different kinds</div></div>
            <div className="card stat"><div className="row between"><div className="eyebrow">Biggest</div><IcTrophy width={18} height={18} style={{ color: 'var(--gold)' }} /></div><div className="stat-main">{recap.biggest ? `${recap.biggest.lengthIn}"` : '—'}</div><div className="faint stat-foot">{recap.biggest?.species || 'log a length'}</div></div>
            <div className="card stat"><div className="eyebrow">Best streak</div><div className="stat-main">{recap.streak}</div><div className="faint stat-foot">days in a row</div></div>
          </div>

          <div className="card stack-sm">
            <div className="eyebrow">By month</div>
            <div className="recap-months">
              {recap.byMonth.map((m) => (
                <div key={m.month} className="rm-col" title={`${m.month}: ${m.count}`}>
                  <div className="rm-track"><div className="rm-bar" style={{ height: `${Math.round((m.count / maxMonth) * 100)}%` }} /></div>
                  <div className="rm-n">{m.count || ''}</div>
                  <div className="rm-l">{m.month[0]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card stack-sm">
            <div className="eyebrow">Your signature</div>
            <p style={{ fontSize: 15 }}>
              You fished best in <b>{recap.bestMonth.month}</b>
              {recap.bestTide ? <> and crushed it on the <b>{recap.bestTide.value.toLowerCase()}</b> tide</> : ''}
              {recap.bestMoon ? <>, most often under a <b>{recap.bestMoon.value}</b></> : ''}.
            </p>
            <div className="faint" style={{ fontSize: 12 }}>From {fmtDateShort(new Date(recap.first))} to {fmtDateShort(new Date(recap.last))}.</div>
          </div>

          <div className="card stack-sm">
            <div className="eyebrow">Species mix</div>
            {recap.speciesMix.slice(0, 10).map((s) => (
              <div key={s.species} className="row between" style={{ fontSize: 14 }}>
                <span><IcFish width={15} height={15} style={{ verticalAlign: '-2px', color: 'var(--text-faint)' }} /> {s.species}</span>
                <b>{s.count}</b>
              </div>
            ))}
          </div>

          {bests.length > 0 && (
            <div className="card stack-sm">
              <div className="eyebrow"><IcStar width={13} height={13} style={{ verticalAlign: '-1px', marginRight: 5, color: 'var(--gold)' }} />Personal bests · all-time</div>
              {bests.slice(0, 8).map((b) => (
                <div key={b.species} className="row between" style={{ fontSize: 14 }}>
                  <span>{b.species}</span>
                  <span><b style={{ color: 'var(--gold)' }}>{b.lengthIn}"</b> <span className="faint" style={{ fontSize: 12 }}>· {fmtDateShort(new Date(b.at))}</span></span>
                </div>
              ))}
            </div>
          )}

          <button className="btn ghost block" onClick={share}><IcShare width={18} height={18} /> Share my recap</button>
        </>
      )}
    </div>
  )
}
