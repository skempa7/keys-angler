import { useSearchParams } from 'react-router-dom'
import Segmented from '../components/Segmented.jsx'
import CatchLog from './CatchLog.jsx'
import TripLog from './TripLog.jsx'
import Patterns from './Patterns.jsx'
import Recap from './Recap.jsx'
import Logbook from './Logbook.jsx'
import GrandSlam from './GrandSlam.jsx'
import Tournament from './Tournament.jsx'

// Logbook hub — everything you've recorded: catches, trips, patterns, the season
// recap, badges, the Grand Slam tracker, and tournament prep.
const TABS = [
  { key: 'catches', label: 'Catches', C: CatchLog },
  { key: 'trips', label: 'Trips', C: TripLog },
  { key: 'patterns', label: 'Patterns', C: Patterns },
  { key: 'recap', label: 'Season Recap', C: Recap },
  { key: 'badges', label: 'Badges', C: Logbook },
  { key: 'slam', label: 'Grand Slam', C: GrandSlam },
  { key: 'tournament', label: 'Tournament', C: Tournament },
]

export default function LogbookHub() {
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
