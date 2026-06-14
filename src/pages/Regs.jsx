import { useMemo, useState } from 'react'
import { FINFISH, getReg, checkKeep, isOpenOn, verifyUrl, REGS_AS_OF } from '../data/regs.js'
import { pad } from '../utils/format.js'

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

export default function Regs() {
  const [speciesId, setSpeciesId] = useState('yellowtail')
  const [size, setSize] = useState('')
  const [dateStr, setDateStr] = useState(todayStr)

  const reg = getReg(speciesId)
  const date = useMemo(() => { const [y, m, d] = dateStr.split('-').map(Number); return new Date(y, m - 1, d) }, [dateStr])
  const res = useMemo(() => checkKeep(reg, size === '' ? null : parseFloat(size), date), [reg, size, date])
  const catchRelease = reg.season?.kind === 'catch-release'

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Regulations</div>
        <h1 className="h1">Is it legal to keep this?</h1>
        <p className="muted">Keys / Monroe (Atlantic). Works offline from the last-verified rules.</p>
      </header>

      <div className="card stack-sm">
        <label className="field">
          <span className="field-label">Species</span>
          <select className="input" value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
            {FINFISH.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <div className="row" style={{ gap: 'var(--sp-3)' }}>
          <label className="field" style={{ flex: 1 }}>
            <span className="field-label">Length (in){reg.sizeType !== 'none' ? ` · ${reg.sizeType}` : ''}</span>
            <input className="input" type="number" inputMode="decimal" placeholder={catchRelease ? 'n/a' : 'e.g. 14'} value={size} onChange={(e) => setSize(e.target.value)} disabled={catchRelease} />
          </label>
          <label className="field" style={{ flex: 1 }}>
            <span className="field-label">Date</span>
            <input className="input" type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          </label>
        </div>
      </div>

      <div className={`card keep-result ${res.keep ? 'good' : 'bad'}`}>
        <div className="keep-verdict">{catchRelease ? 'RELEASE' : res.keep ? 'KEEP' : 'RELEASE'}</div>
        <div className="keep-rule">{reg.rule}</div>
        <ul className="keep-reasons">
          {res.reasons.map((r, i) => <li key={i}>{r}</li>)}
          {!catchRelease && size === '' && <li className="muted">Enter a length to check the size limit.</li>}
        </ul>
        {reg.keysNote && <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Keys note: {reg.keysNote}</p>}
        <a className="btn ghost block" href={verifyUrl(reg)} target="_blank" rel="noreferrer" style={{ marginTop: 10 }}>
          Verify at FWC →
        </a>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">All Keys finfish rules</div>
        {FINFISH.map((r) => {
          const open = isOpenOn(r, date)
          return (
            <div key={r.id} className="reg-row">
              <div className="row between">
                <span className="reg-name">{r.name}</span>
                <span className="tag" style={{ color: r.season?.kind === 'catch-release' ? 'var(--accent)' : open ? 'var(--good)' : 'var(--bad)', background: 'var(--surface-2)' }}>
                  {r.season?.kind === 'catch-release' ? 'C&R only' : open ? 'In season' : 'Closed'}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 13 }}>{r.rule}</p>
            </div>
          )
        })}
      </div>

      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        Verified {REGS_AS_OF}. Regulations change by FWC rulemaking & in-season Executive Orders — always confirm with FWC before harvesting.
      </p>
    </div>
  )
}
