import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { SPECIES } from '../data/species.js'
import { NAV_GROUPS } from '../data/nav.js'
import { IcSearch, IcX } from './icons.jsx'

// One verb: type a fish, a page, or a spot. Fuzzy-matches across the species KB,
// every nav destination, and saved spots; species deep-link into their page.
const PAGES = NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ label: i.label, to: i.to })))

export default function CommandBar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  const spots = useLiveQuery(() => db.spots.toArray(), [], [])

  useEffect(() => {
    const onOpen = () => { setQ(''); setOpen(true) }
    window.addEventListener('ka-search', onOpen)
    return () => window.removeEventListener('ka-search', onOpen)
  }, [])
  useEffect(() => { if (open) { const t = setTimeout(() => inputRef.current?.focus(), 60); return () => clearTimeout(t) } }, [open])

  const go = (to) => { setOpen(false); navigate(to) }

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return null
    const species = SPECIES.filter((x) => `${x.name} ${x.aka || ''}`.toLowerCase().includes(s)).slice(0, 6).map((x) => ({ kind: 'Species', label: x.name, to: `/target?s=${x.id}` }))
    const pages = PAGES.filter((p) => p.label.toLowerCase().includes(s)).slice(0, 5).map((p) => ({ kind: 'Go to', label: p.label, to: p.to }))
    const sp = (spots || []).filter((x) => (x.name || '').toLowerCase().includes(s)).slice(0, 5).map((x) => ({ kind: 'Spot', label: x.name, to: '/map' }))
    return [...species, ...pages, ...sp]
  }, [q, spots])

  if (!open) return null
  return (
    <div className="cmd-wrap" onClick={() => setOpen(false)} role="dialog" aria-label="Search">
      <div className="cmd" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input">
          <IcSearch width={18} height={18} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search species, pages, spots…" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter' && results?.[0]) go(results[0].to) }} />
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><IcX width={18} height={18} /></button>
        </div>
        <div className="cmd-results">
          {results == null && <div className="faint" style={{ fontSize: 13, padding: '10px 6px' }}>Type a fish, a page, or a spot — e.g. “mutton”, “regs”, “knots”, “the hump”.</div>}
          {results && results.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '10px 6px' }}>No matches.</div>}
          {results && results.map((r, i) => (
            <button key={i} className="cmd-row" onClick={() => go(r.to)}>
              <span className="cmd-kind">{r.kind}</span>
              <span style={{ flex: 1 }}>{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
