import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { loadConditions } from '../services/conditions.js'
import { buildCalibration } from '../engine/biteCalibration.js'
import { ALL_MARINE_ZONES, nearestStation } from '../data/stations.js'
import { useOnlineStatus } from './useOnlineStatus.js'
import { useActiveLocation } from './useActiveLocation.js'

// Loads conditions for the active location. Returns data + loading/refresh state +
// a refresh() that forces a live fetch (falling back to cache on failure). When the
// catch log is rich enough, applies the personal calibration's factor weights so the
// score bends toward the angler's water (no-op until gated — see buildCalibration).
export function useConditions({ days = 4 } = {}) {
  const [state, setState] = useState({ loading: true, refreshing: false, data: null, error: null })
  const online = useOnlineStatus()
  const loc = useActiveLocation()
  const catches = useLiveQuery(() => db.catches.toArray(), [], [])
  const cal = useMemo(() => buildCalibration(catches || []), [catches])
  // Stabilize the tuning object on its actual contents so it doesn't retrigger load() each render.
  const tuningKey = cal.gated ? JSON.stringify(cal.factorWeights) : ''
  const tuning = useMemo(() => (cal.gated ? { factorWeights: cal.factorWeights } : null), [tuningKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(
    async (forceFresh) => {
      setState((s) => ({ ...s, loading: !s.data, refreshing: !!s.data, error: null }))
      try {
        const data = await loadConditions({
          lat: loc.lat,
          lon: loc.lon,
          station: nearestStation(loc.lat, loc.lon).id,
          zones: ALL_MARINE_ZONES,
          days,
          when: new Date(),
          forceFresh,
          tuning,
        })
        setState({ loading: false, refreshing: false, data, error: null })
      } catch (error) {
        setState((s) => ({ ...s, loading: false, refreshing: false, error }))
      }
    },
    [days, loc.lat, loc.lon, tuning],
  )

  useEffect(() => {
    load(false)
  }, [load])

  return { ...state, online, cal, refresh: () => load(true) }
}
