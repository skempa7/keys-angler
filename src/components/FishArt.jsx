// Per-species line-art silhouettes, generated parametrically (body depth + tail +
// dorsal + a distinguishing feature) so each species reads differently. Facing left,
// fill = currentColor, 64x32 grid. Crustaceans reuse the stroke icons.
import { IcLobster, IcCrab, IcShrimp } from './icons.jsx'

const T = 16

function shapes({ depth: d = 7, xn = 5, xp = 46, tail = 'fork', tailSize = 7, dorsal = 'small', feature = [] }) {
  const back = T - d
  const feats = Array.isArray(feature) ? feature : [feature]
  const e = []

  // body
  e.push(<path key="b" d={`M${xn} ${T} C ${xn + 5} ${back} ${(xn + xp) / 2} ${back} ${xp} ${T} C ${(xn + xp) / 2} ${T + d} ${xn + 5} ${T + d} ${xn} ${T} Z`} />)

  // tail
  if (tail === 'crescent') e.push(<path key="t" d={`M${xp} ${T} L 62 ${T - tailSize - 2} L ${xp + 5} ${T} L 62 ${T + tailSize + 2} Z`} />)
  else if (tail === 'round') e.push(<path key="t" d={`M${xp} ${T} Q 61 ${T - tailSize} 61 ${T} Q 61 ${T + tailSize} ${xp} ${T} Z`} />)
  else e.push(<path key="t" d={`M${xp} ${T} L 60 ${T - tailSize} L 57 ${T} L 60 ${T + tailSize} Z`} />)

  // dorsal
  if (dorsal === 'long') e.push(<path key="d" d={`M14 ${back + 2} C 22 ${back - 4} 36 ${back - 4} ${xp - 4} ${back + 1} Z`} />)
  else if (dorsal === 'sail') e.push(<path key="d" d={`M16 ${back} C 22 ${back - 9} 40 ${back - 9} 44 ${back} Z`} />)
  else if (dorsal === 'spiny') e.push(<path key="d" d={`M19 ${back + 1} l2.5 -6 2 5 2 -6 2 6 Z`} />)
  else if (dorsal === 'tall') e.push(<path key="d" d={`M24 ${back + 1} L 28 ${back - 7} L 33 ${back + 1} Z`} />)
  else if (dorsal) e.push(<path key="d" d={`M24 ${back + 1} L 30 ${back - 5} L 36 ${back + 1} Z`} />)

  // distinguishing features
  if (feats.includes('bill')) e.push(<path key="bill" d={`M0 ${T} L ${xn} ${T - 1.6} L ${xn} ${T + 1.6} Z`} />)
  if (feats.includes('jaw')) e.push(<path key="jaw" d={`M${xn + 1} ${T + 1.5} L ${xn - 3} ${T + 4} L ${xn + 3} ${T + 3} Z`} />)
  if (feats.includes('snout')) e.push(<path key="sn" d={`M${xn} ${T - 1} L ${xn - 3} ${T + 2} L ${xn} ${T + 2} Z`} />)
  if (feats.includes('anal')) e.push(<path key="an" d={`M26 ${T + d - 1} L 30 ${T + d + 6} L 34 ${T + d - 1} Z`} />)
  if (feats.includes('spot')) e.push(<circle key="sp" cx={xp - 4} cy={T} r="2.2" fill="var(--bg)" />)
  if (feats.includes('lateral')) e.push(<path key="lat" d={`M${xn + 5} ${T} Q ${(xn + xp) / 2} ${T - 1.5} ${xp - 2} ${T}`} stroke="var(--bg)" strokeWidth="1" fill="none" />)

  e.push(<circle key="eye" cx={xn + 4} cy={T - 1.5} r="1.3" fill="var(--bg)" />)
  return e
}

const SPEC = {
  // backcountry — all visually distinct
  bonefish: { depth: 4.5, xp: 48, tail: 'fork', tailSize: 8 },
  snook: { depth: 5, xp: 49, tail: 'fork', tailSize: 6, feature: ['lateral', 'jaw'] },
  permit: { depth: 11, xp: 44, tail: 'crescent', tailSize: 7, dorsal: 'tall', feature: ['anal'] },
  redfish: { depth: 7, xp: 46, tail: 'round', tailSize: 6, feature: ['spot'] },
  tarpon: { depth: 9, xp: 45, tail: 'fork', tailSize: 8, feature: ['jaw'] },
  // reef
  yellowtail: { depth: 5.5, xp: 47, tail: 'fork', tailSize: 9 },
  mutton: { depth: 8, xp: 46, tail: 'fork', tailSize: 7 },
  grouper: { depth: 10, xp: 44, tail: 'round', tailSize: 7, dorsal: 'long' },
  hogfish: { depth: 9, xp: 45, tail: 'fork', tailSize: 6, dorsal: 'spiny', feature: ['snout'] },
  // offshore
  mahi: { depth: 9, xp: 46, tail: 'crescent', tailSize: 8, dorsal: 'long' },
  'blackfin-tuna': { depth: 9, xp: 45, tail: 'crescent', tailSize: 6 },
  wahoo: { depth: 4.5, xp: 51, tail: 'crescent', tailSize: 7 },
  kingfish: { depth: 5.5, xp: 49, tail: 'fork', tailSize: 7 },
  sailfish: { depth: 6, xn: 8, xp: 46, tail: 'crescent', tailSize: 8, dorsal: 'sail', feature: ['bill'] },
}

export function SpeciesArt({ id, width = 44, height = 22, ...rest }) {
  const spec = SPEC[id]
  if (!spec) return null
  return <svg viewBox="0 0 64 32" fill="currentColor" stroke="none" width={width} height={height} {...rest}>{shapes(spec)}</svg>
}

const NAME_TO_ID = [
  [/stone crab|crab/i, 'crab'], [/lobster/i, 'lobster'], [/shrimp/i, 'shrimp'],
  [/sailfish/i, 'sailfish'], [/mahi|dolphin/i, 'mahi'], [/blackfin|tuna/i, 'blackfin-tuna'],
  [/wahoo/i, 'wahoo'], [/king|mackerel/i, 'kingfish'], [/yellowtail/i, 'yellowtail'],
  [/mutton/i, 'mutton'], [/grouper/i, 'grouper'], [/hogfish/i, 'hogfish'],
  [/tarpon/i, 'tarpon'], [/bonefish/i, 'bonefish'], [/permit/i, 'permit'],
  [/snook/i, 'snook'], [/red/i, 'redfish'],
]
const CRUST = { crab: IcCrab, lobster: IcLobster, shrimp: IcShrimp }

export function ArtForName({ name, width = 40, height = 20, ...rest }) {
  const hit = NAME_TO_ID.find(([re]) => re.test(name || ''))
  if (!hit) return null
  const key = hit[1]
  if (CRUST[key]) { const Ic = CRUST[key]; return <Ic width={width} height={height} {...rest} /> }
  return <SpeciesArt id={key} width={width} height={height} {...rest} />
}
