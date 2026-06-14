import { useCallback, useEffect, useState } from 'react'
import { loadConditions } from '../services/conditions.js'
import { DEFAULTS, ALL_MARINE_ZONES } from '../data/stations.js'
import { useOnlineStatus } from './useOnlineStatus.js'
import { useActiveLocation } from './useActiveLocation.js'

// Loads conditions for the active location. Returns data + loading/refresh state +
// a refresh() that forces a live fetch (falling back to cache on failure).
export function useConditions({ days = 4 } = {}) {
  const [state, setState] = useState({ loading: true, refreshing: false, data: null, error: null })
  const online = useOnlineStatus()
  const loc = useActiveLocation()

  const load = useCallback(
    async (forceFresh) => {
      setState((s) => ({ ...s, loading: !s.data, refreshing: !!s.data, error: null }))
      try {
        const data = await loadConditions({
          lat: loc.lat,
          lon: loc.lon,
          station: DEFAULTS.tideStation,
          zones: ALL_MARINE_ZONES,
          days,
          when: new Date(),
          forceFresh,
        })
        setState({ loading: false, refreshing: false, data, error: null })
      } catch (error) {
        setState((s) => ({ ...s, loading: false, refreshing: false, error }))
      }
    },
    [days, loc.lat, loc.lon],
  )

  useEffect(() => {
    load(false)
  }, [load])

  return { ...state, online, refresh: () => load(true) }
}
