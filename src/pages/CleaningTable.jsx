import { useMemo, useState } from 'react'
import { computeCooler } from '../engine/limits.js'
import { PICKER, SHORT } from '../data/aggregates.js'
import { FWC_BASE, REGS_AS_OF } from '../data/regs.js'
import { IcPlus, IcShield } from '../components/icons.jsx'
import { haptic } from '../utils/haptic.js'

function Stepper({ value, onChange, min = 0 }) {
  const set = (v) => { const n = Math.max(min, v); if (n !== value) { haptic.tick?.(); onChange(n) } }
  return (
    <div className="step">
      <button className="step-btn" onClick={() => set(value - 1)} disabled={value <= min} aria-label="Less">−</button>
      <span className="step-val">{value}</span>
      <button className="step-btn" onClick={() => set(value + 1)} aria-label="More"><IcPlus width={15} height={15} /></button>
    </div>
  )
}

const pct = (n, d) => `${Math.min(100, d ? (n / d) * 100 : 0)}%`

export default function CleaningTable() {
  const [party, setParty] = useState(2)
  const [counts, setCounts] = useState({})

  const setCount = (id, n) => setCounts((c) => ({ ...c, [id]: n }))
  const clear = () => { haptic.tick?.(); setCounts({}) }

  const r = useMemo(() => computeCooler(counts, party), [counts, party])
  const hasFish = r.totalFish > 0

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Cleaning table</div>
        <h1 className="h1">What can the boat keep?</h1>
        <p className="muted">Bag &amp; aggregate check for the cooler — Keys / Monroe (Atlantic). Counts only; size &amp; season are on the Regs page.</p>
      </header>

      <div className="card row between" style={{ alignItems: 'center' }}>
        <div>
          <div className="field-label">Anglers aboard</div>
          <div className="faint" style={{ fontSize: 12 }}>Limits scale with the party</div>
        </div>
        <Stepper value={party} onChange={setParty} min={1} />
      </div>

      <div className="card stack-sm">
        <div className="row between" style={{ alignItems: 'center' }}>
          <div className="eyebrow" style={{ margin: 0 }}>In the cooler</div>
          {hasFish && <button className="btn ghost sm" onClick={clear}>Clear</button>}
        </div>
        <div className="clean-grid">
          {PICKER.map((id) => (
            <div key={id} className={`clean-row ${(counts[id] || 0) > 0 ? 'on' : ''}`}>
              <span className="clean-name">{SHORT[id] || id}</span>
              <Stepper value={counts[id] || 0} onChange={(n) => setCount(id, n)} />
            </div>
          ))}
        </div>
      </div>

      {!hasFish && (
        <div className="card empty-note">
          <span className="empty-glyph"><IcShield width={26} height={26} /></span>
          <p className="muted" style={{ margin: 0 }}>Tap fish into the cooler to check bag limits, the snapper &amp; grouper aggregates, and rough fillet weight.</p>
        </div>
      )}

      {hasFish && (
        <>
          <div className={`card keep-result ${r.legal ? 'good' : 'bad'}`}>
            <div className="keep-verdict">{r.legal ? 'WITHIN LIMITS' : 'OVER THE LIMIT'}</div>
            {r.legal
              ? <div className="keep-rule">{r.totalFish} fish for {r.party} {r.party === 1 ? 'angler' : 'anglers'} — nothing over a posted cap.</div>
              : <ul className="keep-reasons">{r.violations.map((v, i) => <li key={i}>{v}</li>)}</ul>}
          </div>

          {r.groups.map((g) => (
            <div key={g.id} className={`card lim-card s-${g.status}`}>
              <div className="row between" style={{ alignItems: 'baseline' }}>
                <span className="lim-title">{g.name}</span>
                <span className="lim-count">{g.total}<span className="lim-cap"> / {g.cap}</span></span>
              </div>
              <div className="lim-bar"><span className={`s-${g.status}`} style={{ width: pct(g.total, g.cap) }} /></div>
              <div className="lim-sub">
                {g.status === 'over'
                  ? `Over by ${g.overBy} — drop ${g.overBy}.`
                  : g.uncertain
                    ? `Up to ${g.spotsLeft} more here — but verify your total stays ≤ ${g.cap}: mangrove, lane & red snapper count too.`
                    : g.spotsLeft === 0 ? 'At the limit — no room for more.' : `${g.spotsLeft} more allowed.`}
              </div>
              <div className="lim-members">
                {g.members.map((m) => (
                  <div key={m.id} className={`lim-member ${m.status === 'over' ? 'over' : ''}`}>
                    <span>{m.name} ×{m.count}</span>
                    <span className="faint">
                      {m.closed ? 'CLOSED season' : m.note ? m.note : m.sub ? `${m.sub.total} / ${m.sub.cap} ${m.sub.kind === 'combined' ? 'combined' : 'sub-limit'}` : 'in the aggregate'}
                    </span>
                  </div>
                ))}
              </div>
              {g.note && <p className="faint lim-note">{g.note}</p>}
            </div>
          ))}

          {r.standalone.length > 0 && (
            <div className="card stack-sm">
              <div className="eyebrow" style={{ margin: 0 }}>Per-species</div>
              {r.standalone.map((s) => (
                <div key={s.id} className="lim-row">
                  <div className="lim-row-main">
                    <span className="lim-row-name">{s.name} ×{s.count}</span>
                    <span className="faint" style={{ fontSize: 12 }}>{s.capNote}</span>
                  </div>
                  <span className={`lim-pill ${s.release ? 's-over' : s.closed ? 's-at' : `s-${s.status}`}`}>
                    {s.release ? 'release only'
                      : s.closed ? 'CLOSED — 0 keepable'
                        : s.status === 'over' ? `over by ${s.overBy}`
                          : s.status === 'at' ? 'at limit'
                            : `${s.spotsLeft} left${s.vesselBound ? ' · boat cap' : ''}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="card row between" style={{ alignItems: 'center' }}>
            <div>
              <div className="field-label">Rough fillet yield</div>
              <div className="faint" style={{ fontSize: 12 }}>Cooler/freezer planning only — very size-dependent</div>
            </div>
            <div className="yield-big">≈ {r.yieldLb} <span>lb</span></div>
          </div>
        </>
      )}

      <a className="btn ghost block" href={FWC_BASE} target="_blank" rel="noreferrer">Verify at FWC →</a>
      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        Counts only — a fish within the bag can still be undersized, out of slot, or out of season (check Regs). Snapper &amp; grouper aggregates here track the species this app knows; verify totals with FWC. Rules verified {REGS_AS_OF} and change by FWC rulemaking &amp; in-season Executive Orders.
      </p>
    </div>
  )
}
