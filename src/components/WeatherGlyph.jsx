// Weather graphics keyed to Open-Meteo WMO codes, with day/night variants and
// (optionally) subtle motion. viewBox 64×64; colors come from theme tokens so it
// works in both sea & sunlight themes. Snow codes are treated as rain (Keys).
const typeFor = (code) => {
  if (code == null) return 'clear'
  if (code === 0) return 'clear'
  if (code <= 2) return 'partly'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 95) return 'storm'
  if ((code >= 51 && code <= 67) || (code >= 71 && code <= 86)) return 'rain'
  return 'cloudy'
}

const Sun = ({ cx = 32, cy = 28, r = 11, animate }) => (
  <>
    <g className={animate ? 'wg-rays' : undefined}>
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1={cx} y1={cy - r - 7} x2={cx} y2={cy - r - 2} transform={`rotate(${i * 45} ${cx} ${cy})`} stroke="var(--gold)" strokeWidth="2.4" strokeLinecap="round" />
      ))}
    </g>
    <circle cx={cx} cy={cy} r={r} fill="var(--gold)" />
  </>
)

const Moon = ({ cx = 30, cy = 28, r = 12 }) => (
  <path d={`M${cx + r} ${cy} a${r} ${r} 0 1 1 -${r} -${r} a${r * 0.78} ${r * 0.78} 0 0 0 ${r} ${r} z`} fill="var(--gold)" opacity="0.92" />
)

const Cloud = ({ cx = 32, cy = 36, s = 1, fill = 'var(--text-dim)' }) => (
  <g fill={fill}>
    <circle cx={cx - 10 * s} cy={cy} r={9 * s} />
    <circle cx={cx + 9 * s} cy={cy - 1 * s} r={11 * s} />
    <circle cx={cx} cy={cy - 9 * s} r={10 * s} />
    <rect x={cx - 19 * s} y={cy} width={38 * s} height={11 * s} rx={6 * s} />
  </g>
)

const Drops = ({ animate }) => (
  <g className={animate ? 'wg-rain' : undefined} stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round">
    <line x1="24" y1="49" x2="22" y2="56" />
    <line x1="32" y1="49" x2="30" y2="56" />
    <line x1="40" y1="49" x2="38" y2="56" />
  </g>
)

export default function WeatherGlyph({ code, night = false, size = 64, animate = false }) {
  const t = typeFor(code)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="weather">
      {t === 'clear' && (night ? <Moon /> : <Sun animate={animate} />)}
      {t === 'partly' && (
        <>
          {night ? <Moon cx={24} cy={24} r={9} /> : <Sun cx={24} cy={23} r={8} animate={animate} />}
          <Cloud cx={36} cy={40} fill="var(--text-dim)" />
        </>
      )}
      {t === 'cloudy' && <Cloud cx={32} cy={34} s={1.05} />}
      {t === 'fog' && (
        <>
          <Cloud cx={32} cy={30} />
          <g stroke="var(--text-faint)" strokeWidth="2.4" strokeLinecap="round">
            <line x1="16" y1="50" x2="44" y2="50" />
            <line x1="20" y1="57" x2="48" y2="57" />
          </g>
        </>
      )}
      {t === 'rain' && (<><Cloud cx={32} cy={32} /><Drops animate={animate} /></>)}
      {t === 'storm' && (<><Cloud cx={32} cy={30} fill="var(--text-dim)" /><path d="M33 44l-8 10h6l-3 8 10-13h-6z" fill="var(--gold)" /></>)}
    </svg>
  )
}
