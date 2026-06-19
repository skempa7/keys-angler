import { Link } from 'react-router-dom'
import {
  IcFish, IcCalendar, IcMoon, IcMap, IcShield, IcClock, IcWaves, IcAnchor,
  IcHome, IcBook, IcHook, IcTrophy, IcStar, IcCrab, IcLobster, IcShrimp,
  IcFlame, IcGrid, IcGear, IcMedal, IcPin, IcKnife, IcDrift, IcSun
} from '../components/icons.jsx'
import '../styles/landing.css'

// Navigation sections for the landing page
const SECTIONS = [
  {
    title: 'On the Water',
    desc: 'Real-time conditions, bite windows, and trip planning',
    items: [
      { to: '/app', label: 'Should I Go?', desc: 'Live bite score & conditions', Icon: IcHome },
      { to: '/onwater', label: 'On-Water Mode', desc: 'Big, glanceable cockpit', Icon: IcWaves },
      { to: '/drift', label: 'Drift or Anchor', desc: 'Wind & drift calculator', Icon: IcDrift },
      { to: '/bite', label: 'Bite Times', desc: 'Solunar & tide windows', Icon: IcMoon },
      { to: '/plan', label: 'Trip Planner', desc: 'Multi-day forecasts', Icon: IcCalendar },
      { to: '/calendar', label: 'Calendar', desc: 'Month outlook view', Icon: IcClock },
      { to: '/map', label: 'Map & Spots', desc: 'Interactive fishing map', Icon: IcMap },
      { to: '/offshore', label: 'Offshore Plan', desc: 'Deep water intel', Icon: IcSun },
      { to: '/crossings', label: 'Bar Crossings', desc: 'Safety & timing', Icon: IcShield },
      { to: '/compass', label: 'Compass', desc: 'Heading reference', Icon: IcPin },
    ],
  },
  {
    title: 'Catch',
    desc: 'Log your catches, track patterns, and chase slams',
    items: [
      { to: '/target', label: 'Target Species', desc: '40+ species intel', Icon: IcFish },
      { to: '/log', label: 'Catch Log', desc: 'Quick one-tap logging', Icon: IcHook },
      { to: '/trips', label: 'Trip Log', desc: 'Past trip history', Icon: IcBook },
      { to: '/slam', label: 'Grand Slam', desc: 'Track your slam', Icon: IcTrophy },
      { to: '/tournament', label: 'Tournament', desc: 'Competition scoreboard', Icon: IcMedal },
      { to: '/logbook', label: 'Logbook', desc: 'Full catch journal', Icon: IcStar },
      { to: '/recap', label: 'Season Recap', desc: 'Year in review', Icon: IcFlame },
      { to: '/patterns', label: 'Patterns', desc: 'What\'s working now', Icon: IcGrid },
    ],
  },
  {
    title: 'Harvest',
    desc: 'Stone crab, lobster, shrimp, and cleaning calculator',
    items: [
      { to: '/cleaning', label: 'Cleaning Table', desc: 'Yield calculator', Icon: IcKnife },
      { to: '/crab', label: 'Stone Crab', desc: 'Season & regs', Icon: IcCrab },
      { to: '/lobster', label: 'Spiny Lobster', desc: 'Season & regs', Icon: IcLobster },
      { to: '/shrimp', label: 'Shrimp', desc: 'Bait & harvest', Icon: IcShrimp },
    ],
  },
  {
    title: 'Yours',
    desc: 'Your gear, knots, regulations, and settings',
    items: [
      { to: '/gear', label: 'Gear & Boat', desc: 'Tackle & setup', Icon: IcAnchor },
      { to: '/knots', label: 'Knots & Rigs', desc: 'Step-by-step guides', Icon: IcGear },
      { to: '/regs', label: 'Regulations', desc: 'Size & bag limits', Icon: IcShield },
      { to: '/settings', label: 'Settings', desc: 'Preferences & data', Icon: IcGear },
    ],
  },
]

