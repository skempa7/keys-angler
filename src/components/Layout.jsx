import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import StatusBar from './StatusBar.jsx'
import { IcFish } from './icons.jsx'

export default function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark">
            <IcFish width={22} height={22} />
          </span>
          Keys Angler
        </div>
        <div className="spacer" />
        <StatusBar />
      </header>
      <main className="content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
