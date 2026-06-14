import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { IcFish, IcWaves, IcMoon, IcMap, IcShield } from './icons.jsx'

// One-time welcome on first launch.
export default function Onboarding() {
  const done = useLiveQuery(async () => (await db.settings.get('onboarded'))?.value, [], 'loading')
  if (done === 'loading' || done) return null
  const finish = () => db.settings.put({ key: 'onboarded', value: true })
  return (
    <div className="onb">
      <div className="onb-card stack">
        <div className="onb-mark" style={{ color: 'var(--accent)' }}><IcFish width={48} height={48} /></div>
        <h2 className="h1">Welcome to Keys Angler</h2>
        <p className="muted">Your offline-first edge for the Upper Florida Keys.</p>
        <ul className="onb-list">
          <li><span className="onb-ico"><IcWaves width={18} height={18} /></span><span><b>Should I go?</b> — one honest 0–100 score, with the reasoning.</span></li>
          <li><span className="onb-ico"><IcMoon width={18} height={18} /></span><span><b>Bite times</b> — solunar &amp; tide windows, ranked.</span></li>
          <li><span className="onb-ico"><IcMap width={18} height={18} /></span><span><b>Trip plans</b> that work offline 30 miles out.</span></li>
          <li><span className="onb-ico"><IcShield width={18} height={18} /></span><span><b>Keep checker</b> + stone crab &amp; lobster seasons.</span></li>
        </ul>
        <button className="btn primary block lg" onClick={finish}>Start fishing</button>
        <p className="faint" style={{ fontSize: 12 }}>Home port defaults to Tavernier — change it anytime in Settings.</p>
      </div>
    </div>
  )
}
