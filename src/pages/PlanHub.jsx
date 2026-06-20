import { useSearchParams } from 'react-router-dom'
import Segmented from '../components/Segmented.jsx'
import TripPlanner from './TripPlanner.jsx'
import Calendar from './Calendar.jsx'
import BiteTimes from './BiteTimes.jsx'

// Plan hub — plan a trip, scan the month calendar, and study today's bite windows.
const TABS = [
  { key: 'trip', label: 'Trip Plan', C: TripPlanner },
  { key: 'calendar', label: 'Calendar', C: Calendar },
  { key: 'bite', label: 'Bite Times', C: BiteTimes },
]

export default function PlanHub() {
  const [sp, setSp] = useSearchParams()
  const active = TABS.some((t) => t.key === sp.get('tab')) ? sp.get('tab') : TABS[0].key
  const Active = TABS.find((t) => t.key === active).C
  return (
    <div className="stack">
      <Segmented tabs={TABS} active={active} onChange={(k) => setSp(k === TABS[0].key ? {} : { tab: k }, { replace: true })} />
      <Active />
    </div>
  )
}
