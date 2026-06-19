import { Link } from 'react-router-dom'
import {
  IcMoon, IcShield, IcCrab, IcLobster, IcShrimp, IcAnchor, IcTrophy, IcCog, IcFish, IcChevron, IcBook,
} from '../components/icons.jsx'

const ITEMS = [
  { to: '/bite', label: 'Bite Times', sub: 'Solunar + tide windows', Icon: IcMoon },
  { to: '/target', label: 'Target a Species', sub: 'Rig, bait, zone & timing', Icon: IcFish },
  { to: '/regs', label: 'Regulations', sub: 'Keep checker + limits', Icon: IcShield },
  { to: '/crab', label: 'Stone Crab', sub: 'Season + trap placement', Icon: IcCrab },
  { to: '/lobster', label: 'Spiny Lobster', sub: 'Mini-season + rules', Icon: IcLobster },
  { to: '/shrimp', label: 'Shrimp', sub: 'Windows & conditions', Icon: IcShrimp },
  { to: '/gear', label: 'Gear & Boat Locker', sub: 'Your tackle & vessel', Icon: IcAnchor },
  { to: '/slam', label: 'Islamorada Grand Slam', sub: 'Track tarpon+bone+permit', Icon: IcTrophy },
  { to: '/tales', label: 'Fish Tales', sub: 'Keys lore + Old Salt mode', Icon: IcBook },
  { to: '/settings', label: 'Settings', sub: 'Location, units, data', Icon: IcCog },
]

export default function More() {
  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Keys Angler</div>
        <h1 className="h1">All modules</h1>
      </header>
      <div className="tile-grid">
        {ITEMS.map(({ to, label, sub, Icon }) => (
          <Link key={to} to={to} className="tile">
            <span className="tile-ico"><Icon /></span>
            <span className="tile-body">
              <span className="tile-label">{label}</span>
              <span className="tile-sub">{sub}</span>
            </span>
            <IcChevron className="tile-caret" width={18} height={18} />
          </Link>
        ))}
      </div>
    </div>
  )
}
