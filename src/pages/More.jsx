import { Link } from 'react-router-dom'
import {
  IcShield, IcLobster, IcAnchor, IcCog, IcFish, IcChevron, IcBook, IcCalendar,
} from '../components/icons.jsx'

const ITEMS = [
  { to: '/plan', label: 'Plan', sub: 'Trip · calendar · bite times', Icon: IcCalendar },
  { to: '/target', label: 'Target a Species', sub: 'Rig, bait, zone & timing', Icon: IcFish },
  { to: '/logbook', label: 'Logbook', sub: 'Catches, trips, records, recap', Icon: IcBook },
  { to: '/harvest', label: 'Harvest', sub: 'Crab, lobster, shrimp, cleaning', Icon: IcLobster },
  { to: '/regs', label: 'Regulations', sub: 'Keep checker + limits', Icon: IcShield },
  { to: '/gear', label: 'Gear & Boat Locker', sub: 'Your tackle & vessel', Icon: IcAnchor },
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
