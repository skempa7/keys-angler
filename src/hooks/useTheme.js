import { useCallback, useEffect, useState } from 'react'

const KEY = 'ka-theme'
const THEMES = ['sea', 'sun', 'auto']
const isDay = () => { const h = new Date().getHours(); return h >= 7 && h < 19 }
// 'auto' resolves to Sunlight (high-contrast) by day, Sea (dark) at night.
export const resolveTheme = (t) => (t === 'auto' ? (isDay() ? 'sun' : 'sea') : t)

export function getInitialTheme() {
  try { const saved = localStorage.getItem(KEY); if (saved && THEMES.includes(saved)) return saved } catch { /* ignore */ }
  return 'sea'
}

// Shared, module-level theme state so EVERY useTheme() instance stays in sync. Previously
// each instance had its own useState, so a toggle in the top bar never reached SkyBackground
// — it kept the dark --bg-grad painted under the light theme (dark body, light text). Now a
// single source of truth notifies all subscribers, so `applied` updates everywhere at once.
let current = getInitialTheme()
const subs = new Set()
function commit(next) {
  current = THEMES.includes(next) ? next : 'sea'
  try { localStorage.setItem(KEY, current) } catch { /* ignore */ }
  subs.forEach((fn) => fn(current))
}
function applyAttr(t) {
  const a = resolveTheme(t)
  document.documentElement.setAttribute('data-theme', a)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', a === 'sun' ? '#eef7fb' : '#05080c')
}

// Applies the resolved data-theme to <html>, persists the choice (incl. 'auto'),
// and re-evaluates 'auto' on a timer so it flips at dawn/dusk on its own.
export function useTheme() {
  const [theme, setLocal] = useState(current)
  const [, tick] = useState(0)

  useEffect(() => {
    const fn = (t) => setLocal(t)
    subs.add(fn)
    if (theme !== current) setLocal(current) // catch a commit between render and subscribe
    return () => subs.delete(fn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyAttr(theme)
    if (theme === 'auto') { const id = setInterval(() => { applyAttr('auto'); tick((n) => n + 1) }, 5 * 60000); return () => clearInterval(id) }
    return undefined
  }, [theme])

  const applied = resolveTheme(theme)
  const setTheme = useCallback((t) => commit(t), [])
  // The top-bar toggle is a manual override: flip away from whatever's showing.
  const toggleTheme = useCallback(() => commit(resolveTheme(current) === 'sea' ? 'sun' : 'sea'), [])

  return { theme, applied, setTheme, toggleTheme }
}
