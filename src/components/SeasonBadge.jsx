import { fmtDateShort } from '../utils/format.js'

// Open/closed status + countdown to the next season change.
export default function SeasonBadge({ status }) {
  const { open, daysUntil, changeTo, nextChange, season, fishery } = status
  return (
    <div className={`season-badge ${open ? 'open' : 'closed'}`}>
      <div className="row between">
        <div>
          <div className="eyebrow">{fishery}</div>
          <div className="h1">{open ? 'In season' : 'Closed'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="season-count">{Math.max(0, daysUntil)}</div>
          <div className="faint" style={{ fontSize: 11 }}>days</div>
        </div>
      </div>
      <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        {season} · {changeTo} {fmtDateShort(nextChange)}
      </div>
    </div>
  )
}
