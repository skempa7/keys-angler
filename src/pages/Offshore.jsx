import { useConditions } from '../hooks/useConditions.js'
import { compass } from '../utils/format.js'
import { IcSun, IcWaves, IcStorm } from '../components/icons.jsx'

// Qualitative dolphin/blue-water game-plan. No keyless realtime sargassum or Gulf
// Stream feed exists, so this is a captain's heuristic keyed to today's wind + SST,
// with an optional one-tap link to NOAA's sea-surface viewer.
const OCT = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const octant = (deg) => (deg == null ? null : OCT[Math.round(deg / 45) % 8])

function windRead(oct, kn) {
  if (oct == null) return { head: 'Wind unknown', body: 'Pull a fresh forecast on WiFi to plan the run.' }
  if (oct === 'NW' || oct === 'N') return { head: `${oct} — post-frontal`, body: 'Cold push behind a front: water dirties and weed scatters, but kingfish & sails love the NW. Run the down-sea edges and hunt any seam of clean blue against the green.' }
  if (oct === 'NE' || oct === 'E' || oct === 'SE') return { head: `${oct} — the prevailing setup`, body: 'Weed lines and bait stack on the down-sea side and run roughly NW–SE. Push out to the color change, then troll the weed edge and pitch live bait to anything holding.' }
  if (oct === 'S' || oct === 'SW') return { head: `${oct} — warm & slick`, body: 'Often glassy and warm. Cover water: hunt frigatebirds and isolated weed patches & debris over the deep break; the bite is run-and-gun, not a single line.' }
  return { head: `${oct} — light & variable`, body: 'Glassy. Sight-run for floating debris, turtles, and tailing dolphin; a single board or pallet can hold a school. Keep pitch baits ready.' }
}

const Section = ({ icon, title, children }) => (
  <div className="card stack-sm">
    <div className="eyebrow">{icon}{title}</div>
    {children}
  </div>
)

export default function Offshore() {
  const { data } = useConditions({ days: 1 })
  const c = data?.nowConditions || {}
  const oct = octant(c.windDir)
  const read = windRead(oct, c.windKn)
  const sst = c.sstF
  const sstNote = sst == null ? '' : sst < 75 ? 'Cooler than dolphin like — work the warmest blue you can find.' : sst > 84 ? 'Warm — fish early, find moving water and shade lines.' : 'Right in the dolphin band — find the edge and they should be on it.'

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Offshore</div>
        <h1 className="h1">Dolphin game-plan</h1>
        <p className="muted">Blue water is a hunt, not a spot — read the wind, the weed, the birds, and the edge.</p>
      </header>

      <div className="card raised stack-sm">
        <div className="row between">
          <div className="eyebrow">Today's read</div>
          <span className="tag" style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}>{c.windKn != null ? `${Math.round(c.windKn)} kn ${compass(c.windDir)}` : 'no wind data'}</span>
        </div>
        <div className="h2">{read.head}</div>
        <p className="muted" style={{ fontSize: 14 }}>{read.body}</p>
        {sstNote && <p className="faint" style={{ fontSize: 13 }}>Water ~{sst != null ? `${Math.round(sst)}°F` : '—'} · {sstNote}</p>}
      </div>

      <Section icon={<IcWaves width={14} height={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />} title="Weed & color change">
        <p className="muted" style={{ fontSize: 14 }}>Start at the first break (~120–250 ft) and look for the green-to-blue color change. Troll the weed edge and any current rip; the bait — and the dolphin — sit on the up-current face. Work it, don't blow through it.</p>
      </Section>

      <Section icon={<IcSun width={14} height={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />} title="Birds tell you everything">
        <ul className="rules-list">
          <li><b>High & circling</b> — bait pushed up, fish under them. Run to them.</li>
          <li><b>Low & sitting</b> — nothing yet; keep moving.</li>
          <li><b>Frigates working a weed line</b> — slow down and fish it hard.</li>
        </ul>
      </Section>

      <Section icon={<IcWaves width={14} height={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />} title="Live-bait care">
        <ul className="rules-list">
          <li>Keep the well flowing & shaded — hot, still water kills bait fast.</li>
          <li>Cull dead baits; one rolls and fouls the rest.</li>
          <li>Rig 2–3 spinning rods with light fluoro to pitch the second a fish lights up.</li>
          <li>Hooked one? Leave it in the water — schoolies follow it to the boat.</li>
        </ul>
      </Section>

      <div className="card quiet stack-sm">
        <div className="eyebrow"><IcStorm width={14} height={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />Honest note</div>
        <p className="faint" style={{ fontSize: 13 }}>There's no free, no-signal feed for live sargassum or the exact Gulf Stream edge — this is a heuristic off today's wind & water. On WiFi, NOAA's sea-surface viewer shows the real color break.</p>
        <a className="btn ghost block" href="https://oceanview.pfeg.noaa.gov/erddap/index.html" target="_blank" rel="noreferrer">Open NOAA sea-surface viewer ↗</a>
      </div>
    </div>
  )
}
