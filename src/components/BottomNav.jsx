import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { IcHome, IcCalendar, IcFish, IcGrid, IcPlus } from './icons.jsx'
import NavDrawer from './NavDrawer.jsx'

// Mobile-only bottom bar with a raised center "+Log" (CSS hides it on desktop).
export default function BottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <>
      <nav className="bottomnav" aria-label="Primary">
        <NavLink to="/" end className="bn-item"><span className="nav-ico"><IcHome /></span>Home</NavLink>
        <NavLink to="/plan" className="bn-item"><span className="nav-ico"><IcCalendar /></span>Plan</NavLink>
        <NavLink to="/log" className="bn-log" aria-label="Log a catch">
          <span className="bn-log-btn"><IcPlus /></span>
          <span className="bn-log-label">Log</span>
        </NavLink>
        <NavLink to="/target" className="bn-item"><span className="nav-ico"><IcFish /></span>Target</NavLink>
        <button className="bn-item" onClick={() => setDrawerOpen(true)}><span className="nav-ico"><IcGrid /></span>More</button>
      </nav>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
