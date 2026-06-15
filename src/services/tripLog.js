// Trip Log write/derive logic — kept out of the page. A "trip" is a calendar day
// on the water; its catches are derived live by date (see useTripCatches), so this
// layer only persists the trip record + its frozen conditions snapshot + folders.
// 100% offline: moon/solunar come from local ephemeris, never the network.
import { db } from '../db/db.js'
import { HOME_PORT, ZONE_BY_ID } from '../config.js'
import { solunarDay } from '../engine/solunar.js'
import { snapshotFromConditions } from './conditions.js'
import { dayLabel as labelFor } from '../utils/format.js'

const pad = (n) => String(n).padStart(2, '0')
export const localDateStr = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
export const parseDateStr = (s) => { const [y, m, d] = (s || '').split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1) }
export const dayMs = (dateStr) => parseDateStr(dateStr).getTime()
export const todayStr = () => localDateStr(Date.now())

const mode = (counts) => { let best = null, n = -1; for (const [k, v] of Object.entries(counts)) if (v > n) { best = k; n = v }; return best }
const partyNum = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null }

const moonFor = (dateStr) => {
  const sol = solunarDay(parseDateStr(dateStr), HOME_PORT.lat, HOME_PORT.lon)
  return { phaseName: sol.moon.phaseName, illum: sol.moon.illum, phaseDeg: sol.moon.phaseDeg }
}

const COND_FIELDS = ['windKn', 'gustKn', 'windDir', 'waveFt', 'sstF', 'pressure', 'pressureTrend', 'tideDir', 'tideFlow']
// Reconstruct a day's conditions from its catches' stored cond snapshots (first
// non-null per field). Returns null if the day carries no usable weather at all.
const reconstructConditions = (conds) => {
  const list = (conds || []).filter(Boolean)
  if (!list.length) return null
  const out = {}; let any = false
  for (const f of COND_FIELDS) { const v = list.map((c) => c?.[f]).find((x) => x != null); out[f] = v ?? null; if (v != null) any = true }
  return any ? out : null
}

// Group a catch list into day-buckets with zone-mode + distinct species + conds.
const groupCatchDays = (catches) => {
  const by = {}
  for (const c of catches || []) {
    const ds = localDateStr(c.caughtAt)
    const g = by[ds] || (by[ds] = { dateStr: ds, ms: dayMs(ds), count: 0, sp: {}, zn: {}, conds: [] })
    g.count++
    if (c.species) g.sp[c.species] = (g.sp[c.species] || 0) + 1
    if (c.zone) g.zn[c.zone] = (g.zn[c.zone] || 0) + 1
    if (c.cond) g.conds.push(c.cond)
  }
  return by
}

// Days he logged catches on but hasn't yet logged a trip for — the backfill feed.
export function deriveTrips(catches, loggedDateStrs) {
  return Object.values(groupCatchDays(catches))
    .filter((g) => !loggedDateStrs.has(g.dateStr))
    .sort((a, b) => b.ms - a.ms)
    .map((g) => ({ dateStr: g.dateStr, ms: g.ms, count: g.count, zoneId: mode(g.zn) || 'reef', species: Object.keys(g.sp), conds: g.conds }))
}

export async function createBackfillTrip(s) {
  // Idempotent: a day already in the log isn't re-added (guards double-tap on "Add all").
  if ((await db.logTrips.where('dateStr').equals(s.dateStr).count()) > 0) return null
  return db.logTrips.add({
    date: s.ms, dateStr: s.dateStr, zoneId: s.zoneId || 'reef', locName: '', title: '',
    partyOf: null, notes: '', favorite: 0, folderIds: [], source: 'backfill', sourceTripId: null,
    score: null, verdict: null, dayLabel: null, moon: moonFor(s.dateStr), tideEvents: null, windows: null,
    conditions: reconstructConditions(s.conds), createdAt: Date.now(),
  })
}

