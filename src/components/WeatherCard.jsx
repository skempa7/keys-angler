import WeatherGlyph from './WeatherGlyph.jsx'
import { weatherLabel, compass, uvLabel, uvColor, fmtHour } from '../utils/format.js'

// Home-screen weather panel: big current temp + condition, the day's key numbers,
// and an hourly strip. Driven by data.weatherToday (offline-capable, cached).
export default function WeatherCard({ wx, sun, when }) {
  if (!wx) return null
  const isNight = (t) => (sun?.rise && sun?.set ? t < sun.rise || t > sun.set : false)
  const night = when ? isNight(when) : false
  const temp = wx.tempF
  const rain = wx.precipMax ?? wx.precipProb
  const uv = wx.uvMax ?? wx.uv

  return (
    <div className="card weather-card">
      <div className="wx-top">
        <WeatherGlyph code={wx.code} night={night} size={72} animate />
        <div className="wx-main">
          <div className="wx-temp">{temp != null ? `${Math.round(temp)}°` : '—'}</div>
          <div className="wx-cond">{weatherLabel(wx.code) || 'Conditions'}</div>
        </div>
        <div className="wx-hilo">
          {wx.feelsF != null && <div className="wx-feels">Feels {Math.round(wx.feelsF)}°</div>}
          {wx.hiF != null && <div><span className="faint">H</span> {Math.round(wx.hiF)}°  <span className="faint">L</span> {wx.loF != null ? `${Math.round(wx.loF)}°` : '—'}</div>}
        </div>
      </div>

      <div className="wx-metrics">
        <Metric label="Humidity" value={wx.humidity != null ? `${Math.round(wx.humidity)}%` : '—'} />
        <Metric label="Rain" value={rain != null ? `${Math.round(rain)}%` : '—'} />
        <Metric label="Wind" value={wx.windKn != null ? `${Math.round(wx.windKn)}` : '—'} sub={wx.windKn != null ? `kn ${wx.windDir != null ? compass(wx.windDir) : ''}`.trim() : ''} />
        <Metric label="UV" value={uv != null ? `${Math.round(uv)}` : '—'} sub={uvLabel(uv)} color={uvColor(uv)} />
      </div>

      {wx.hourly?.length > 1 && (
        <div className="wx-hours">
          {wx.hourly.map((h, i) => (
            <div key={i} className="wx-hour">
              <div className="wx-hour-t">{i === 0 ? 'Now' : fmtHour(h.hour)}</div>
              <WeatherGlyph code={h.code} night={isNight(h.time)} size={26} />
              <div className="wx-hour-temp">{h.tempF != null ? `${Math.round(h.tempF)}°` : ''}</div>
              <div className="wx-hour-rain">{h.precipProb != null && h.precipProb >= 10 ? `${Math.round(h.precipProb)}%` : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, sub, color }) {
  return (
    <div className="wx-metric">
      <div className="faint">{label}</div>
      <div className="wx-mv" style={color ? { color } : undefined}>{value}</div>
      {sub ? <div className="wx-msub">{sub}</div> : null}
    </div>
  )
}
