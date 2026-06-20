import {
  IcHome, IcCalendar, IcMoon, IcFish, IcBook, IcHook, IcTrophy, IcStar,
  IcCrab, IcLobster, IcShrimp, IcAnchor, IcShield, IcCog, IcMap, IcClock, IcWaves,
  IcSun, IcFlame, IcGrid, IcGear, IcMedal, IcPin, IcKnife, IcDrift,
} from '../components/icons.jsx'

// Full grouped navigation (desktop sidebar + mobile "More" drawer).
export const NAV_GROUPS = [
  {
    title: 'On the water',
    items: [
      { to: '/', label: 'Should I Go', Icon: IcHome, end: true },
      { to: '/onwater', label: 'On-Water Mode', Icon: IcWaves },
      { to: '/drift', label: 'Drift or Anchor', Icon: IcDrift },
      { to: '/plan', label: 'Plan', Icon: IcCalendar },
      { to: '/map', label: 'Map & Spots', Icon: IcMap },
      { to: '/offshore', label: 'Offshore Plan', Icon: IcSun },
      { to: '/crossings', label: 'Bar Crossings', Icon: IcShield },
      { to: '/compass', label: 'Compass', Icon: IcPin },
    ],
  },
  {
    title: 'Catch & log',
    items: [
      { to: '/target', label: 'Target a Species', Icon: IcFish },
      { to: '/logbook', label: 'Logbook', Icon: IcBook },
      { to: '/harvest', label: 'Harvest', Icon: IcLobster },
      { to: '/tales', label: 'Fish Tales', Icon: IcStar },
    ],
  },
  {
    title: 'Yours',
    items: [
      { to: '/gear', label: 'Gear & Boat', Icon: IcAnchor },
      { to: '/knots', label: 'Knots & Rigs', Icon: IcGear },
      { to: '/regs', label: 'Regulations', Icon: IcShield },
      { to: '/settings', label: 'Settings', Icon: IcCog },
    ],
  },
]
