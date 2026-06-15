// Shared geometry for the Keys depth cross-section, used by both TripFishMap (species
// by depth) and SpotCrossSection (your saved spots by depth) so the two views align
// pixel-for-pixel. Also classifies a free-text-depth spot into a zone + Y position.
import { ZONE_BY_ID } from '../config.js'

// X-segments per zone (matches the seabed path in the cross-section SVG) + depth→Y.
export const SEG = { backcountry: [16, 108], reef: [122, 222], offshore: [236, 330] }
export const FIT_COLOR = { ideal: 'var(--good)', cool: 'var(--accent)', warm: 'var(--caution)', unknown: 'var(--text-faint)' }
export const depthY = (ft) => 24 + (Math.min(ft, 300) / 300) * 158

// Read a numeric depth (ft) out of a spot's free-text depth ('60', '60 ft', '40-60' → 40, '' → null).
export const parseDepthFt = (spot) => {
  const m = String(spot?.depth ?? '').match(/[\d.]+/)
  const n = m ? Number(m[0]) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

// Classify by DEPTH first (truth), using the config ZONES depthFt ranges so it can never
// drift from where the species dots land; kind is only a last-resort fallback.
export function zoneForSpot(spot) {
  const ft = parseDepthFt(spot)
  if (ft == null) return { zone: 'reef', depthFt: null, estimated: true }
  const bc = ZONE_BY_ID.backcountry?.depthFt || [1, 10]
  const rf = ZONE_BY_ID.reef?.depthFt || [10, 120]
  if (ft < bc[1]) return { zone: 'backcountry', depthFt: ft, estimated: false }
  if (ft <= rf[1]) return { zone: 'reef', depthFt: ft, estimated: false }
  return { zone: 'offshore', depthFt: ft, estimated: false }
}

// Lay spots into the cross-section: those with a usable depth get an {x,y}; the rest
// are returned in `without` for a "needs a depth" footer (never silently dropped).
export function placeSpots(spots) {
  const withDepth = [], without = []
  for (const s of spots || []) {
    const ft = parseDepthFt(s)
    if (ft == null) { without.push(s); continue }
    withDepth.push({ spot: s, depthFt: ft, ...zoneForSpot(s) })
  }
  const byZone = {}
  for (const p of withDepth) (byZone[p.zone] = byZone[p.zone] || []).push(p)
  const placed = []
  for (const [zone, list] of Object.entries(byZone)) {
    list.sort((a, b) => a.depthFt - b.depthFt) // shallow → deep, matching the species sort
    const [x0, x1] = SEG[zone] || SEG.reef
    list.forEach((p, i) => {
      const x = list.length === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (list.length - 1)
      placed.push({ ...p, x, y: depthY(p.depthFt) })
    })
  }
  return { placed, without }
}
