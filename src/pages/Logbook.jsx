import { useRewards } from '../hooks/useRewards.js'
import { fmtDateShort } from '../utils/format.js'
import { IcTrophy } from '../components/icons.jsx'

export default function Logbook() {
  const r = useRewards()
  const c = r.counts
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
              <div className="badge-ico">{b.icon}</div>
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
