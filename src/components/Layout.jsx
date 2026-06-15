import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import StatusBar from './StatusBar.jsx'
import RewardsToast from './RewardsToast.jsx'
import Onboarding from './Onboarding.jsx'
import QuickLogSheet from './QuickLogSheet.jsx'
import { IcFish } from './icons.jsx'

export default function Layout() {
  return (
    <div className="app">
      <Sidebar />
      <header className="topbar">
        <div className="brand">
          <span className="mark"><IcFish width={22} height={22} /></span>
          Keys Angler
        </div>
        <div className="spacer" />
        <StatusBar />
      </header>
      <main className="content">
        <Suspense fallback={<div className="card"><div className="skeleton" style={{ height: 260 }} /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
      <QuickLogSheet />
      <RewardsToast />
      <Onboarding />
    </div>
  )
}
