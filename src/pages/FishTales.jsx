import { useState } from 'react'
import { TALES, CATEGORIES, taleOfTheDay, talesByCategory } from '../data/fishTales.js'
import { useOldSalt } from '../hooks/useOldSalt.js'
import { IcBook } from '../components/icons.jsx'

const CAT_ORDER = ['history', 'place', 'species', 'wisdom', 'folklore']

export default function FishTales() {
  const { on, toggle } = useOldSalt()
  const today = taleOfTheDay(new Date())
  const groups = talesByCategory()
  const [filter, setFilter] = useState('all')

  const shown = filter === 'all' ? groups : groups.filter((g) => g.key === filter)

  return (
    <div className="stack">
      <header className="page-head">
        <div className="eyebrow">Keys Angler</div>
        <h1 className="h1">Fish Tales</h1>
        <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
          A little Upper-Keys lore with your morning check — history, old-timer wisdom, and the places &amp; fish that built this fishery.
        </p>
      </header>

      {/* Old Salt toggle lives here too, since it's the personality corner of the app. */}
      <div className="card row between" style={{ alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700 }}>⚓ Old Salt mode</div>
          <div className="faint" style={{ fontSize: 12 }}>Get your daily read from a weathered Keys captain.</div>
        </div>
        <button className={`chip ${on ? 'active' : ''}`} onClick={toggle} aria-pressed={on} style={{ flex: 'none', whiteSpace: 'nowrap', minWidth: 56 }}>
          {on ? 'On' : 'Off'}
        </button>
      </div>

      {today && (
        <div className="card stack-sm tale-feature">
          <div className="eyebrow">Today in Keys fishing</div>
          <div className="tale-head">
            <h2 className="h2" style={{ margin: 0 }}>{today.title}</h2>
            {today.tag && <span className="chip sm">{today.tag}</span>}
          </div>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{today.body}</p>
          <div className="faint" style={{ fontSize: 12 }}>
            {CATEGORIES[today.category] || today.category}{today.era ? ` · ${today.era}` : ''}
          </div>
        </div>
      )}

      {groups.length > 1 && (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          {CAT_ORDER.filter((c) => groups.some((g) => g.key === c)).map((c) => (
            <button key={c} className={`chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{CATEGORIES[c] || c}</button>
          ))}
        </div>
      )}

      {shown.map((g) => (
        <section key={g.key} className="stack-sm">
          <div className="eyebrow">{g.label}</div>
          {g.items.map((t) => (
            <article key={t.id} className="card stack-sm tale-card">
              <div className="tale-head">
                <strong style={{ fontSize: 16 }}>{t.title}</strong>
                {t.tag && <span className="chip sm">{t.tag}</span>}
              </div>
              <p className="muted" style={{ margin: 0, lineHeight: 1.5, fontSize: 14 }}>{t.body}</p>
              {t.era && <div className="faint" style={{ fontSize: 11 }}>{t.era}</div>}
            </article>
          ))}
        </section>
      ))}

      {!TALES.length && (
        <div className="card row" style={{ gap: 10, alignItems: 'center' }}>
          <IcBook width={20} height={20} />
          <span className="muted">Tales are on their way.</span>
        </div>
      )}
    </div>
  )
}
