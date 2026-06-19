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
      { to: '/bite', label: 'Bite Times', Icon: IcMoon },
      { to: '/plan', label: 'Trip Plan', Icon: IcCalendar },
      { to: '/calendar', label: 'Calendar', Icon: IcClock },
      { to: '/map', label: 'Map & Spots', Icon: IcMap },
      { to: '/offshore', label: 'Offshore Plan', Icon: IcSun },
      { to: '/crossings', label: 'Bar Crossings', Icon: IcShield },
      { to: '/compass', label: 'Compass', Icon: IcPin },
    ],
  },
  {
    title: 'Catch',
    items: [
      { to: '/target', label: 'Target', Icon: IcFish },
      { to: '/log', label: 'Catch Log', Icon: IcHook },
      { to: '/trips', label: 'Trip Log', Icon: IcBook },
      { to: '/slam', label: 'Grand Slam', Icon: IcTrophy },
      { to: '/tournament', label: 'Tournament', Icon: IcMedal },
      { to: '/logbook', label: 'Logbook', Icon: IcStar },
      { to: '/recap', label: 'Season Recap', Icon: IcFlame },
      { to: '/patterns', label: 'Patterns', Icon: IcGrid },
    ],
  },
  {
    title: 'Harvest',
    items: [
      { to: '/cleaning', label: 'Cleaning Table', Icon: IcKnife },
      { to: '/crab', label: 'Stone Crab', Icon: IcCrab },
      { to: '/lobster', label: 'Spiny Lobster', Icon: IcLobster },
      { to: '/shrimp', label: 'Shrimp', Icon: IcShrimp },
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
