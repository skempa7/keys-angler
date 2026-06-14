// Phase 2 / stretch features — kept lightweight so they don't block the MVP.
// Calendar (.ics) export is fully real; NMEA-2000 + tournaments are honest stubs
// with the data model designed so a real implementation can slot in later.

// ---- Calendar (.ics) — real -------------------------------------------------
const p2 = (n) => String(n).padStart(2, '0')
const icsEscape = (s) => (s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
const dtUTC = (d) => `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}00Z`
const dateVal = (d) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`

export function buildICS(events) {
  const now = dtUTC(new Date())
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Keys Angler//EN', 'CALSCALE:GREGORIAN']
  events.forEach((e, i) => {
    lines.push('BEGIN:VEVENT', `UID:keysangler-${i}-${e.start ? dateVal(e.start) : now}@keys-angler`, `DTSTAMP:${now}`)
    if (e.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dateVal(e.start)}`)
    } else {
      lines.push(`DTSTART:${dtUTC(e.start)}`, `DTEND:${dtUTC(e.end || e.start)}`)
    }
    lines.push(`SUMMARY:${icsEscape(e.title)}`)
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`)
    lines.push('END:VEVENT')
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadICS(filename, events) {
  const blob = new Blob([buildICS(events)], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function tripCalendarEvent(plan, meta) {
  const d = new Date(plan.date)
  const [dh, dm] = (meta.departTime || '06:30').split(':').map(Number)
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), dh || 6, dm || 30)
  const end = plan.sunset ? new Date(plan.sunset) : new Date(start.getTime() + 8 * 3600e3)
  const best = plan.windows?.[0]
  return {
    title: `Fishing — ${plan.zoneName || 'Keys'} (${plan.verdict?.label || ''})`,
    start,
    end,
    description: [
      `Score ${plan.score}/100.`,
      best ? `Best window ~${start.toDateString()}.` : '',
      `Targeting: ${(plan.biting || []).map((b) => b.name).join(', ')}.`,
      'Built in Keys Angler.',
    ].filter(Boolean).join(' '),
  }
}

// Season open/close reminders (all-day) for the current cycle.
export function seasonReminderEvents(year = new Date().getFullYear()) {
  const lobMini = (() => { const d = new Date(year, 6, 31); while (d.getDay() !== 3) d.setDate(d.getDate() - 1); return new Date(year, 6, d.getDate()) })()
  return [
    { title: 'Stone crab season OPENS', start: new Date(year, 9, 15), allDay: true },
    { title: 'Stone crab season CLOSES', start: new Date(year + 1, 4, 1), allDay: true },
    { title: 'Lobster mini-season (2 days)', start: lobMini, allDay: true },
    { title: 'Lobster regular season OPENS', start: new Date(year, 7, 6), allDay: true },
  ]
}

// ---- NMEA-2000 gateway — Phase 2 stub --------------------------------------
// Phones can't read N2K directly. A WiFi gateway (Yacht Devices, Digital Yacht)
// exposes the bus over TCP/UDP; this is the shape the app will consume once bridged.
export const LIVE_DATA_MODEL = {
  source: 'nmea2000-gateway', // 'phone-gps' fallback
  position: { lat: null, lon: null, sogKn: null, cogDeg: null },
  depthFt: null,
  waterTempF: null,
  headingDeg: null,
  windApparent: { speedKn: null, angleDeg: null },
  updatedAt: null,
}
export function gatewayStatus() {
  return {
    connected: false,
    phase: 2,
    note: 'Connect a NMEA-2000 WiFi gateway (Yacht Devices, Digital Yacht) to stream live GPS, depth, water temp & heading into Keys Angler. Bridge ships in a later update.',
  }
}

// ---- Keys tournaments — sample stub ----------------------------------------
export const TOURNAMENTS_SAMPLE = [
  { name: 'Islamorada winter sailfish series', when: 'Dec–Feb' },
  { name: 'Cheeca Lodge Presidential Sailfish Classic', when: 'January' },
  { name: 'Islamorada dolphin (mahi) tournaments', when: 'Spring–Summer' },
  { name: 'Backcountry & flats slam events', when: 'Spring' },
]
