import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import StatusBar from './StatusBar.jsx'
import RewardsToast from './RewardsToast.jsx'
import Onboarding from './Onboarding.jsx'
import QuickLogSheet from './QuickLogSheet.jsx'
import CommandBar from './CommandBar.jsx'
import LocationSheet from './LocationSheet.jsx'
import { IcFish, IcSearch } from './icons.jsx'

export default function Layout() {
  return (
    <div className="app">
      {/* Ocean background - same as landing page */}
      <div className="app-ocean-bg">
        <div className="ocean-depths" />
        <div className="light-rays" />
      </div>
      <Sidebar />
      <header className="topbar">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <span className="mark"><IcFish width={22} height={22} /></span>
          Keys Angler
        </Link>
        <div className="spacer" />
        <button className="icon-btn" onClick={() => window.dispatchEvent(new CustomEvent('ka-search'))} aria-label="Search" title="Search — ⌘K or /"><IcSearch width={20} height={20} /></button>
        <StatusBar />
      </header>
      <main className="content">
        <Suspense fallback={<div className="card"><div className="skeleton" style={{ height: 260 }} /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
      <CommandBar />
      <LocationSheet />
      <QuickLogSheet />
      <RewardsToast />
      <Onboarding />
    </div>
  )
}
