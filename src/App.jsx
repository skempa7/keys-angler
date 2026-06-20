import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Placeholder from './components/Placeholder.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Species from './pages/Species.jsx'
import Regs from './pages/Regs.jsx'
import More from './pages/More.jsx'
import CatchLog from './pages/CatchLog.jsx'
import GearLocker from './pages/GearLocker.jsx'
import Settings from './pages/Settings.jsx'
import Offshore from './pages/Offshore.jsx'
import Knots from './pages/Knots.jsx'
import Compass from './pages/Compass.jsx'
import Crossings from './pages/Crossings.jsx'
import DriftAnchor from './pages/DriftAnchor.jsx'
import OnWater from './pages/OnWater.jsx'
import FishTales from './pages/FishTales.jsx'
// Hubs — several pages folded behind one tabbed surface each.
import PlanHub from './pages/PlanHub.jsx'
import LogbookHub from './pages/LogbookHub.jsx'
import HarvestHub from './pages/HarvestHub.jsx'

// Code-split the map page so Leaflet stays out of the initial bundle.
const MapSpots = lazy(() => import('./pages/MapSpots.jsx'))

// Router basename so deep links work under the GitHub Pages subpath (/keys-angler/).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={basename || '/'}>
      <Routes>
        {/* Full-screen takeover — no sidebar/bottom-nav chrome. */}
        <Route path="onwater" element={<OnWater />} />
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="app" element={<Navigate to="/" replace />} />
          <Route path="landing" element={<Navigate to="/" replace />} />
          {/* Hubs */}
          <Route path="plan" element={<PlanHub />} />
          <Route path="logbook" element={<LogbookHub />} />
          <Route path="harvest" element={<HarvestHub />} />
          {/* Standalone screens */}
          <Route path="target" element={<Species />} />
          <Route path="regs" element={<Regs />} />
          <Route path="log" element={<CatchLog />} />
          <Route path="offshore" element={<Offshore />} />
          <Route path="knots" element={<Knots />} />
          <Route path="compass" element={<Compass />} />
          <Route path="crossings" element={<Crossings />} />
          <Route path="drift" element={<DriftAnchor />} />
          <Route path="gear" element={<GearLocker />} />
          <Route path="map" element={<MapSpots />} />
          <Route path="tales" element={<FishTales />} />
          <Route path="more" element={<More />} />
          <Route path="settings" element={<Settings />} />
          {/* Folded routes → redirect into their hub (keeps deep links & bookmarks alive) */}
          <Route path="bite" element={<Navigate to="/plan?tab=bite" replace />} />
          <Route path="calendar" element={<Navigate to="/plan?tab=calendar" replace />} />
          <Route path="trips" element={<Navigate to="/logbook?tab=trips" replace />} />
          <Route path="patterns" element={<Navigate to="/logbook?tab=patterns" replace />} />
          <Route path="recap" element={<Navigate to="/logbook?tab=recap" replace />} />
          <Route path="slam" element={<Navigate to="/logbook?tab=slam" replace />} />
          <Route path="tournament" element={<Navigate to="/logbook?tab=tournament" replace />} />
          <Route path="cleaning" element={<Navigate to="/harvest?tab=cleaning" replace />} />
          <Route path="crab" element={<Navigate to="/harvest?tab=crab" replace />} />
          <Route path="lobster" element={<Navigate to="/harvest?tab=lobster" replace />} />
          <Route path="shrimp" element={<Navigate to="/harvest?tab=shrimp" replace />} />
          <Route path="*" element={<Placeholder title="Not found" icon="🧭" note="That screen doesn't exist yet." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
