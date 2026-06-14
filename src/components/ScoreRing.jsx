import { useEffect, useRef, useState } from 'react'
import { toneColor } from '../utils/format.js'

// Count up to the target value with an ease-out, respecting reduced-motion.
function useCountUp(target, ms = 750) {
  const [v, setV] = useState(target)
  const raf = useRef()
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setV(target)
      return
    }
    const start = performance.now()
    const from = 0
    cancelAnimationFrame(raf.current)
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms)
      setV(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, ms])
  return v
}

// Circular 0–100 gauge, colored by verdict tone, with the number counting up.
export default function ScoreRing({ score = 0, tone = 'ok', size = 188 }) {
  const shown = useCountUp(score)
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
      <text x="50%" y="49%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.3} fontWeight="700" fill="var(--text)" style={{ fontFamily: 'var(--font-display)' }}>
        {shown}
      </text>
      <text x="50%" y="67%" textAnchor="middle" fontSize={size * 0.08} fill="var(--text-faint)" letterSpacing="2">
        / 100
      </text>
    </svg>
  )
}
