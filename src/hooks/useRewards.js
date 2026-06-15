import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { computeRewards } from '../engine/rewards.js'

const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }

export function useRewards() {
  const catches = useLiveQuery(() => db.catches.toArray(), [], [])
  const spots = useLiveQuery(() => db.spots.toArray(), [], [])
  // Exclude reusable templates — only real planned/cached trips count toward XP & badges.
  const trips = useLiveQuery(() => db.trips.filter((t) => t.template !== 1).toArray(), [], [])
  const openDays = useLiveQuery(async () => (await db.settings.get('openDays'))?.value, [], undefined)

  // Record today's visit once (small +XP for daily use).
  useEffect(() => {
    (async () => {
      const rec = await db.settings.get('openDays')
      const set = new Set(rec?.value || [])
      if (!set.has(today())) { set.add(today()); await db.settings.put({ key: 'openDays', value: [...set] }) }
    })()
  }, [])

  return computeRewards({
    catches: catches || [],
    spots: spots || [],
    trips: trips || [],
    openDays: (openDays || []).length,
  })
}
