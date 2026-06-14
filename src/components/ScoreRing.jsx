import { toneColor } from '../utils/format.js'

// Circular 0–100 gauge, colored by verdict tone.
export default function ScoreRing({ score = 0, tone = 'ok', size = 188 }) {
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100)
  const color = toneColor(tone)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Conditions score ${score} of 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .7s var(--ease)' }}
      />
      <text x="50%" y="49%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.3} fontWeight="800" fill="var(--text)">
        {score}
      </text>
      <text x="50%" y="67%" textAnchor="middle" fontSize={size * 0.08} fill="var(--text-faint)" letterSpacing="2">
        / 100
      </text>
    </svg>
  )
}
