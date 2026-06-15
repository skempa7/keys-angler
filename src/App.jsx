import { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Placeholder from './components/Placeholder.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BiteTimes from './pages/BiteTimes.jsx'
import Calendar from './pages/Calendar.jsx'
import TripPlanner from './pages/TripPlanner.jsx'
import Species from './pages/Species.jsx'
import Regs from './pages/Regs.jsx'
import More from './pages/More.jsx'
import StoneCrab from './pages/StoneCrab.jsx'
import Lobster from './pages/Lobster.jsx'
import Shrimp from './pages/Shrimp.jsx'
import CatchLog from './pages/CatchLog.jsx'
import GearLocker from './pages/GearLocker.jsx'
import GrandSlam from './pages/GrandSlam.jsx'
import Settings from './pages/Settings.jsx'
import Logbook from './pages/Logbook.jsx'
import TripLog from './pages/TripLog.jsx'
import Recap from './pages/Recap.jsx'
import Patterns from './pages/Patterns.jsx'
import Offshore from './pages/Offshore.jsx'
import Knots from './pages/Knots.jsx'
import Tournament from './pages/Tournament.jsx'
import Compass from './pages/Compass.jsx'
import Crossings from './pages/Crossings.jsx'
import CleaningTable from './pages/CleaningTable.jsx'
import DriftAnchor from './pages/DriftAnchor.jsx'
import OnWater from './pages/OnWater.jsx'

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
          <Route path="bite" element={<BiteTimes />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="plan" element={<TripPlanner />} />
          <Route path="target" element={<Species />} />
          <Route path="regs" element={<Regs />} />
          <Route path="log" element={<CatchLog />} />
          <Route path="trips" element={<TripLog />} />
          <Route path="recap" element={<Recap />} />
          <Route path="patterns" element={<Patterns />} />
          <Route path="offshore" element={<Offshore />} />
          <Route path="knots" element={<Knots />} />
          <Route path="tournament" element={<Tournament />} />
          <Route path="compass" element={<Compass />} />
          <Route path="crossings" element={<Crossings />} />
          <Route path="cleaning" element={<CleaningTable />} />
          <Route path="drift" element={<DriftAnchor />} />
          <Route path="crab" element={<StoneCrab />} />
          <Route path="lobster" element={<Lobster />} />
          <Route path="shrimp" element={<Shrimp />} />
          <Route path="gear" element={<GearLocker />} />
          <Route path="slam" element={<GrandSlam />} />
          <Route path="map" element={<MapSpots />} />
          <Route path="logbook" element={<Logbook />} />
          <Route path="more" element={<More />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Placeholder title="Not found" icon="🧭" note="That screen doesn't exist yet." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
