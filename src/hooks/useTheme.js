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

// Applies the resolved data-theme to <html>, persists the choice (incl. 'auto'),
// and re-evaluates 'auto' on a timer so it flips at dawn/dusk on its own.
export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [applied, setApplied] = useState(() => resolveTheme(getInitialTheme()))

  useEffect(() => {
    const apply = () => {
      const a = resolveTheme(theme)
      setApplied(a)
      document.documentElement.setAttribute('data-theme', a)
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', a === 'sun' ? '#ffffff' : '#06141b')
    }
    apply()
    try { localStorage.setItem(KEY, theme) } catch { /* ignore */ }
    if (theme === 'auto') { const id = setInterval(apply, 5 * 60000); return () => clearInterval(id) }
    return undefined
  }, [theme])

  const setTheme = useCallback((t) => setThemeState(THEMES.includes(t) ? t : 'sea'), [])
  // The top-bar toggle is a manual override: flip away from whatever's showing.
  const toggleTheme = useCallback(() => setThemeState((t) => (resolveTheme(t) === 'sea' ? 'sun' : 'sea')), [])

  return { theme, applied, setTheme, toggleTheme }
}
