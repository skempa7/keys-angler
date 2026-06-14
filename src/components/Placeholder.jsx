// Intentional "under construction" surface for modules not yet wired.
// Each is replaced by its real page as the build progresses.
export default function Placeholder({ title, icon = '🪝', note }) {
  return (
    <div className="stack">
      <div className="page-head">
        <div className="eyebrow">Keys Angler</div>
        <h1 className="h1">{title}</h1>
      </div>
      <div className="card placeholder">
        <div className="big">{icon}</div>
        <div className="h2">{title}</div>
        <p className="muted" style={{ maxWidth: 420 }}>
          {note || 'This module is being built. The foundation, offline engine, and design system are in place — content lands next.'}
        </p>
      </div>
    </div>
  )
}
