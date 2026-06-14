import { shrimpStatus, HARVEST_AS_OF } from '../data/harvest.js'
import RulesList from '../components/RulesList.jsx'

export default function Shrimp() {
  const status = shrimpStatus()
  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Cast & dip netting</div>
        <h1 className="h1">Shrimp</h1>
        <p className="muted">Recreational shrimping in the Keys.</p>
      </header>

      <div className="season-badge open">
        <div className="row between">
          <div>
            <div className="eyebrow">Shrimp</div>
            <div className="h1">Open year-round</div>
          </div>
          <div className="big" style={{ fontSize: 30 }}>🦐</div>
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>{status.season}</div>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Best conditions</div>
        <p className="muted" style={{ fontSize: 14 }}>
          Prime on <strong>new-moon nights</strong> on a strong <strong>outgoing tide</strong> — shrimp run with the current.
          Work channels, bridge shadow-lines, and dock/bridge lights with a dip net; the darker the night, the better.
        </p>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Rules</div>
        <RulesList rules={status.rules} />
      </div>

      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        Verified {HARVEST_AS_OF}. <a href={status.source} target="_blank" rel="noreferrer">Verify at FWC →</a>
      </p>
    </div>
  )
}
