import { useMemo, useState } from 'react'
import { KNOTS, KNOT_CATS } from '../data/knots.js'
import KnotDiagram from '../components/KnotDiagram.jsx'

export default function Knots() {
  const [cat, setCat] = useState('All')
  const shown = useMemo(() => (cat === 'All' ? KNOTS : KNOTS.filter((k) => k.cat === cat)), [cat])

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Reference</div>
        <h1 className="h1">Knots &amp; rigs</h1>
        <p className="muted">The connections the playbooks call for — diagrammed and step-by-step, ready with no signal.</p>
      </header>

      <div className="row wrap" style={{ gap: 8 }}>
        <button className={`chip ${cat === 'All' ? 'active' : ''}`} onClick={() => setCat('All')}>All</button>
        {KNOT_CATS.map((c) => <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
      </div>

      {shown.map((k) => (
        <div key={k.id} className="card stack-sm">
          <div className="knot-head">
            <div className="knot-dia"><KnotDiagram kind={k.kind} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h2">{k.name}</div>
              <div className="faint" style={{ fontSize: 12 }}>{k.cat}</div>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13.5 }}>{k.useFor}</p>
          <ol className="knot-steps">
            {k.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      ))}
    </div>
  )
}
