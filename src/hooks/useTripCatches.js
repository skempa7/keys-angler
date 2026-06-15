import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'

// Live-resolve a trip's catches by its calendar day. Derive-by-date is the
// authoritative link (no stored catchIds), so edits/deletes/adds to catches on
// that day reflect instantly with zero trip migration.
export function useTripCatches(dateStr) {
  const [y, m, d] = (dateStr || '').split('-').map(Number)
  const dayStart = new Date(y, (m || 1) - 1, d || 1).getTime()
  const dayEnd = dayStart + 86400000
  return useLiveQuery(
    () => db.catches.where('caughtAt').between(dayStart, dayEnd, true, false).toArray(),
    [dateStr],
    [],
  )
}