export default function Landing() {
  return (
    <div className="landing">
      {/* Animated ocean background */}
      <div className="ocean-bg">
        <div className="ocean-depths" />
        <div className="light-rays" />
        <div className="bubbles" />
        {/* Fish layers at different depths */}
        <div className="fish-layer fish-far">
          <svg className="fish f1" viewBox="0 0 48 24"><path d="M3 12c4-5 11-5 15-2.5 2 1 4 2.5 5 2.5-1 0-3 1.5-5 2.5C14 18 7 17 3 12Z" fill="rgba(120,180,200,0.4)"/><ellipse cx="4" cy="12" rx="2" ry="4" fill="rgba(120,180,200,0.3)"/><circle cx="15" cy="10" r="1" fill="rgba(60,100,120,0.5)"/></svg>
          <svg className="fish f2" viewBox="0 0 48 24"><path d="M3 12c4-5 11-5 15-2.5 2 1 4 2.5 5 2.5-1 0-3 1.5-5 2.5C14 18 7 17 3 12Z" fill="rgba(100,160,180,0.35)"/><ellipse cx="4" cy="12" rx="2" ry="4" fill="rgba(100,160,180,0.25)"/><circle cx="15" cy="10" r="1" fill="rgba(50,80,100,0.4)"/></svg>
          <svg className="fish f3" viewBox="0 0 48 24"><path d="M3 12c4-5 11-5 15-2.5 2 1 4 2.5 5 2.5-1 0-3 1.5-5 2.5C14 18 7 17 3 12Z" fill="rgba(130,190,210,0.3)"/><ellipse cx="4" cy="12" rx="2" ry="4" fill="rgba(130,190,210,0.2)"/><circle cx="15" cy="10" r="1" fill="rgba(70,110,130,0.35)"/></svg>
        </div>
        <div className="fish-layer fish-mid">
          <svg className="fish f4" viewBox="0 0 56 28"><path d="M4 14c5-6 12-5 17-3 2 1 4 3 6 3-2 0-4 2-6 3-5 3-12 4-17-3Z" fill="rgba(54,224,240,0.28)"/><ellipse cx="5" cy="14" rx="2.5" ry="5" fill="rgba(54,224,240,0.2)"/><circle cx="17" cy="11" r="1.2" fill="rgba(30,150,170,0.5)"/></svg>
          <svg className="fish f5" viewBox="0 0 56 28"><path d="M4 14c5-6 12-5 17-3 2 1 4 3 6 3-2 0-4 2-6 3-5 3-12 4-17-3Z" fill="rgba(80,200,220,0.25)"/><ellipse cx="5" cy="14" rx="2.5" ry="5" fill="rgba(80,200,220,0.18)"/><circle cx="17" cy="11" r="1.2" fill="rgba(40,130,150,0.45)"/></svg>
          <svg className="fish f6" viewBox="0 0 56 28"><path d="M4 14c5-6 12-5 17-3 2 1 4 3 6 3-2 0-4 2-6 3-5 3-12 4-17-3Z" fill="rgba(100,210,230,0.22)"/><ellipse cx="5" cy="14" rx="2.5" ry="5" fill="rgba(100,210,230,0.15)"/><circle cx="17" cy="11" r="1.2" fill="rgba(50,140,160,0.4)"/></svg>
        </div>
        <div className="fish-layer fish-near">
          <svg className="fish f7" viewBox="0 0 72 36"><path d="M5 18c6-8 16-6 22-3 3 1.5 5 4 8 4-2 0-5 2.5-8 4-6 4-16 5-22-3Z" fill="rgba(54,224,240,0.18)"/><ellipse cx="6" cy="18" rx="3" ry="6" fill="rgba(54,224,240,0.12)"/><circle cx="22" cy="14" r="1.5" fill="rgba(30,150,170,0.4)"/></svg>
          <svg className="fish f8" viewBox="0 0 72 36"><path d="M5 18c6-8 16-6 22-3 3 1.5 5 4 8 4-2 0-5 2.5-8 4-6 4-16 5-22-3Z" fill="rgba(70,190,210,0.15)"/><ellipse cx="6" cy="18" rx="3" ry="6" fill="rgba(70,190,210,0.1)"/><circle cx="22" cy="14" r="1.5" fill="rgba(35,130,150,0.35)"/></svg>
        </div>
      </div>

      {/* Glassmorphic navigation header */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-brand">
            <IcFish className="landing-brand-icon" />
            <span>Keys Angler</span>
          </Link>
          <div className="landing-nav-actions">
            <Link to="/app" className="btn primary landing-nav-cta">
              <IcWaves width={16} height={16} /> Open App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <p className="eyebrow landing-hero-eyebrow">Upper Florida Keys</p>
          <h1 className="display landing-hero-title">
            Know When to Fish,<br />
            <span className="landing-hero-accent">Where the Fish Are</span>
          </h1>
          <p className="landing-hero-subtitle">
            Real-time bite scores, solunar windows, and local intel for anglers in the Florida Keys.
            Works offline when you're off the grid.
          </p>
          <div className="landing-hero-ctas">
            <Link to="/app" className="btn primary lg landing-hero-btn">
              <IcHome width={20} height={20} /> Launch Dashboard
            </Link>
            <Link to="/onwater" className="btn ghost lg landing-hero-btn">
              <IcWaves width={20} height={20} /> On-Water Mode
            </Link>
          </div>
        </div>
      </section>

      {/* Full navigation sections */}
      {SECTIONS.map((section) => (
        <section key={section.title} className="landing-section">
          <div className="landing-section-inner">
            <div className="landing-section-header">
              <h2 className="landing-section-title">{section.title}</h2>
              <p className="landing-section-desc">{section.desc}</p>
            </div>
            <div className="landing-tiles-grid">
              {section.items.map(({ to, label, desc, Icon }) => (
                <Link key={to} to={to} className="landing-tile">
                  <div className="landing-tile-icon">
                    <Icon width={22} height={22} />
                  </div>
                  <div className="landing-tile-body">
                    <div className="landing-tile-label">{label}</div>
                    <div className="landing-tile-desc">{desc}</div>
                  </div>
                  <div className="landing-tile-arrow">→</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <IcFish className="landing-footer-icon" />
            <span>Keys Angler</span>
          </div>
          <p className="landing-footer-copy">
            Offline-first fishing intelligence for the Upper Florida Keys
          </p>
          <p className="landing-footer-legal">
            &copy; 2024 Keys Angler. Planning aid only — always verify with official sources.
          </p>
        </div>
      </footer>
    </div>
  )
}
