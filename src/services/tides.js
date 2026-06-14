// NOAA CO-OPS tide & current predictions. Keyless + CORS-open.
// Keys tide stations are all subordinate → interval=hilo only; datum=MLLW mandatory.
import { fetchJson } from './http.js'
import { parseNoaaTime } from '../engine/tideStage.js'

const BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'
const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`

export function fetchTidePredictions(stationId, beginDate, endDate) {
  const url =
    `${BASE}?product=predictions&application=keys_angler` +
    `&begin_date=${ymd(beginDate)}&end_date=${ymd(endDate)}` +
    `&datum=MLLW&station=${stationId}&time_zone=lst_ldt&units=english&interval=hilo&format=json`
  return fetchJson(url)
}

export function fetchCurrentPredictions(stationId, beginDate, endDate) {
  const url =
    `${BASE}?product=currents_predictions&application=keys_angler` +
    `&begin_date=${ymd(beginDate)}&end_date=${ymd(endDate)}` +
    `&station=${stationId}&time_zone=lst_ldt&units=english&interval=MAX_SLACK&format=json`
  return fetchJson(url)
}

// currents JSON differs from tides: current_predictions.cp[] with Type/Time/Velocity_Major.
export function parseCurrents(json) {
  const cp = json?.current_predictions?.cp || []
  return cp
    .map((c) => ({
      time: parseNoaaTime(c.Time),
      type: c.Type, // 'slack' | 'ebb' | 'flood'
      velocity: parseFloat(c.Velocity_Major),
    }))
    .filter((c) => c.time)
}
