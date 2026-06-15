// Friendly empty state: a line-art glyph in a soft ring, a title, and a hint.
// Used wherever a list starts out blank so the first run feels designed, not broken.
export default function EmptyState({ icon: Icon, title, note, action }) {
  return (
    <div className="card empty-state">
      {Icon && <span className="empty-state-glyph"><Icon width={28} height={28} /></span>}
      <div className="empty-state-title">{title}</div>
      {note && <p className="muted" style={{ margin: 0, maxWidth: 320 }}>{note}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
