import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { IcHome, IcCalendar, IcPlus, IcGrid } from './icons.jsx'
import { NAV_GROUPS } from '../data/nav.js'
import NavDrawer from './NavDrawer.jsx'

// The 4th slot is adaptive: it becomes whatever page you last opened from "More",
// so your current focus is one tap away. Defaults to Target.
const ALL = NAV_GROUPS.flatMap((g) => g.items)
const PINNED = new Set(['/', '/plan', '/log']) // always-present bottom slots
const DEFAULT_SLOT = '/target'
const byPath = (p) => ALL.find((i) => i.to === p)
// Compact labels that fit the tiny slot.
const SHORT = {
  '/target': 'Target', '/bite': 'Bite', '/calendar': 'Calendar', '/map': 'Map', '/offshore': 'Offshore',
  '/compass': 'Compass', '/log': 'Catch', '/trips': 'Trips', '/slam': 'Slam', '/tournament': 'Tourney',
  '/logbook': 'Logbook', '/recap': 'Recap', '/patterns': 'Patterns', '/crab': 'Crab', '/lobster': 'Lobster',
  '/shrimp': 'Shrimp', '/gear': 'Gear', '/knots': 'Knots', '/regs': 'Regs', '/settings': 'Settings',
}

export default function BottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pathname } = useLocation()
  const [slot, setSlot] = useState(() => { try { return localStorage.getItem('ka_navslot') || DEFAULT_SLOT } catch { return DEFAULT_SLOT } })

  // Remember the most recent non-pinned page you land on (i.e. opened from More).
  useEffect(() => {
    if (PINNED.has(pathname)) return
    const item = byPath(pathname)
    if (item) { setSlot(item.to); try { localStorage.setItem('ka_navslot', item.to) } catch { /* no storage */ } }
  }, [pathname])

  const adaptive = byPath(slot) || byPath(DEFAULT_SLOT)
  const AdIcon = adaptive.Icon

  return (
    <>
      <nav className="bottomnav" aria-label="Primary">
        <NavLink to="/" end className="bn-item"><span className="nav-ico"><IcHome /></span>Home</NavLink>
        <NavLink to="/plan" className="bn-item"><span className="nav-ico"><IcCalendar /></span>Plan</NavLink>
        <button type="button" className="bn-log" aria-label="Log a catch — one tap" onClick={() => window.dispatchEvent(new CustomEvent('ka-quicklog'))}>
          <span className="bn-log-btn"><IcPlus /></span>
          <span className="bn-log-label">Log</span>
        </button>
        <NavLink to={adaptive.to} end={adaptive.end} className="bn-item"><span className="nav-ico"><AdIcon /></span>{SHORT[adaptive.to] || adaptive.label}</NavLink>
        <button className="bn-item" onClick={() => setDrawerOpen(true)}><span className="nav-ico"><IcGrid /></span>More</button>
      </nav>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
