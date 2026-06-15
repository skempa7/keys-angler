// Back up / restore the whole on-device logbook to one file. The catch corpus is
// the soul of the app (calibration, edge, heatmap, recap) and lives on one phone —
// this makes it survivable. Skips `cache` (regenerable API payloads).
import { db } from '../db/db.js'

const TABLES = ['settings', 'locations', 'boats', 'gear', 'catches', 'spots', 'trips', 'slams', 'trapSets', 'logTrips', 'logFolders']
const countRows = (tables) => Object.values(tables).reduce((n, a) => n + (a?.length || 0), 0)
const stamp = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }

export async function exportAll() {
  const out = { app: 'keys-angler', version: 1, exportedAt: Date.now(), tables: {} }
  for (const t of TABLES) if (db[t]) out.tables[t] = await db[t].toArray()
  const blob = new Blob([JSON.stringify(out)], { type: 'application/json' })
  const name = `keys-angler-backup-${stamp()}.ka.json`
  const total = countRows(out.tables)
  if (window.showSaveFilePicker) {
    try {
      const h = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: 'Keys Angler backup', accept: { 'application/json': ['.json'] } }] })
      const w = await h.createWritable(); await w.write(blob); await w.close()
      return { ok: true, total }
    } catch (e) { if (e?.name === 'AbortError') return { ok: false, aborted: true } /* fall through to download */ }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
  return { ok: true, total }
}

export async function importAll(file) {
  const data = JSON.parse(await file.text())
  if (data?.app !== 'keys-angler' || !data.tables) throw new Error('That isn’t a Keys Angler backup file.')
  const tableNames = Object.keys(data.tables).filter((t) => db[t])
  let restored = 0
  await db.transaction('rw', tableNames.map((t) => db[t]), async () => {
    for (const t of tableNames) {
      const rows = data.tables[t]
      if (Array.isArray(rows) && rows.length) { await db[t].bulkPut(rows); restored += rows.length }
    }
  })
  return { restored }
}

export async function storageInfo() {
  if (!navigator.storage?.estimate) return null
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false
  return { usageMB: Math.round((usage / 1048576) * 10) / 10, quotaMB: Math.round(quota / 1048576), persisted }
}
export const requestPersist = async () => (navigator.storage?.persist ? navigator.storage.persist() : false)
