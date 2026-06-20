import { useSearchParams } from 'react-router-dom'
import Segmented from '../components/Segmented.jsx'
import CleaningTable from './CleaningTable.jsx'
import StoneCrab from './StoneCrab.jsx'
import Lobster from './Lobster.jsx'
import Shrimp from './Shrimp.jsx'

// Harvest hub — the crustacean seasons + the cleaning-table calculator, one place.
const TABS = [
  { key: 'cleaning', label: 'Cleaning Table', C: CleaningTable },
  { key: 'crab', label: 'Stone Crab', C: StoneCrab },
  { key: 'lobster', label: 'Spiny Lobster', C: Lobster },
  { key: 'shrimp', label: 'Shrimp', C: Shrimp },
]

export default function HarvestHub() {
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
