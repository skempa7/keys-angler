// Right-moment alerts for a backend-less PWA. Honest about the limits:
//  • There's no push server (this is a static app), so we can't wake a long-closed
//    app. Two best-effort paths, picked by capability:
//      1) Notification Triggers (TimestampTrigger) — Chromium / installed Android
//         PWAs. These fire even if the tab is closed, for today's horizon. We
//         re-arm them every time the dashboard loads (tags make it idempotent).
//      2) Fallback (Safari/iOS/Firefox): show the morning go/no-go when he opens
//         the app in the morning, and arm in-session timers for windows coming up
//         while the app stays open.
//  • iOS delivers web notifications only for a Home-Screen-installed PWA (16.4+),
//    and background delivery is limited. The Settings UI states all of this plainly.
import { fmtTime } from '../utils/format.js'

const ICON = `${import.meta.env.BASE_URL}icons/icon-192.png`
const ENABLED = 'ka_notify'
const MORNING_SENT = 'ka_morning_sent'

export const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
export const notifyPermission = () => (notifySupported() ? Notification.permission : 'unsupported')
export const triggersSupported = () => { try { return 'showTrigger' in Notification.prototype } catch { return false } }
export const notifyEnabled = () => { try { return localStorage.getItem(ENABLED) === '1' } catch { return false } }
export const setNotifyEnabled = (v) => { try { localStorage.setItem(ENABLED, v ? '1' : '0') } catch { /* no storage */ } }

export async function requestNotify() {
  if (!notifySupported()) return 'unsupported'
  try { return await Notification.requestPermission() } catch { return 'denied' }
}

const swReg = async () => { try { return await navigator.serviceWorker.ready } catch { return null } }
const ymd = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
const bestWindowLabel = (today) => (today?.windows?.[0] ? fmtTime(today.windows[0].start) : 'TBD')

export async function sendTest() {
  const r = await swReg(); if (!r) return false
  await r.showNotification('Keys Angler', {
    body: 'Alerts are on. You’ll get a morning go/no-go and a heads-up before prime bite windows.',
    icon: ICON, badge: ICON, tag: 'ka-test',
  })
  return true
}

// Idempotent: re-arm today's alerts. Safe to call on every dashboard load.
export async function armAlerts(data) {
  if (!notifyEnabled() || notifyPermission() !== 'granted' || !data) return { mechanism: 'off', scheduled: 0 }
  const r = await swReg(); if (!r) return { mechanism: 'none', scheduled: 0 }
  const now = Date.now()
  const today = data.today
  const windows = (today?.windows || []).filter((w) => w.strength === 'Prime' || w.strength === 'Strong')
  const morningBody = `${today?.verdict?.label || 'See the call'} — best window ${bestWindowLabel(today)}.`

  if (triggersSupported()) {
    let scheduled = 0
    const m = new Date(now); m.setHours(6, 30, 0, 0)
    if (m.getTime() > now && today) {
      await r.showNotification('Today on the water', { body: morningBody, icon: ICON, badge: ICON, tag: 'ka-morning', showTrigger: new window.TimestampTrigger(m.getTime()) })
      scheduled++
    }
    for (const w of windows) {
      const fire = w.start.getTime() - 30 * 60000
      if (fire > now) {
        await r.showNotification('Bite window soon', { body: `${w.strength} window ~${fmtTime(w.start)} — ${w.triggers?.[0]?.label || 'solunar + tide line up'}.`, icon: ICON, badge: ICON, tag: `ka-win-${w.start.getTime()}`, showTrigger: new window.TimestampTrigger(fire) })
        scheduled++
      }
    }
    return { mechanism: 'trigger', scheduled }
  }

  // Fallback: morning call on open (once/day) + in-session timers for near windows.
  let scheduled = 0
  const h = new Date(now).getHours()
  try {
    if (h >= 5 && h < 11 && localStorage.getItem(MORNING_SENT) !== ymd(new Date(now)) && today) {
      await r.showNotification('Today on the water', { body: morningBody, icon: ICON, badge: ICON, tag: 'ka-morning' })
      localStorage.setItem(MORNING_SENT, ymd(new Date(now)))
      scheduled++
    }
  } catch { /* no storage */ }
  for (const w of windows) {
    const delay = w.start.getTime() - 30 * 60000 - now
    if (delay > 0 && delay < 6 * 3600e3) {
      setTimeout(() => r.showNotification('Bite window soon', { body: `${w.strength} window ~${fmtTime(w.start)} — ${w.triggers?.[0]?.label || 'solunar + tide'}.`, icon: ICON, badge: ICON, tag: `ka-win-${w.start.getTime()}` }).catch(() => {}), delay)
      scheduled++
    }
  }
  return { mechanism: 'timer', scheduled }
}
