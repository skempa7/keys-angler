import { NavLink } from 'react-router-dom'
import { NAV_GROUPS } from '../data/nav.js'

// Mobile "More" bottom-sheet — the full grouped menu.
export default function NavDrawer({ open, onClose }) {
  return (
    <div className={`drawer ${open ? 'open' : ''}`} onClick={onClose} aria-hidden={!open}>
      <div className="drawer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        {NAV_GROUPS.map((g) => (
          <div key={g.title} className="nav-group">
            <div className="nav-group-title">{g.title}</div>
            <div className="drawer-grid">
              {g.items.map(({ to, label, Icon, end }) => (
                <NavLink key={to} to={to} end={end} className="drawer-item" onClick={onClose}>
                  <span className="drawer-ico"><Icon width={20} height={20} /></span>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
