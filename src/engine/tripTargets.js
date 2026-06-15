// Resolve a planned trip's zone into ranked target species with depth, SST-fit,
// a compressed "where & how", and a deduped bait list — all from the species KB.
import { ZONE_BY_ID } from '../config.js'
import { SPECIES_BY_ID } from '../data/species.js'

const ALIAS = { tuna: 'blackfin-tuna' } // zone id → KB id

export const fitOf = (s, sstF) => {
  if (sstF == null || s.waterTempMinF == null) return 'unknown'
  if (sstF < s.waterTempMinF - 1) return 'cool'
  if (sstF > s.waterTempMaxF + 1) return 'warm'
  return 'ideal'
}
export const FIT_LABEL = { ideal: 'in its temp band', cool: 'below its band', warm: 'above its band', unknown: '' }

export const depthLabel = (s) => {
  if (s.depthFtMax <= 6) return 'skinny water'
  if (s.depthFtMax > 500) return `${s.depthFtMin} ft+ blue water`
  return `${s.depthFtMin}–${s.depthFtMax} ft`
}
export const midDepth = (s) => (s.depthFtMin + s.depthFtMax) / 2

// First clause of the bestTide text, trimmed for a one-liner.
export const shortTide = (s) => {
  const t = (s.bestTide || '').split(/[.;]/)[0].split(',')[0].trim()
  return t.length > 64 ? t.slice(0, 62) + '…' : t
}

export function zoneTargets(zoneId, sstF, biting = []) {
  const ids = ZONE_BY_ID[zoneId]?.species || []
  const bmap = Object.fromEntries(biting.map((b) => [b.id, b]))
  return ids
    .map((id) => {
      const sp = SPECIES_BY_ID[ALIAS[id] || id]
      if (!sp) return null
      const b = bmap[id]
      return { id, sp, fit: fitOf(sp, sstF), status: b?.status || null, keepable: b?.keepable, cr: b?.cr }
    })
    .filter(Boolean)
    .sort((a, b) => midDepth(a.sp) - midDepth(b.sp))
}

// Union the targets' baits into a deduped buy-list, ranked by how many species share each.
export function baitList(targets) {
  const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9 /-]/g, '').trim()
  const map = {}
  for (const t of targets) {
    for (const raw of t.sp.baits || []) {
      const key = norm(raw).split(/ - | – /)[0].trim()
      if (!key) continue
      const e = map[key] || (map[key] = { label: raw.replace(/\s*\(.*?\)\s*/g, ' ').trim(), species: new Set() })
      e.species.add(t.sp.name.split(' ')[0])
    }
  }
  return Object.values(map)
    .map((e) => ({ label: e.label, species: [...e.species], count: e.species.size }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}
