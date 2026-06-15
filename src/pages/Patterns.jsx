import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { insights } from '../engine/insights.js'
import { IcGrid, IcFlame } from '../components/icons.jsx'

const STRENGTH_COLOR = { Strong: 'var(--good)', 'Worth noting': 'var(--caution)', 'Early signal': 'var(--text-faint)' }

// Two-factor interaction heatmap: where his fish actually come from when you cross
// tide stage with moon phase. Cell = catch count, shaded by density; thin cells dim.
const TIDES = ['Incoming', 'Outgoing', 'High slack', 'Low slack', 'Tide change']
const MOONS = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
const MOON_AB = { 'New Moon': 'New', 'Waxing Crescent': 'Wx◔', 'First Quarter': '1Q', 'Waxing Gibbous': 'Wx◑', 'Full Moon': 'Full', 'Waning Gibbous': 'Wn◑', 'Last Quarter': '3Q', 'Waning Crescent': 'Wn◔' }

export default function Patterns() {
  const catches = useLiveQuery(() => db.catches.toArray(), [], [])
  const speciesList = useMemo(() => [...new Set((catches || []).map((c) => c.species).filter(Boolean))].sort(), [catches])
  const [species, setSpecies] = useState('All')

  const { grid, max, rows, cols, total } = useMemo(() => {
    const list = (catches || []).filter((c) => species === 'All' || c.species === species)
    const g = {}; let mx = 0
    for (const c of list) {
      if (!c.tide || !c.moonPhase) continue
      const k = `${c.tide}|${c.moonPhase}`
      g[k] = (g[k] || 0) + 1; if (g[k] > mx) mx = g[k]
    }
    const rows = TIDES.filter((t) => list.some((c) => c.tide === t))
    const cols = MOONS.filter((m) => list.some((c) => c.moonPhase === m))
    const usable = list.filter((c) => c.tide && c.moonPhase).length
    return { grid: g, max: mx, rows, cols, total: usable }
  }, [catches, species])

  const edges = useMemo(() => insights((catches || []).filter((c) => species === 'All' || c.species === species)), [catches, species])

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Patterns</div>
        <h1 className="h1">Tide × moon heatmap</h1>
        <p className="muted">The bite lives in the stack, not one factor. Here's where your fish actually came from.</p>
      </header>

      <div className="row wrap" style={{ gap: 8 }}>
        <button className={`chip ${species === 'All' ? 'active' : ''}`} onClick={() => setSpecies('All')}>All species</button>
        {speciesList.map((s) => <button key={s} className={`chip ${species === s ? 'active' : ''}`} onClick={() => setSpecies(s)}>{s}</button>)}
      </div>

      {edges.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow"><IcFlame width={13} height={13} style={{ verticalAlign: '-1px', marginRight: 5 }} />Your edges</div>
          {edges.map((e, i) => (
            <div key={i} className="row between" style={{ gap: 10, alignItems: 'baseline' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 650, fontSize: 14 }}>{e.title}</div>
                <div className="faint" style={{ fontSize: 12 }}>{e.detail}</div>
              </div>
              <span className="tag" style={{ background: 'var(--surface-2)', color: STRENGTH_COLOR[e.strength] }}>{e.strength}</span>
            </div>
          ))}
          <div className="faint" style={{ fontSize: 11 }}>Descriptive of your logged fish — not effort-adjusted. The more you log, the truer it gets.</div>
        </div>
      )}

      {total < 1 || rows.length === 0 ? (
        <div className="placeholder"><div className="big"><IcGrid width={34} height={34} /></div><p>Log a few catches with tide &amp; moon captured (one-tap logging does this automatically) and your pattern grid fills in here.</p></div>
      ) : (
        <div className="card stack-sm">
          <div className="heat-wrap">
            <table className="heat">
              <thead>
                <tr><th aria-hidden="true" />{cols.map((m) => <th key={m} title={m}>{MOON_AB[m] || m}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t}>
                    <th className="heat-row">{t}</th>
                    {cols.map((m) => {
                      const n = grid[`${t}|${m}`] || 0
                      const a = n ? 0.18 + 0.82 * (n / max) : 0
                      return <td key={m} style={{ background: n ? `rgba(54,197,240,${a.toFixed(2)})` : 'transparent', color: a > 0.55 ? '#03141a' : 'var(--text)' }}>{n || ''}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="faint" style={{ fontSize: 12 }}>{total} catches with tide &amp; moon recorded{species !== 'All' ? ` · ${species}` : ''}. Darker = more fish. Small samples mean small certainty.</div>
        </div>
      )}
    </div>
  )
}
