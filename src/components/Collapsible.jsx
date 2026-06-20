import { useState } from 'react'
import { IcChevron } from './icons.jsx'

// Progressive-disclosure card: shows a title + one-line teaser when closed, the full
// content when opened. Keeps the dashboard calm on the surface while every detail
// stays one tap away. Collapsed by default unless defaultOpen.
export default function Collapsible({ title, teaser, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`card collapsible ${open ? 'open' : ''}`}>
      <button type="button" className="collapsible-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="collapsible-title">
          <span className="eyebrow">{title}</span>
          {!open && teaser ? <span className="collapsible-teaser">{teaser}</span> : null}
        </span>
        <IcChevron className="collapsible-caret" width={18} height={18} />
      </button>
      {open ? <div className="collapsible-body stack-sm">{children}</div> : null}
    </div>
  )
}
