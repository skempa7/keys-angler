// Cohesive line-art silhouettes (fill = currentColor) mapped per species archetype.
// Keeps the set small + consistent: billfish, pelagic, reef, flats + crustacean icons.
import { IcLobster, IcCrab, IcShrimp } from './icons.jsx'

const wrap = (children) => (p) => (
  <svg viewBox="0 0 64 32" fill="currentColor" stroke="none" {...p}>{children}</svg>
)

const Flats = wrap(
  <>
    <path d="M5 16C16 8 38 9 47 14c1 .6 1 3.4 0 4C38 23 16 24 5 16Z" />
    <path d="M46 16 60 9l-4 7 4 7z" />
    <path d="M23 11c3-2.4 8-2.4 11 0-4-1-7-1-11 0Z" opacity="0.85" />
    <circle cx="12" cy="15" r="1.4" fill="var(--bg)" />
  </>,
)

const Pelagic = wrap(
  <>
    <path d="M5 17C16 9 37 9 46 14c1.5 .7 1.5 3.3 0 4C37 23 16 24 5 17Z" />
    <path d="M45 16 60 8l-5 8 5 8z" />
    <path d="M16 10c8-4.5 22-2.5 29 4-8-3-19-3-29-1Z" opacity="0.8" />
    <path d="M21 21c4 2.6 12 2.6 16 0-6 1-10 1-16 0Z" opacity="0.65" />
    <circle cx="12" cy="15" r="1.4" fill="var(--bg)" />
  </>,
)

const Reef = wrap(
  <>
    <path d="M6 16C14 6.5 40 7.5 49 14c1.4 1 1.4 3 0 4C40 24.5 14 25.5 6 16Z" />
    <path d="M48 16 61 9l-4 7 4 7z" />
    <path d="M17 8.5c10-3.6 25-1.6 30 6-9-4.6-21-5.6-30-3Z" opacity="0.8" />
    <circle cx="13" cy="15" r="1.6" fill="var(--bg)" />
  </>,
)

const Billfish = wrap(
  <>
    <path d="M0 16 18 13.8v4.4z" />
    <path d="M18 16C26 11.5 40 11.5 48 14c1.4 .6 1.4 3.4 0 4C40 20.5 26 20.5 18 16Z" />
    <path d="M47 16 61 9l-4 7 4 7z" />
    <path d="M21 13.5C27 4 39 4 46 12.5c-9-3.8-18-3.8-25 1Z" />
    <circle cx="24" cy="15" r="1.3" fill="var(--bg)" />
  </>,
)

const ARCH = {
  sailfish: Billfish,
  mahi: Pelagic, 'blackfin-tuna': Pelagic, wahoo: Pelagic, kingfish: Pelagic,
  yellowtail: Reef, mutton: Reef, grouper: Reef, hogfish: Reef,
  bonefish: Flats, permit: Flats, tarpon: Flats, snook: Flats, redfish: Flats,
}

const NAME_ARCH = [
  [/stone crab|crab/i, IcCrab],
  [/lobster/i, IcLobster],
  [/shrimp/i, IcShrimp],
  [/sailfish/i, Billfish],
  [/mahi|dolphin/i, Pelagic], [/tuna/i, Pelagic], [/wahoo/i, Pelagic], [/mackerel|king/i, Pelagic],
  [/snapper|yellowtail|mutton|grouper|hogfish/i, Reef],
  [/tarpon|bonefish|permit|snook|red/i, Flats],
]

export function SpeciesArt({ id, width = 44, height = 22, ...rest }) {
  const Comp = ARCH[id]
  return Comp ? <Comp width={width} height={height} {...rest} /> : null
}

export function ArtForName({ name, width = 40, height = 20, ...rest }) {
  const hit = NAME_ARCH.find(([re]) => re.test(name || ''))
  const Comp = hit ? hit[1] : null
  return Comp ? <Comp width={width} height={height} {...rest} /> : null
}
