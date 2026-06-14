import { useCallback, useEffect, useState } from 'react'

const KEY = 'ka-theme'
const THEMES = ['sea', 'sun']

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && THEMES.includes(saved)) return saved
  } catch {
    /* ignore */
  }
  return 'sea'
}

// Applies data-theme to <html>, persists choice, toggles between sea/sun.
export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'sun' ? '#ffffff' : '#06141b')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const setTheme = useCallback((t) => setThemeState(THEMES.includes(t) ? t : 'sea'), [])
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'sea' ? 'sun' : 'sea')),
    [],
  )

  return { theme, setTheme, toggleTheme }
}
