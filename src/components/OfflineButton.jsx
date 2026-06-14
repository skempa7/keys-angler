import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { primeOffline } from '../services/conditions.js'
import { useActiveLocation } from '../hooks/useActiveLocation.js'
import { DEFAULTS, ALL_MARINE_ZONES } from '../data/stations.js'
import { relTime } from '../utils/format.js'

// One-tap "download for offline" — primes the rolling window into IndexedDB.
export default function OfflineButton({ variant = 'block' }) {
  const loc = useActiveLocation()
  const lastPrimed = useLiveQuery(async () => (await db.settings.get('lastPrimed'))?.value, [], null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const run = async () => {
    setBusy(true)
    try {
      const r = await primeOffline({ lat: loc.lat, lon: loc.lon, station: DEFAULTS.tideStation, zones: ALL_MARINE_ZONES })
      await db.settings.put({ key: 'lastPrimed', value: Date.now() })
      setMsg(`Saved ${r.ok}/${r.total} for offline`)
    } catch {
      setMsg('Failed — try on WiFi')
    } finally {
      setBusy(false)
      setTimeout(() => setMsg(''), 3200)
    }
  }

  if (variant === 'chip') {
    return <button className="chip" onClick={run} disabled={busy} title="Cache everything for an offline trip">{busy ? 'Saving…' : msg || '⬇ Save offline'}</button>
  }
  return (
    <div className="stack-sm">
      <button className="btn primary block" onClick={run} disabled={busy}>{busy ? 'Downloading…' : '⬇ Download for offline'}</button>
      <div className="faint" style={{ fontSize: 12 }}>
        {msg || (lastPrimed ? `Last downloaded ${relTime(lastPrimed)}` : 'Not downloaded yet — do this on WiFi before heading out.')}
      </div>
    </div>
  )
}
