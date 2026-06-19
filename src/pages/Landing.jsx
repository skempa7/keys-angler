import { Link } from 'react-router-dom'
import { IcFish, IcCalendar, IcMoon, IcMap, IcShield, IcClock, IcWaves, IcAnchor } from '../components/icons.jsx'
import '../styles/landing.css'

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
          <div className="landing-brand">
            <IcFish className="landing-brand-icon" />
            <span>Keys Angler</span>
          </div>
          <nav className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#about" className="landing-nav-link">About</a>
          </nav>
          <Link to="/app" className="btn primary landing-nav-cta">Open App</Link>
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
            <Link to="/app" className="btn primary lg landing-hero-btn">Launch App</Link>
            <a href="#features" className="btn ghost landing-hero-btn">Learn More</a>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="landing-features">
        <div className="landing-features-inner">
          <h2 className="h1 landing-features-title">Everything You Need on the Water</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><IcClock /></div>
              <h3 className="landing-feature-title">Bite Score</h3>
              <p className="landing-feature-desc">Real-time fishing quality rating based on tides, moon phase, weather, and seasonal patterns.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><IcMoon /></div>
              <h3 className="landing-feature-title">Solunar Windows</h3>
              <p className="landing-feature-desc">Prime feeding times calculated from moon position and local sunrise/sunset for your GPS location.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><IcCalendar /></div>
              <h3 className="landing-feature-title">Trip Planner</h3>
              <p className="landing-feature-desc">Plan ahead with multi-day forecasts and tide predictions. Save spots and share with your crew.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><IcFish /></div>
              <h3 className="landing-feature-title">Species Intel</h3>
              <p className="landing-feature-desc">Target-specific tips, seasonal availability, size limits, and tackle recommendations for 40+ species.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><IcMap /></div>
              <h3 className="landing-feature-title">Offline Maps</h3>
              <p className="landing-feature-desc">Download chart tiles before you go. Full app functionality without cell service.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><IcShield /></div>
              <h3 className="landing-feature-title">Regulations</h3>
              <p className="landing-feature-desc">Quick reference for seasons, slot limits, and bag limits. Know what to keep before you boat it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About section */}
      <section id="about" className="landing-about">
        <div className="landing-about-inner">
          <div className="landing-about-card">
            <div className="landing-about-icon"><IcWaves /></div>
            <h2 className="h2 landing-about-title">Built for the Keys</h2>
            <p className="landing-about-text">
              Keys Angler was built specifically for the Upper Florida Keys—from Key Largo to Long Key.
              Every feature is tuned for local waters, local species, and local regulations.
              No generic fishing app can match this level of regional focus.
            </p>
          </div>
          <div className="landing-about-card">
            <div className="landing-about-icon"><IcAnchor /></div>
            <h2 className="h2 landing-about-title">Works Offshore</h2>
            <p className="landing-about-text">
              No cell tower? No problem. The app caches tide data, weather forecasts, and maps locally.
              Add your catch with GPS coordinates even when offline—everything syncs when you're back in range.
            </p>
          </div>
        </div>
      </section>

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
            &copy; 2024 Keys Angler. Not affiliated with any government agency.
          </p>
        </div>
      </footer>
    </div>
  )
}
