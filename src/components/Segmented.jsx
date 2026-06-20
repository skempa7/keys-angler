// Horizontal segmented control for hub pages — a scrollable pill row of tabs.
export default function Segmented({ tabs, active, onChange }) {
  return (
    <div className="segmented" role="tablist" aria-label="Sections">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          className={`seg ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
