import { useCallback, useEffect, useState } from 'react'

// "Old Salt" mode — when on, the dashboard report gets a weathered Keys-captain
// voice line. Shared module-level state (same pattern as useTheme) so every
// instance — the Settings toggle, the dashboard, the Fish Tales page — stays in sync.
const KEY = 'ka-oldsalt'
function read() { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

let current = read()
const subs = new Set()
function commit(next) {
  current = !!next
  try { localStorage.setItem(KEY, current ? '1' : '0') } catch { /* ignore */ }
  subs.forEach((fn) => fn(current))
}

export function isOldSalt() { return current }

export function useOldSalt() {
  const [on, setLocal] = useState(current)
  useEffect(() => {
    const fn = (v) => setLocal(v)
    subs.add(fn)
    if (on !== current) setLocal(current) // catch a commit between render and subscribe
    return () => subs.delete(fn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const setOn = useCallback((v) => commit(v), [])
  const toggle = useCallback(() => commit(!current), [])
  return { on, setOn, toggle }
}
