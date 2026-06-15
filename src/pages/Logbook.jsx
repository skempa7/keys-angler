import { useLiveQuery } from 'dexie-react-hooks'
import { useRewards } from '../hooks/useRewards.js'
import { db } from '../db/db.js'
import { calibration } from '../engine/personalEdge.js'
import { buildCalibration } from '../engine/biteCalibration.js'
import { fmtDateShort } from '../utils/format.js'
import { IcTrophy, IcFish, IcStar, IcWaves, IcMap, IcMedal, IcHook, IcPin } from '../components/icons.jsx'

const BADGE_ICON = {
  first: IcHook, ten: IcFish, century: IcMedal, 'five-species': IcWaves, 'ten-species': IcFish,
  grand: IcTrophy, backcountry: IcMedal, reef: IcWaves, tarpon: IcFish, bone: IcFish, permit: IcStar,
  planner: IcMap, spotter: IcPin,
}

export default function Logbook() {
  const r = useRewards()
  const c = r.counts
  const catches = useLiveQuery(() => db.catches.toArray(), [], [])
  const cal = calibration(catches || [])
  const bc = buildCalibration(catches || [])
  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Logbook</div>
        <h1 className="h1">Your record</h1>
      </header>

      <div className="card rank-card">
        <div className="row between">
          <div><div className="eyebrow">Rank</div><div className="rank-name">{r.rank}</div></div>
          <div style={{ textAlign: 'right' }}><div className="eyebrow">XP</div><div className="rank-xp">{r.xp}</div></div>
        </div>
        <div className="xp-bar"><i style={{ width: `${Math.round(r.progress * 100)}%` }} /></div>
        <div className="faint" style={{ fontSize: 12 }}>
          {r.nextRank ? `${r.nextAt - r.xp} XP to ${r.nextRank}` : 'Top rank — Conch 🐚'}
        </div>
      </div>

      {cal && (
        <div className="card stack-sm">
          <div className="row between">
            <div className="eyebrow">Calibration · does the score rank your fish?</div>
            <span className="tag" style={{ background: 'var(--surface-2)', color: bc.gated ? 'var(--good)' : 'var(--text-faint)' }}>{bc.tier}</span>
          </div>
          <div className="rank-name">{cal.pctGood}%<span className="faint" style={{ fontSize: 18 }}> of your fish on a Good+ score</span></div>
          <div className="muted" style={{ fontSize: 13 }}>
            The score ranks your productive moments well — this is a ranking stat, not a hit-rate (blanks aren't logged).{' '}
            {bc.gated
              ? `Forecast now tuned to your water from ${bc.n} fish across ${bc.nEff} days.`
              : `Log fish across ${bc.need} days (${bc.nEff}/${bc.need} so far) and the forecast starts tuning to you.`}
          </div>
        </div>
      )}

      <div className="grid cols-2">
        <div className="card stat"><div className="eyebrow">Catches</div><div className="stat-main">{c.catches}</div></div>
        <div className="card stat"><div className="eyebrow">Species</div><div className="stat-main">{c.species}</div></div>
        <div className="card stat"><div className="eyebrow">Slams</div><div className="stat-main">{c.slams}</div></div>
        <div className="card stat"><div className="eyebrow">Badges</div><div className="stat-main">{r.earnedCount}<span className="faint" style={{ fontSize: 16 }}>/{r.badges.length}</span></div></div>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Badges</div>
        <div className="badge-grid">
          {r.badges.map((b) => (
            <div key={b.id} className={`badge ${b.earned ? 'earned' : ''}`} title={b.desc}>
              <div className="badge-ico">{(() => { const Ic = BADGE_ICON[b.id] || IcStar; return <Ic width={26} height={26} /> })()}</div>
              <div className="badge-name">{b.name}</div>
              <div className="badge-desc">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {r.slams.length > 0 && (
        <div className="card stack-sm">
          <div className="eyebrow">Slam history</div>
          {r.slams.map((s, i) => (
            <div key={i} className="row" style={{ gap: 8 }}>
              <span style={{ color: 'var(--gold)' }}><IcTrophy width={18} height={18} /></span>
              <span style={{ flex: 1 }}>{s.slamName}</span>
              <span className="faint" style={{ fontSize: 12 }}>{fmtDateShort(s.date)}</span>
            </div>
          ))}
        </div>
      )}

      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        XP comes from logging — catches, new species, slams, spots, trips, and showing up. Just for fun; nothing leaves your phone.
      </p>
    </div>
  )
}
