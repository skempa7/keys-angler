import { useState } from 'react'
import { HOME_PORT, APP } from '../config.js'
import { useTheme } from '../hooks/useTheme.js'
import { useActiveLocation, setActiveLocation, resetActiveLocation } from '../hooks/useActiveLocation.js'
import { evictSource } from '../services/cache.js'
import { downloadICS, seasonReminderEvents, gatewayStatus, TOURNAMENTS_SAMPLE } from '../services/phase2.js'
import { db } from '../db/db.js'

export default function Settings() {
  const loc = useActiveLocation()
  const { theme, setTheme } = useTheme()
  const [form, setForm] = useState({ name: loc.name, lat: loc.lat, lon: loc.lon, radiusNm: loc.radiusNm || 30 })
  const [msg, setMsg] = useState('')

  const note = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500) }

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
        <button className="btn ghost block" onClick={refreshData}>Clear cached conditions (force refresh)</button>
        <button className="btn ghost block" onClick={clearPersonal} style={{ color: 'var(--bad)' }}>Delete my catches, spots & gear</button>
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
