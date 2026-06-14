import { NavLink } from 'react-router-dom'
import { NAV_GROUPS } from '../data/nav.js'
import { IcFish } from './icons.jsx'

// Desktop-only grouped sidebar (CSS hides it under 880px).
export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Primary">
      <div className="sidebar-brand">
        <span className="mark"><IcFish width={22} height={22} /></span>
        Keys Angler
      </div>
      <div className="sidebar-scroll">
        {NAV_GROUPS.map((g) => (
          <div key={g.title} className="nav-group">
            <div className="nav-group-title">{g.title}</div>
            {g.items.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="nav-link">
                <span className="nav-ico"><Icon width={20} height={20} /></span>
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}
