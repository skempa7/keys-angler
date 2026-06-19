// "Where to go today" — rank the angler's saved spots against today's conditions.
// Scores each spot by what's in season at its depth/zone + today's water-temp fit,
// whether the tide is moving, wind exposure (the Keys "east wind → fish the bay,
// west wind → fish the ocean" rule), and the angler's own hit history there.
// Heuristic + grounded in the curated KB; the wind/exposure piece is guidance.
import { zoneForSpot } from './crossSection.js'
import { ZONE_BY_ID } from '../config.js'
import { SPECIES_BY_ID } from '../data/species.js'
import { getReg, isOpenOn } from '../data/regs.js'
import { fitOf } from './tripTargets.js'

// Direction (met, FROM) the rough fetch comes from for each zone's open water:
// oceanside (reef/offshore) blows out on onshore E/SE; bayside (backcountry) on NW/W.
const EXPOSURE = { reef: 120, offshore: 110, backcountry: 300 }
const angDiff = (a, b) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d }

export function rankSpots(spots, { sstF, windKn, windDir, tideNow } = {}) {
  const ranked = (spots || []).filter((s) => s && s.lat != null).map((s) => {
    const { zone } = zoneForSpot(s)
    const zoneSpecies = (ZONE_BY_ID[zone]?.species || []).map((id) => SPECIES_BY_ID[id]).filter(Boolean)

    let openCount = 0; const hot = []
    for (const sp of zoneSpecies) {
      const reg = getReg(sp.regsKey)
      const open = reg?.season?.kind === 'catch-release' ? true : reg ? isOpenOn(reg) : true
      if (!open) continue
      openCount++
      if (fitOf(sp, sstF) === 'ideal') hot.push(sp.name.split(' ')[0])
    }

    // Tide: moving water fishes best.
    const tideScore = tideNow ? (tideNow.atSlack ? 0.3 : 0.5 + 0.5 * Math.min(1, tideNow.flow)) : 0.6

    // Wind exposure for this spot's zone.
    let windScore = 1; let windNote = null
    if (windKn != null && windDir != null) {
      const onshore = angDiff(windDir, EXPOSURE[zone] ?? 180) < 55
      const strong = windKn >= 14
      if (onshore && strong) { windScore = 0.35; windNote = 'exposed to the wind' }
      else if (onshore) windScore = 0.72
      else { windScore = 1; if (strong) windNote = 'in the lee' }
    }

    const hitBonus = Math.min(0.4, Math.log((s.hits || 0) + 1) * 0.18)
    const fitScore = Math.min(1, hot.length * 0.34 + openCount * 0.06)
    const score = Math.round(100 * Math.max(0, Math.min(1, 0.45 * fitScore + 0.25 * tideScore + 0.2 * windScore + hitBonus)))

    const why = []
    if (hot.length) why.push(`${hot.slice(0, 3).join(', ')} in their band`)
    else if (openCount) why.push(`${openCount} species in season`)
    if (tideNow?.atSlack) why.push('slack now')
    else if (tideNow && tideNow.flow > 0.5) why.push('moving water')
    if (windNote) why.push(windNote)
    if ((s.hits || 0) > 0) why.push(`${s.hits} logged here`)

    return { spot: s, zone, score, why, hot }
  })
  ranked.sort((a, b) => b.score - a.score)
  return ranked
}
