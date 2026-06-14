// Lightweight inline icon set (stroke = currentColor). 24x24 grid.
const S = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IcHome = (p) => (
  <svg {...S} {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /></svg>
)
export const IcCalendar = (p) => (
  <svg {...S} {...p}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" /></svg>
)
export const IcFish = (p) => (
  <svg {...S} {...p}><path d="M3 12c3.5-5 9-5.5 13-3.5 2 1 3.5 2.6 4.5 3.5-1 .9-2.5 2.5-4.5 3.5C12 18 6.5 17 3 12Z" /><path d="M3 12c-.5-1.4-.5-3 .2-4.4C4 8.4 4.5 10 4.5 12S4 15.6 3.2 16.4C2.5 15 2.5 13.4 3 12Z" /><circle cx="15.5" cy="11" r=".9" fill="currentColor" stroke="none" /></svg>
)
export const IcBook = (p) => (
  <svg {...S} {...p}><path d="M5 4.5h9a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H5Z" /><path d="M5 4.5A1.5 1.5 0 0 0 3.5 6v12A1.5 1.5 0 0 0 5 19.5" /></svg>
)
export const IcGrid = (p) => (
  <svg {...S} {...p}><rect x="4" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" /></svg>
)
export const IcSun = (p) => (
  <svg {...S} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19" /></svg>
)
export const IcMoon = (p) => (
  <svg {...S} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>
)
export const IcWaves = (p) => (
  <svg {...S} {...p}><path d="M2 8c2 0 2.5 1.6 5 1.6S11.5 8 14 8s2.5 1.6 5 1.6S21 8 22 8M2 13c2 0 2.5 1.6 5 1.6S11.5 13 14 13s2.5 1.6 5 1.6S21 13 22 13M2 18c2 0 2.5 1.6 5 1.6S11.5 18 14 18s2.5 1.6 5 1.6S21 18 22 18" /></svg>
)
export const IcClock = (p) => (
  <svg {...S} {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>
)
export const IcAnchor = (p) => (
  <svg {...S} {...p}><circle cx="12" cy="5" r="2" /><path d="M12 7v13M7 11H4.5M19.5 11H17" /><path d="M5 13a7 7 0 0 0 14 0" /></svg>
)
export const IcShield = (p) => (
  <svg {...S} {...p}><path d="M12 3.5 19 6v6c0 4.5-3 7.2-7 8.5-4-1.3-7-4-7-8.5V6Z" /><path d="M9 12l2 2 4-4" /></svg>
)
export const IcCrab = (p) => (
  <svg {...S} {...p}><path d="M8 13a4 4 0 0 1 8 0" /><path d="M6 11 3 9m3 5-3 1m15-6 3-2m-3 6 3 1" /><path d="M9 16l-1.5 3M15 16l1.5 3M11 17v2.5M13 17v2.5" /><circle cx="10" cy="11.5" r=".8" fill="currentColor" stroke="none" /><circle cx="14" cy="11.5" r=".8" fill="currentColor" stroke="none" /></svg>
)
export const IcLobster = (p) => (
  <svg {...S} {...p}><path d="M12 4c-1 1.5-1 3 0 4 1-1 1-2.5 0-4Z" /><path d="M12 8c2 0 3 2 3 4.5S13.5 20 12 20s-3-2.5-3-7.5S10 8 12 8Z" /><path d="M9 11 6 9m9 2 3-2M9 14l-3 1m9-1 3 1" /></svg>
)
export const IcShrimp = (p) => (
  <svg {...S} {...p}><path d="M17 7c-5 0-9 3-9 7 0 2.5 2 4 4.5 4 4 0 6.5-3 6.5-6" /><path d="M8 14c-2 0-4-1-4-3.5M17 7c1-1 2.5-1.2 3.5-.5" /><circle cx="17.5" cy="8.5" r=".8" fill="currentColor" stroke="none" /></svg>
)
export const IcTrophy = (p) => (
  <svg {...S} {...p}><path d="M7 4.5h10v3a5 5 0 0 1-10 0Z" /><path d="M7 5.5H4.5V7A2.5 2.5 0 0 0 7 9.5M17 5.5h2.5V7A2.5 2.5 0 0 1 17 9.5M10 13h4M9 19.5h6M12 13v3.5" /></svg>
)
export const IcGear = (p) => (
  <svg {...S} {...p}><path d="M3 7h11M3 12h7M3 17h13" /><circle cx="17" cy="7" r="2.4" /><circle cx="13" cy="12" r="2.4" /><circle cx="19" cy="17" r="2.4" /></svg>
)
export const IcCog = (p) => (
  <svg {...S} {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.7 5.3l-1.7 1.7M7 17l-1.7 1.7M18.7 18.7 17 17M7 7 5.3 5.3" /></svg>
)
export const IcChevron = (p) => (
  <svg {...S} {...p}><path d="m9 6 6 6-6 6" /></svg>
)
export const IcCheck = (p) => (<svg {...S} {...p}><path d="m5 12.5 4.5 4.5L19 7" /></svg>)
export const IcX = (p) => (<svg {...S} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>)
