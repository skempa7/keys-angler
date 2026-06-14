import { stoneCrabStatus, HARVEST_AS_OF } from '../data/harvest.js'
import SeasonBadge from '../components/SeasonBadge.jsx'
import RulesList from '../components/RulesList.jsx'
import Spots from '../components/Spots.jsx'
import TrapTracker from '../components/TrapTracker.jsx'

export default function StoneCrab() {
  const status = stoneCrabStatus()
  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Trapping</div>
        <h1 className="h1">Stone Crab</h1>
        <p className="muted">Menippe mercenaria — the Keys claw fishery.</p>
      </header>

      <SeasonBadge status={status} />

      <div className="card stack-sm">
        <div className="eyebrow">Rules</div>
        <RulesList rules={status.rules} />
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Trap-placement helper</div>
        <p className="muted" style={{ fontSize: 14 }}>
          Target <strong>hard/rocky bottom, pavement &amp; patch-reef edges in ~1–30 ft</strong>, next to structure or relief.
          Avoid continuous seagrass and bare sand. Habitat narrows good <em>water</em> — it doesn’t guarantee a spot,
          so mark what actually produces and let your own track record rank them.
        </p>
        <p className="faint" style={{ fontSize: 12 }}>
          A full bottom-type map overlay (FWC reef habitat + NOAA depth) is wired for a later update; for now the rules above + your marked spots do the work offline.
        </p>
      </div>

      <TrapTracker />

      <Spots kind="crab" title="Your crab spots" />

      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        Verified {HARVEST_AS_OF}. <a href={status.source} target="_blank" rel="noreferrer">Verify at FWC →</a>
      </p>
    </div>
  )
}
