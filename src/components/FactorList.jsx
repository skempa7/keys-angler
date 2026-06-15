import { scoreColor } from '../utils/format.js'
import { IcChevron } from './icons.jsx'

// Tap any factor to see exactly how it contributed. Native <details> = accessible + zero state.
export default function FactorList({ factors }) {
  return (
    <div className="factors">
      {factors.map((f) => (
        <details key={f.key} className="factor-item">
          <summary>
            <div className="factor-head">
              <span className="factor-name">
                <IcChevron className="caret" width={16} height={16} />
                {f.label}
                {f.tuned && Math.abs(f.deltaPct) >= 8 && (
                  <span className="factor-tune" style={{ color: f.deltaPct > 0 ? 'var(--good)' : 'var(--text-faint)', fontSize: 11, fontWeight: 700 }}> {f.deltaPct > 0 ? '▲' : '▼'}{Math.abs(f.deltaPct)}%</span>
                )}
              </span>
              <span className="mono faint">+{Math.round(f.contribution)}<span className="of">/{Math.round(f.weight)}</span></span>
            </div>
            <div className="bar">
              <i style={{ width: `${Math.round(f.score * 100)}%`, background: scoreColor(f.score) }} />
            </div>
          </summary>
          <p className="factor-detail muted">{f.detail}</p>
        </details>
      ))}
    </div>
  )
}
