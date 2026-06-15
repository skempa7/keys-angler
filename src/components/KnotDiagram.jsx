// Schematic line-art diagrams for the knot/rig reference. Not surgically accurate —
// a clear visual cue beside the step text. Strokes use theme tokens.
const L = 'var(--accent)'
const HW = 'var(--text-dim)'

export default function KnotDiagram({ kind, width = 132, height = 64 }) {
  const common = { fill: 'none', stroke: L, strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg width={width} height={height} viewBox="0 0 132 64" role="img" aria-label="diagram">
      {kind === 'braid-leader' && (
        <>
          <path d="M6 26 H64" {...common} strokeWidth="1.6" />
          <path d="M6 38 H64" {...common} />
          <path d="M64 26 C84 26 84 38 64 38" {...common} />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${30 + i * 8} 24 l4 16`} stroke={HW} strokeWidth="1.6" />)}
          <path d="M84 32 H126" {...common} />
        </>
      )}
      {kind === 'twist' && (
        <>
          <path d="M8 20 C40 20 40 44 72 44 C104 44 104 20 126 20" {...common} />
          <path d="M8 44 C40 44 40 20 72 20 C104 20 104 44 126 44" {...common} strokeWidth="1.6" />
        </>
      )}
      {kind === 'loop' && (
        <>
          <path d="M6 32 H70" {...common} />
          <path d="M70 32 C70 16 102 16 102 32 C102 48 70 48 70 32" {...common} />
          <path d="M102 32 q12 0 12 10 q0 8 -8 8" stroke={HW} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === 'coil' && (
        <>
          <path d="M6 30 H58" {...common} />
          <line x1="60" y1="20" x2="60" y2="44" stroke={HW} strokeWidth="2.4" />
          {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={66 + i * 11} cy="30" rx="5" ry="9" fill="none" stroke={L} strokeWidth="1.8" />)}
          <path d="M120 30 q10 2 8 14 q-2 8 -10 6" stroke={HW} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === 'knocker' && (
        <>
          <line x1="66" y1="4" x2="66" y2="40" {...common} />
          <ellipse cx="66" cy="26" rx="13" ry="8" fill="var(--surface-3)" stroke={HW} strokeWidth="2" />
          <path d="M66 40 q14 2 12 16 q-2 9 -12 7" stroke={HW} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === 'stinger' && (
        <>
          <path d="M8 32 H44" {...common} />
          <path d="M44 28 l30 8 M44 36 l30 -8" stroke={HW} strokeWidth="1.6" />
          <path d="M74 32 q12 0 12 12 q0 8 -8 8" stroke={HW} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M86 30 H112" stroke={L} strokeWidth="1.8" />
          <path d="M112 28 q8 0 8 9 q0 6 -6 6 M112 28 q8 0 14 6" stroke={HW} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      )}
      {kind === 'freeline' && (
        <>
          <path d="M6 30 q20 -8 40 0 t40 0 t40 0" {...common} strokeWidth="1.8" />
          <ellipse cx="96" cy="34" rx="14" ry="7" fill="var(--surface-3)" stroke={HW} strokeWidth="1.6" />
          <path d="M110 34 q10 2 8 14 q-2 8 -10 6" stroke={HW} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
