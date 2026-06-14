// Arrow pointing the direction the wind is blowing TOWARD (downwind).
// dir = meteorological direction the wind comes FROM (degrees).
export default function WindArrow({ dir, size = 20 }) {
  if (dir == null || Number.isNaN(dir)) return null
  const rot = (dir + 180) % 360
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rot}deg)`, color: 'var(--accent)' }} aria-hidden="true">
      <path d="M12 4v15M12 4l-5 6M12 4l5 6" />
    </svg>
  )
}