// Manual log. `data` is the live useConditions result (may be null offline / not loaded).
export async function createManualTrip(form, loc, data) {
  // It's a PAST-trip log — clamp a future date down to today (covers the save path
  // regardless of the picker's soft `max`).
  const dateStr = form.dateStr > todayStr() ? todayStr() : form.dateStr
  let conditions = null, score = null, verdict = null, dayLabel = null
  if (dateStr === todayStr() && data) {
    conditions = snapshotFromConditions(data, null).cond
    score = data.nowScore?.score ?? null
    verdict = data.nowScore?.verdict ?? null
    dayLabel = score != null ? labelFor(score) : null
  }
  return db.logTrips.add({
    date: dayMs(dateStr), dateStr, zoneId: form.zoneId || 'reef', locName: loc?.name || '',
    title: (form.title || '').trim(), partyOf: partyNum(form.party), notes: (form.notes || '').trim(),
    favorite: form.favorite ? 1 : 0, folderIds: form.folderIds || [], source: 'manual', sourceTripId: null,
    score, verdict, dayLabel, moon: moonFor(dateStr), tideEvents: null, windows: null, conditions, createdAt: Date.now(),
  })
}

// Graduate a completed planner trip ({ id, plan, meta }) into the log. Idempotent;
// copies the cached plan EXPLICITLY (never spreads — avoids leaking forecastAvailable).
export async function graduateTrip(pt) {
  if (!pt) return null
  const p = pt.plan || {}, meta = pt.meta || {}
  const dateStr = meta.dateStr || localDateStr(new Date(p.date).getTime())
  const c = p.conditions || {}
  // Check-then-add in one transaction so a double-tap can't insert two graduated rows.
  return db.transaction('rw', db.logTrips, async () => {
    if ((await db.logTrips.where('sourceTripId').equals(pt.id).count()) > 0) return null
    return db.logTrips.add({
      date: dayMs(dateStr), dateStr, zoneId: p.zoneId || 'reef', locName: meta.locName || '', title: '',
      partyOf: partyNum(meta.party), notes: (meta.notes || '').trim(),
      favorite: 0, folderIds: [], source: 'graduated', sourceTripId: pt.id,
      score: p.score ?? null, verdict: p.verdict || null, dayLabel: p.score != null ? labelFor(p.score) : null,
      moon: p.moon ? { phaseName: p.moon.phaseName, illum: p.moon.illum, phaseDeg: p.moon.phaseDeg } : moonFor(dateStr),
      tideEvents: p.tideEvents || null, windows: p.windows || null,
      conditions: COND_FIELDS.reduce((o, f) => { o[f] = c[f] ?? null; return o }, {}),
      createdAt: Date.now(),
    })
  })
}

export const toggleFavorite = (t) => db.logTrips.update(t.id, { favorite: t.favorite ? 0 : 1 })
export async function toggleFolder(t, fid) {
  const set = new Set(t.folderIds || []); set.has(fid) ? set.delete(fid) : set.add(fid)
  return db.logTrips.update(t.id, { folderIds: [...set] })
}
export const updateTrip = (id, patch) => db.logTrips.update(id, patch)
export const deleteTrip = (id) => db.logTrips.delete(id)
export const refreshConditions = (trip, dayCatches) => db.logTrips.update(trip.id, { conditions: reconstructConditions((dayCatches || []).map((c) => c.cond)) })

export async function createFolder({ name, kind = 'custom', emoji = '', seedKey = null }) {
  const clean = (name || '').trim(); if (!clean) return null
  // Case-insensitive dedupe: re-use an existing folder of the same name (idempotent).
  const dupe = await db.logFolders.filter((f) => (f.name || '').trim().toLowerCase() === clean.toLowerCase()).first()
  if (dupe) return dupe.id
  return db.logFolders.add({ name: clean, kind, emoji, seedKey, sort: await db.logFolders.count(), createdAt: Date.now() })
}
export const renameFolder = (fid, name) => db.logFolders.update(fid, { name: (name || '').trim() })
export async function deleteFolder(fid) {
  return db.transaction('rw', db.logTrips, db.logFolders, async () => {
    await db.logTrips.where('folderIds').equals(fid).modify((t) => { t.folderIds = (t.folderIds || []).filter((x) => x !== fid) })
    await db.logFolders.delete(fid)
  })
}

// Smart folder seeds from catch history: top species + top zones.
export function suggestFolders(catches) {
  const sp = {}, zn = {}
  for (const c of catches || []) { if (c.species) sp[c.species] = (sp[c.species] || 0) + 1; if (c.zone) zn[c.zone] = (zn[c.zone] || 0) + 1 }
  const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k)
  return [
    ...top(sp, 3).map((s) => ({ name: s, kind: 'species', seedKey: s, emoji: '' })),
    ...top(zn, 3).map((z) => ({ name: ZONE_BY_ID[z]?.short || z, kind: 'place', seedKey: z, emoji: '' })),
  ]
}
