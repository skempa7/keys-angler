import { useEffect } from 'react'
import { useTheme } from '../hooks/useTheme.js'
import { solunarDay } from '../engine/solunar.js'
import { HOME_PORT } from '../config.js'

// Living sky: the app background follows the real sun — pre-dawn indigo, first-light
// peach, daylight aqua, golden-hour amber, dusk teal, deep night. Drives the existing
// --bg-grad var (so it cross-fades via the body transition) and only in the Sea theme
// — the Sunlight theme stays flat for glare. Reduced-motion just snaps (global rule).
const PHASES = {
  night: 'radial-gradient(1150px 720px at 72% -12%, #0b1b34 0%, #050d16 60%)',
  predawn: 'radial-gradient(1150px 720px at 72% -12%, #15243f 0%, #070f1a 60%)',
  dawn: 'radial-gradient(1150px 740px at 74% -14%, #3a3a5e 0%, #4a3340 32%, #08131e 66%)',
  day: 'radial-gradient(1200px 760px at 72% -12%, #0c2c39 0%, #06141b 58%)',
  golden: 'radial-gradient(1150px 740px at 74% -12%, #51401f 0%, #1a2730 46%, #06121a 72%)',
  dusk: 'radial-gradient(1150px 740px at 74% -10%, #1f3148 0%, #112636 42%, #060f18 72%)',
}
function phaseNow(sun, now) {
  const h = now.getHours() + now.getMinutes() / 60
  const rise = sun?.rise ? sun.rise.getHours() + sun.rise.getMinutes() / 60 : 6.5
  const set = sun?.set ? sun.set.getHours() + sun.set.getMinutes() / 60 : 20
  if (h < rise - 1.2 || h >= set + 1.3) return 'night'
  if (h < rise) return 'predawn'
  if (h < rise + 1.2) return 'dawn'
  if (h < set - 1.3) return 'day'
  if (h < set + 0.3) return 'golden'
  return 'dusk'
}

export default function SkyBackground() {
  const { applied } = useTheme()
  useEffect(() => {
    if (applied !== 'sea') { document.documentElement.style.removeProperty('--bg-grad'); return undefined }
    const apply = () => {
      const sun = solunarDay(new Date(), HOME_PORT.lat, HOME_PORT.lon).sun
      document.documentElement.style.setProperty('--bg-grad', PHASES[phaseNow(sun, new Date())])
    }
    apply()
    const id = setInterval(apply, 5 * 60000)
    return () => clearInterval(id)
  }, [applied])
  return null
}

export { PHASES, phaseNow }
