import { lobsterStatus, HARVEST_AS_OF } from '../data/harvest.js'
import SeasonBadge from '../components/SeasonBadge.jsx'
import RulesList from '../components/RulesList.jsx'
import Spots from '../components/Spots.jsx'
import { fmtDateShort } from '../utils/format.js'

export default function Lobster() {
  const status = lobsterStatus()
  const mini = status.miniSeason
  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Diving & bully-netting</div>
        <h1 className="h1">Spiny Lobster</h1>
        <p className="muted">Panulirus argus — Monroe County rules (the strict ones).</p>
      </header>

      <SeasonBadge status={status} />

      <div className="card stack-sm">
        <div className="eyebrow">July mini-season</div>
        <div className="h2">{fmtDateShort(mini.start)} – {fmtDateShort(mini.end)}</div>
        <p className="muted" style={{ fontSize: 13 }}>
          Last consecutive Wed/Thu of July. In Monroe &amp; Biscayne NP the bag is the stricter <strong>6 per person/day</strong>,
          and <strong>night diving is prohibited</strong> during the 2-day sport season.
        </p>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Rules</div>
        <RulesList rules={status.rules} />
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Where & how (Upper Keys)</div>
        <p className="muted" style={{ fontSize: 14 }}>
          Work patch reefs, ledges, and hard-bottom holes in <strong>8–35 ft</strong> on the Hawk Channel / reef side; look for antennae
          under coral heads and ledges. Bully-net the flats &amp; channel edges at night on a moving tide. Mind the no-take zones
          (Pennekamp during sport season, Sanctuary SPAs, the Lobster Sanctuary).
        </p>
      </div>

      <Spots kind="lobster" title="Your lobster spots" bottoms={['Patch reef', 'Ledge', 'Hard bottom', 'Coral head', 'Channel edge']} />

      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        Verified {HARVEST_AS_OF}. <a href={status.source} target="_blank" rel="noreferrer">Verify at FWC →</a>
      </p>
    </div>
  )
}
