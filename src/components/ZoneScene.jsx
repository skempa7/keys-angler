// Minimal cross-section of the three Keys zones: flats → channel → patch reef →
// the drop-off → blue water. Decorative header banner.
export default function ZoneScene() {
  return (
    <div className="zone-scene-wrap" aria-hidden="true">
      <svg className="zone-scene" viewBox="0 0 400 96" preserveAspectRatio="none">
        <defs>
          <linearGradient id="zoneWater" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.20" />
            <stop offset="1" stopColor="var(--accent-deep)" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <rect width="400" height="96" fill="url(#zoneWater)" />
        {/* sea floor: shallow flats (left) → channel dip → reef hump → drop to deep (right) */}
        <path d="M0 64c30-4 60-6 92 2 12 3 18 18 40 16 18-2 22-30 56-32 20-1 26 14 52 18 36 4 60 28 160 28V96H0z" fill="var(--surface-3)" />
        <path d="M168 50c12-7 26-5 34 3" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.55" />
      </svg>
      <span className="zone-label" style={{ left: '8%' }}>Flats</span>
      <span className="zone-label" style={{ left: '46%' }}>Reef</span>
      <span className="zone-label" style={{ left: '82%' }}>Blue</span>
    </div>
  )
}
