// Illuminated moon disc rendered from the illuminated fraction + waxing/waning.
// phaseDeg: 0=new, 90=first quarter, 180=full, 270=last quarter (waxing when < 180).
export default function MoonGlyph({ illum = 0.5, phaseDeg = 0, size = 28 }) {
  const r = size / 2 - 1
  const cx = size / 2
  const cy = size / 2
  const f = Math.max(0, Math.min(1, illum))
  const rx = r * Math.abs(2 * f - 1)
  const gibbous = f > 0.5
  // crescent (f<0.5): terminator bulges toward the lit limb → thin sliver.
  // gibbous (f>0.5): terminator bulges across center → most of the disc lit.
  const termSweep = gibbous ? 1 : 0
  const waxing = phaseDeg < 180
  const lit = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx.toFixed(2)} ${r} 0 0 ${termSweep} ${cx} ${cy - r} Z`
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Moon phase">
      <circle cx={cx} cy={cy} r={r} fill="var(--surface-3)" stroke="var(--border-soft)" strokeWidth="1" />
      <path d={lit} fill="var(--gold)" transform={waxing ? undefined : `translate(${size} 0) scale(-1 1)`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-soft)" strokeWidth="1" />
    </svg>
  )
}
