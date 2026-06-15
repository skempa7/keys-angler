import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { SPECIES, getSpecies, speciesByZone } from '../data/species.js'
import { fmtDateShort } from '../utils/format.js'

// Match a free-text catch species to a KB species (exact, prefix, or first-word).
const matchSpecies = (name, s) => {
  const n = (name || '').toLowerCase().trim(); if (!n) return false
  const kb = s.name.toLowerCase()
  return n === kb || kb.startsWith(n) || n.startsWith(kb.split(/[ (]/)[0])
}
import { ZONES, ZONE_BY_ID } from '../config.js'
import { getReg, isOpenOn, verifyUrl } from '../data/regs.js'
import { useConditions } from '../hooks/useConditions.js'
import { fmtRange, strengthColor } from '../utils/format.js'
import { IcChevron } from '../components/icons.jsx'
import { SpeciesArt } from '../components/FishArt.jsx'
import ZoneScene from '../components/ZoneScene.jsx'

export default function Species() {
  const { data } = useConditions({ days: 1 })
  const gear = useLiveQuery(() => db.gear.toArray(), [], [])
  const [params, setParams] = useSearchParams()
  const [selId, setSelId] = useState(() => params.get('s'))
  const species = selId ? getSpecies(selId) : null
  const sst = data?.nowConditions?.sstF
  const closeDetail = () => { setSelId(null); if (params.get('s')) setParams({}, { replace: true }) }

  // "Hot right now" — in-season targets ranked by how well today's water fits them.
  const hot = useMemo(() => {
    return SPECIES.map((s) => {
      const reg = getReg(s.regsKey)
      const cr = reg?.season?.kind === 'catch-release'
      const open = cr ? true : reg ? isOpenOn(reg) : true
      const inBand = sst != null && sst >= s.waterTempMinF && sst <= s.waterTempMaxF
      const near = sst != null && !inBand && Math.min(Math.abs(sst - s.waterTempMinF), Math.abs(sst - s.waterTempMaxF)) <= 3
      const score = (open ? 3 : 0) + (inBand ? 3 : near ? 1 : 0) + (cr ? 0 : 1)
      const reason = inBand && sst != null ? `${Math.round(sst)}°F — in its zone` : open ? (cr ? 'biting (C&R)' : 'in season') : 'off-season'
      return { s, open, inBand, score, reason }
    }).filter((x) => x.open).sort((a, b) => b.score - a.score).slice(0, 4)
  }, [sst])

  if (species) return <Detail s={species} data={data} gear={gear} onBack={closeDetail} />

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Target a species</div>
        <h1 className="h1">What do you want to catch?</h1>
        <p className="muted">Tuned to today’s water and your gear.</p>
      </header>
      <ZoneScene />
      {hot.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">🔥 Hot right now{sst != null ? ` · ${Math.round(sst)}°F water` : ''}</div>
          <div className="tile-grid">
            {hot.map(({ s, inBand, reason }) => (
              <button key={s.id} className="tile" onClick={() => setSelId(s.id)}>
                <span className="tile-ico"><SpeciesArt id={s.id} width={34} height={20} /></span>
                <span className="tile-body">
                  <span className="tile-label">{s.name}</span>
                  <span className="tile-sub" style={inBand ? { color: 'var(--good)' } : undefined}>{reason}</span>
                </span>
                <IcChevron className="tile-caret" width={18} height={18} />
              </button>
            ))}
          </div>
        </div>
      )}
      {ZONES.map((z) => (
        <div key={z.id} className="card stack-sm">
          <div className="eyebrow">{z.name}</div>
          <div className="tile-grid">
            {speciesByZone(z.id).map((s) => (
              <button key={s.id} className="tile" onClick={() => setSelId(s.id)}>
                <span className="tile-ico"><SpeciesArt id={s.id} width={34} height={20} /></span>
                <span className="tile-body">
                  <span className="tile-label">{s.name}</span>
                  <span className="tile-sub">{s.aka || z.short}</span>
                </span>
                <IcChevron className="tile-caret" width={18} height={18} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Detail({ s, data, gear, onBack }) {
  const reg = getReg(s.regsKey)
  const cr = reg?.season?.kind === 'catch-release'
  const open = cr ? true : reg ? isOpenOn(reg) : true
  const zone = ZONE_BY_ID[s.zone]
  const sst = data?.nowConditions?.sstF
  const fit = sst == null ? null : sst >= s.waterTempMinF && sst <= s.waterTempMaxF ? 'ideal' : sst < s.waterTempMinF ? 'cool' : 'warm'
  const windows = (data?.today?.windows || []).slice(0, 3)
  const needsFly = /\bfly\b|\b\d{1,2}\s?wt\b/i.test(`${(s.lures || []).join(' ')} ${s.rig}`)
  const ownsFly = (gear || []).some((g) => /fly|wt/i.test(`${g.name} ${g.category}`))
  const gearFlag = needsFly && (gear || []).length > 0 && !ownsFly
  const allCatches = useLiveQuery(() => db.catches.toArray(), [], [])
  const mine = (allCatches || []).filter((c) => matchSpecies(c.species, s))
  const myPR = mine.reduce((m, c) => (c.lengthIn != null && c.lengthIn > (m?.lengthIn ?? -1) ? c : m), null)
  const lastCaught = mine.length ? Math.max(...mine.map((c) => c.caughtAt)) : null

  return (
    <div className="stack">
      <button className="btn ghost" onClick={onBack} style={{ alignSelf: 'flex-start' }}>← Species</button>
      <header className="page-head">
        <div className="eyebrow">{zone?.name}</div>
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <span style={{ color: 'var(--accent)', flex: 'none' }}><SpeciesArt id={s.id} width={58} height={30} /></span>
          <h1 className="h1" style={{ margin: 0 }}>{s.name}</h1>
        </div>
        <div className="row wrap" style={{ gap: 8, marginTop: 6 }}>
          <span className="tag" style={{ background: 'var(--surface-2)', color: cr ? 'var(--accent)' : open ? 'var(--good)' : 'var(--caution)' }}>
            {cr ? 'Catch & release' : open ? 'In season' : 'Closed now'}
          </span>
          <span className="tag" style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}>{s.depthFtMin}–{s.depthFtMax} ft</span>
        </div>
      </header>

      <div className="card stack-sm">
        <div className="eyebrow">Today’s fit</div>
        <div className={`h2 fit-${fit || 'na'}`}>
          {sst == null ? 'Water temp unavailable' : fit === 'ideal' ? `Water ${Math.round(sst)}°F — in the zone` : `Water ${Math.round(sst)}°F — a bit ${fit}`}
        </div>
        <div className="faint" style={{ fontSize: 13 }}>Ideal {s.waterTempMinF}–{s.waterTempMaxF}°F · {s.seasonText}</div>
        {windows.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>Today’s strongest windows:</div>
            <div className="row wrap" style={{ gap: 8 }}>
              {windows.map((w, i) => <span key={i} className="chip" style={{ color: strengthColor(w.strength) }}>{fmtRange(w.start, w.end)}</span>)}
            </div>
          </div>
        )}
      </div>

      {mine.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Your record</div>
          <div className="h2">{mine.length} logged{myPR?.lengthIn ? ` · PR ${myPR.lengthIn}"` : ''}</div>
          <div className="faint" style={{ fontSize: 12 }}>{lastCaught ? `Last one ${fmtDateShort(new Date(lastCaught))}` : ''}{myPR?.lengthIn ? ` · best on ${fmtDateShort(new Date(myPR.caughtAt))}` : ''}</div>
        </div>
      )}

      <div className="card stack-sm">
        <div className="eyebrow">Rig & leader</div>
        <p style={{ fontSize: 14 }}>{s.rig}</p>
        <p className="muted" style={{ fontSize: 13 }}><strong>Leader:</strong> {s.leader}</p>
        {gearFlag && <div className="alert-banner warn" style={{ fontSize: 13 }}>This calls for fly gear — none found in your locker. Add it under Gear &amp; Boat.</div>}
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Bait & lures · matched to conditions</div>
        <div className="row wrap" style={{ gap: 8 }}>
          {(s.baits || []).map((b) => <span key={b} className="chip sel">{b}</span>)}
          {(s.lures || []).map((l) => <span key={l} className="chip">{l}</span>)}
        </div>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Technique</div>
        <p style={{ fontSize: 14 }}>{s.technique}</p>
      </div>

      <div className="card stack-sm">
        <div>
          <div className="eyebrow">Best tide</div>
          <p style={{ fontSize: 14 }}>{s.bestTide}</p>
        </div>
        <div className="divider" />
        <div>
          <div className="eyebrow">Best time</div>
          <p style={{ fontSize: 14 }}>{s.bestTime}</p>
        </div>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Captain’s edge</div>
        <p className="protip">{s.proTip}</p>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Regulations</div>
        <p className="muted" style={{ fontSize: 13 }}>{reg?.rule || 'See FWC.'}</p>
        <div className="row" style={{ gap: 8 }}>
          <Link className="btn ghost block" to="/regs">Keep checker →</Link>
          {reg && <a className="btn ghost" href={verifyUrl(reg)} target="_blank" rel="noreferrer">FWC</a>}
        </div>
      </div>
    </div>
  )
}
