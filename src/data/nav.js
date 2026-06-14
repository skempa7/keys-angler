import {
  IcHome, IcCalendar, IcMoon, IcFish, IcBook, IcTrophy, IcStar,
  IcCrab, IcLobster, IcShrimp, IcAnchor, IcShield, IcCog, IcMap, IcClock,
} from '../components/icons.jsx'

// Full grouped navigation (desktop sidebar + mobile "More" drawer).
export const NAV_GROUPS = [
  {
    title: 'On the water',
    items: [
      { to: '/', label: 'Should I Go', Icon: IcHome, end: true },
      { to: '/bite', label: 'Bite Times', Icon: IcMoon },
      { to: '/plan', label: 'Trip Plan', Icon: IcCalendar },
      { to: '/calendar', label: 'Calendar', Icon: IcClock },
      { to: '/map', label: 'Map & Spots', Icon: IcMap },
    ],
  },
  {
    title: 'Catch',
    items: [
      { to: '/target', label: 'Target', Icon: IcFish },
      { to: '/log', label: 'Catch Log', Icon: IcBook },
      { to: '/slam', label: 'Grand Slam', Icon: IcTrophy },
      { to: '/logbook', label: 'Logbook', Icon: IcStar },
    ],
  },
  {
    title: 'Harvest',
    items: [
      { to: '/crab', label: 'Stone Crab', Icon: IcCrab },
      { to: '/lobster', label: 'Spiny Lobster', Icon: IcLobster },
      { to: '/shrimp', label: 'Shrimp', Icon: IcShrimp },
    ],
  },
  {
    title: 'Yours',
    items: [
      { to: '/gear', label: 'Gear & Boat', Icon: IcAnchor },
      { to: '/regs', label: 'Regulations', Icon: IcShield },
      { to: '/settings', label: 'Settings', Icon: IcCog },
    ],
  },
]
