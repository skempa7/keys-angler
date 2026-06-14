import { db } from '../db/db.js'
import { isOnline } from './http.js'

// Offline-first fetch-through. Every payload is mirrored into IndexedDB with a
// timestamp; that copy is the source of truth for offline render + "last updated".
//
//   key        unique cache key (source + params)
//   source     coarse group label (e.g. 'tides', 'marine') for bulk eviction
//   fetcher    async () => data   (the live network call)
//   maxAgeMs   serve cache without hitting network if fresher than this
//   forceFresh bypass freshness (still falls back to cache on failure)
//
// Returns { data, fetchedAt, fromCache, stale, error? }.
export async function cachedFetch({ key, source, fetcher, maxAgeMs = 30 * 60 * 1000, forceFresh = false }) {
  const existing = await db.cache.get(key)
  const ageOk = existing && Date.now() - existing.fetchedAt < maxAgeMs

  if (existing && ageOk && !forceFresh) {
    return { data: existing.data, fetchedAt: existing.fetchedAt, fromCache: true, stale: false }
  }
  if (!isOnline()) {
    if (existing) return { data: existing.data, fetchedAt: existing.fetchedAt, fromCache: true, stale: true }
    throw new Error('Offline and no cached data for ' + key)
  }
  try {
    const data = await fetcher()
    const fetchedAt = Date.now()
    await db.cache.put({ key, source, data, fetchedAt })
    return { data, fetchedAt, fromCache: false, stale: false }
  } catch (error) {
    if (existing) {
      return { data: existing.data, fetchedAt: existing.fetchedAt, fromCache: true, stale: true, error }
    }
    throw error
  }
}

export const peekCache = (key) => db.cache.get(key)
export const evictSource = (source) => db.cache.where('source').equals(source).delete()
