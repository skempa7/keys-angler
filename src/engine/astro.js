// Offline sun/moon ephemeris via astronomy-engine (bundled, no network).
// Provides the raw celestial events the solunar engine turns into feeding windows.
import {
  Observer,
  Body,
  SearchRiseSet,
  SearchHourAngle,
  MoonPhase,
  Illumination,
} from 'astronomy-engine'

const localDayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
const localDayEnd = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

function riseOrSet(body, observer, direction, fromDate) {
  // direction: +1 rise, -1 set. Search within ~1.2 days from local midnight.
  const t = SearchRiseSet(body, observer, direction, fromDate, 1.2)
  return t ? t.date : null
}

// Meridian crossings within the local day. hourAngle 0 = upper transit (overhead),
// 12 = lower transit (underfoot / anti-transit). Either may occur 0–2× per calendar day.
function meridianCrossings(observer, hourAngle, dayStart, dayEnd) {
  const events = []
  let cursor = dayStart
  for (let i = 0; i < 3; i++) {
    const ev = SearchHourAngle(Body.Moon, observer, hourAngle, cursor, +1)
    if (!ev) break
    const when = ev.time.date
    if (when > dayEnd) break
    events.push({ time: when, altitude: ev.hor.altitude })
    cursor = new Date(when.getTime() + 60_000) // step 1 min past to find the next
  }
  return events
}

const PHASE_NAMES = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
]
export function phaseName(deg) {
  // 8 segments of 45°, centered on the principal phases.
  const idx = Math.round(deg / 45) % 8
  return PHASE_NAMES[idx]
}

// Everything the solunar engine needs for one day at one location.
export function dayAstro(date, lat, lon) {
  const observer = new Observer(lat, lon, 0)
  const dayStart = localDayStart(date)
  const dayEnd = localDayEnd(date)
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)

  const phaseDeg = MoonPhase(noon)
  const illum = Illumination(Body.Moon, noon).phase_fraction

  return {
    date: dayStart,
    sun: {
      rise: riseOrSet(Body.Sun, observer, +1, dayStart),
      set: riseOrSet(Body.Sun, observer, -1, dayStart),
    },
    moon: {
      rise: riseOrSet(Body.Moon, observer, +1, dayStart),
      set: riseOrSet(Body.Moon, observer, -1, dayStart),
      upperTransits: meridianCrossings(observer, 0, dayStart, dayEnd),
      lowerTransits: meridianCrossings(observer, 12, dayStart, dayEnd),
      phaseDeg,
      illum, // 0..1 illuminated fraction
      phaseName: phaseName(phaseDeg),
    },
  }
}
