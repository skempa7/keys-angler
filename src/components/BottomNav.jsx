import { NavLink } from 'react-router-dom'
import { IcHome, IcCalendar, IcFish, IcBook, IcGrid } from './icons.jsx'

const TABS = [
  { to: '/', label: 'Should I Go', Icon: IcHome, end: true },
  { to: '/plan', label: 'Plan', Icon: IcCalendar },
  { to: '/target', label: 'Target', Icon: IcFish },
  { to: '/log', label: 'Catch Log', Icon: IcBook },
  { to: '/more', label: 'More', Icon: IcGrid },
]

export default function BottomNav() {
  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav-brand">
        <span className="mark">
          <IcFish width={22} height={22} />
        </span>
        Keys Angler
      </div>
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end}>
          <span className="nav-ico">
            <Icon />
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
