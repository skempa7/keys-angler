import { useEffect, useState } from 'react'
import { HOME_PORT, APP } from '../config.js'
import { exportAll, importAll, storageInfo, requestPersist } from '../services/backup.js'
import { useTheme } from '../hooks/useTheme.js'
import { useActiveLocation, setActiveLocation, resetActiveLocation } from '../hooks/useActiveLocation.js'
import { evictSource } from '../services/cache.js'
import { downloadICS, seasonReminderEvents, gatewayStatus, TOURNAMENTS_SAMPLE } from '../services/phase2.js'
import OfflineButton from '../components/OfflineButton.jsx'
import { db } from '../db/db.js'
import { notifyPermission, notifyEnabled, setNotifyEnabled, requestNotify, sendTest, triggersSupported } from '../services/notify.js'

export default function Settings() {
  const loc = useActiveLocation()
  const { theme, setTheme } = useTheme()
  const [form, setForm] = useState({ name: loc.name, lat: loc.lat, lon: loc.lon, radiusNm: loc.radiusNm || 30 })
  const [msg, setMsg] = useState('')
  const [notif, setNotif] = useState(() => ({ perm: notifyPermission(), enabled: notifyEnabled() }))

  const note = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const enableAlerts = async () => {
    const p = await requestNotify()
    if (p === 'granted') { setNotifyEnabled(true); setNotif({ perm: p, enabled: true }); sendTest(); note('Alerts on — sent you a test.') }
    else { setNotif({ perm: p, enabled: false }); note(p === 'denied' ? 'Notifications are blocked in your browser settings.' : 'Could not enable alerts.') }
  }
  const disableAlerts = () => { setNotifyEnabled(false); setNotif((s) => ({ ...s, enabled: false })); note('Alerts off.') }
  const testAlert = async () => { const ok = await sendTest(); note(ok ? 'Test alert sent.' : 'Could not send a test.') }

  const [storage, setStorage] = useState(null)
  useEffect(() => { storageInfo().then(setStorage).catch(() => {}) }, [])
  const doExport = async () => { const r = await exportAll(); if (r.ok) note(`Backed up ${r.total} records.`); else if (!r.aborted) note('Backup failed.') }
  const doImport = async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const r = await importAll(file); note(`Restored ${r.restored} records.`) } catch (err) { note(err.message || 'Could not read that file.') } e.target.value = '' }
  const doPersist = async () => { const ok = await requestPersist(); setStorage(await storageInfo()); note(ok ? 'Storage protected on this device.' : 'Browser kept best-effort storage.') }

  const saveLoc = async () => {
    await setActiveLocation({ name: form.name, lat: Number(form.lat), lon: Number(form.lon), radiusNm: Number(form.radiusNm), label: form.name })
    note('Location saved.')
  }
  const resetLoc = async () => { await resetActiveLocation(); setForm({ name: HOME_PORT.name, lat: HOME_PORT.lat, lon: HOME_PORT.lon, radiusNm: HOME_PORT.radiusNm }); note('Reset to Tavernier.') }
  const refreshData = async () => { await Promise.all(['tides', 'marine', 'wx', 'alerts'].map(evictSource)); note('Cached conditions cleared — they’ll refetch on next open while online.') }
  const clearPersonal = async () => {
    if (!window.confirm('Delete all your catches, spots, gear and boat? This cannot be undone.')) return
    await Promise.all([db.catches.clear(), db.spots.clear(), db.gear.clear(), db.boats.clear()])
    note('Personal data cleared.')
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Settings</div>
        <h1 className="h1">Setup</h1>
      </header>

      {msg && <div className="alert-banner info">{msg}</div>}

      <div className="card stack-sm">
        <div className="eyebrow">Location & working radius</div>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Location name" />
        <div className="row" style={{ gap: 8 }}>
          <label className="field" style={{ flex: 1 }}><span className="field-label">Latitude</span><input className="input" inputMode="decimal" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} /></label>
          <label className="field" style={{ flex: 1 }}><span className="field-label">Longitude</span><input className="input" inputMode="decimal" value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} /></label>
        </div>
        <label className="field"><span className="field-label">Working radius (nm)</span><input className="input" inputMode="numeric" value={form.radiusNm} onChange={(e) => setForm({ ...form, radiusNm: e.target.value })} /></label>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn primary block" onClick={saveLoc}>Save location</button>
          <button className="btn ghost" onClick={resetLoc}>Tavernier</button>
        </div>
        <p className="faint" style={{ fontSize: 12 }}>Marine, wind, sun/moon &amp; solunar follow this point. Tide/current use the fixed Upper-Keys stations.</p>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Appearance</div>
        <div className="row" style={{ gap: 8 }}>
          <button className={`chip ${theme === 'sea' ? 'active' : ''}`} onClick={() => setTheme('sea')}>Sea (dark)</button>
          <button className={`chip ${theme === 'sun' ? 'active' : ''}`} onClick={() => setTheme('sun')}>Sunlight (high-contrast)</button>
        </div>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Data</div>
        <OfflineButton />
        <div className="divider" />
        <button className="btn ghost block" onClick={refreshData}>Clear cached conditions (force refresh)</button>
        <button className="btn ghost block" onClick={clearPersonal} style={{ color: 'var(--bad)' }}>Delete my catches, spots & gear</button>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Backup & storage</div>
        <button className="btn primary block" onClick={doExport}>Back up my logbook to a file</button>
        <label className="btn ghost block" style={{ cursor: 'pointer' }}>Restore from a backup
          <input type="file" accept=".json,application/json" onChange={doImport} style={{ display: 'none' }} />
        </label>
        {storage && (
          <div className="faint" style={{ fontSize: 12 }}>
            {storage.usageMB} MB stored{storage.quotaMB ? ` of ~${storage.quotaMB >= 1024 ? `${(storage.quotaMB / 1024).toFixed(1)} GB` : `${storage.quotaMB} MB`}` : ''} · {storage.persisted ? 'protected ✓' : 'best-effort (can be auto-cleared)'}
          </div>
        )}
        {storage && !storage.persisted && <button className="btn ghost block" onClick={doPersist}>Protect my data from auto-cleanup</button>}
        <p className="faint" style={{ fontSize: 12 }}>Your whole log in one file — keep a copy in iCloud/Drive. Restoring merges it back, on any device.</p>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Bite alerts</div>
        {notif.perm === 'unsupported' ? (
          <p className="muted" style={{ fontSize: 13 }}>This device or browser doesn’t support notifications.</p>
        ) : notif.enabled && notif.perm === 'granted' ? (
          <>
            <div className="row between">
              <span style={{ fontWeight: 650, color: 'var(--good)' }}>Alerts on</span>
              <button className="chip" onClick={disableAlerts}>Turn off</button>
            </div>
            <button className="btn ghost block" onClick={testAlert}>Send a test alert</button>
          </>
        ) : (
          <button className="btn primary block" onClick={enableAlerts}>Turn on bite alerts</button>
        )}
        <p className="faint" style={{ fontSize: 12 }}>
          A morning go/no-go and a heads-up ~30&nbsp;min before prime bite windows.{' '}
          {triggersSupported()
            ? 'This device can deliver them even when the app is closed (today’s windows).'
            : 'On this device they arrive while the app is open or recently used — on iPhone, add Keys Angler to your Home Screen for the best shot. There’s no server behind the app, so delivery while it’s fully closed isn’t guaranteed.'}
        </p>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">Extras</div>
        <button className="btn ghost block" onClick={() => downloadICS('keys-angler-seasons.ics', seasonReminderEvents())}>Add season open/close reminders (.ics)</button>
        <div>
          <div style={{ fontWeight: 650 }}>Boat electronics (NMEA-2000)</div>
          <p className="faint" style={{ fontSize: 12 }}>{gatewayStatus().note}</p>
        </div>
        <div>
          <div style={{ fontWeight: 650 }}>Keys tournaments <span className="faint">· sample</span></div>
          <ul className="rules-list">{TOURNAMENTS_SAMPLE.map((t) => <li key={t.name}>{t.name} — {t.when}</li>)}</ul>
        </div>
      </div>

      <div className="card stack-sm">
        <div className="eyebrow">About</div>
        <p className="muted" style={{ fontSize: 13 }}>
          {APP.name} v{APP.version}. Offline-first PWA. Tides from NOAA CO-OPS, marine from Open-Meteo, warnings from NWS,
          regs curated from FWC, sun/moon computed on-device. A planning aid — always verify safety &amp; regulations with official sources.
        </p>
      </div>
    </div>
  )
}
