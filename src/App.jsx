import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Placeholder from './components/Placeholder.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BiteTimes from './pages/BiteTimes.jsx'
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

// Router basename so deep links work under the GitHub Pages subpath (/keys-angler/).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={basename || '/'}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="bite" element={<BiteTimes />} />
          <Route path="plan" element={<TripPlanner />} />
          <Route path="target" element={<Species />} />
          <Route path="regs" element={<Regs />} />
          <Route path="log" element={<CatchLog />} />
          <Route path="crab" element={<StoneCrab />} />
          <Route path="lobster" element={<Lobster />} />
          <Route path="shrimp" element={<Shrimp />} />
          <Route path="gear" element={<GearLocker />} />
          <Route path="slam" element={<GrandSlam />} />
          <Route path="more" element={<More />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Placeholder title="Not found" icon="🧭" note="That screen doesn't exist yet." />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
