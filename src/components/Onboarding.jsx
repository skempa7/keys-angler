import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { IcFish, IcWaves, IcMoon, IcMap, IcShield, IcPin } from './icons.jsx'

const USUAL = ['Yellowtail Snapper', 'Mutton Snapper', 'Mahi-Mahi', 'Tarpon', 'Bonefish', 'Permit', 'Grouper', 'Hogfish', 'Sailfish', 'Snook', 'Kingfish', 'Wahoo']

// First-launch welcome → optional one-screen personalization (boat, home spot, targets).
export default function Onboarding() {
  const done = useLiveQuery(async () => (await db.settings.get('onboarded'))?.value, [], 'loading')
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState('')
  const [picked, setPicked] = useState([])
  const [spotMsg, setSpotMsg] = useState('')
  if (done === 'loading' || done) return null

  const toggle = (s) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
  const useLocation = () => {
    if (!navigator.geolocation) { setSpotMsg('No location available on this device.'); return }
    setSpotMsg('Locating…')
    navigator.geolocation.getCurrentPosition(
      async (p) => { await db.spots.add({ kind: 'home', name: 'Home spot', lat: p.coords.latitude, lon: p.coords.longitude, createdAt: Date.now() }); setSpotMsg('Saved your home spot ✓') },
      () => setSpotMsg('Could not get a fix — you can add spots later.'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }
  const finish = async () => {
    try {
      const d = Number(draft)
      if (Number.isFinite(d) && d > 0) await db.boats.add({ name: 'My boat', draftIn: d, createdAt: Date.now() })
      if (picked.length) await db.settings.put({ key: 'usualSpecies', value: picked })
    } catch { /* ignore */ }
    await db.settings.put({ key: 'onboarded', value: true })
  }

  if (step === 0) {
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
          <button className="btn primary block lg" onClick={() => setStep(1)}>Set me up</button>
          <button className="btn ghost block" onClick={finish}>Skip — just start</button>
        </div>
      </div>
    )
  }

  return (
    <div className="onb">
      <div className="onb-card stack">
        <h2 className="h1">Make it yours</h2>
        <p className="muted">Optional — it sharpens your zones, targets &amp; bearings. Change anything later in Settings.</p>

        <label className="field"><span className="field-label">Boat draft (inches)</span>
          <input className="input" inputMode="numeric" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. 18 — flags skinny bar crossings" />
        </label>

        <div className="field">
          <span className="field-label">Home spot</span>
          <button className="btn ghost block" onClick={useLocation}><IcPin width={16} height={16} /> Use my current location</button>
          {spotMsg && <div className="faint" style={{ fontSize: 12 }}>{spotMsg}</div>}
        </div>

        <div className="field">
          <span className="field-label">Usual targets</span>
          <div className="row wrap" style={{ gap: 8 }}>
            {USUAL.map((s) => <button key={s} className={`chip ${picked.includes(s) ? 'active' : ''}`} onClick={() => toggle(s)}>{s}</button>)}
          </div>
        </div>

        <button className="btn primary block lg" onClick={finish}>Start fishing</button>
        <p className="faint" style={{ fontSize: 12 }}>Home port defaults to Tavernier — change it anytime in Settings.</p>
      </div>
    </div>
  )
}
