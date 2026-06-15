import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import StatusBar from './StatusBar.jsx'
import RewardsToast from './RewardsToast.jsx'
import Onboarding from './Onboarding.jsx'
import QuickLogSheet from './QuickLogSheet.jsx'
import SkyBackground from './SkyBackground.jsx'
import CommandBar from './CommandBar.jsx'
import { IcFish, IcSearch } from './icons.jsx'

export default function Layout() {
  return (
    <div className="app">
      <SkyBackground />
      <Sidebar />
      <header className="topbar">
        <div className="brand">
          <span className="mark"><IcFish width={22} height={22} /></span>
          Keys Angler
        </div>
        <div className="spacer" />
        <button className="icon-btn" onClick={() => window.dispatchEvent(new CustomEvent('ka-search'))} aria-label="Search"><IcSearch width={20} height={20} /></button>
        <StatusBar />
      </header>
      <main className="content">
        <Suspense fallback={<div className="card"><div className="skeleton" style={{ height: 260 }} /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
      <CommandBar />
      <QuickLogSheet />
      <RewardsToast />
      <Onboarding />
    </div>
  )
}
