import { useOnlineStatus } from '../hooks/useOnlineStatus.js'
import { useTheme } from '../hooks/useTheme.js'
import { IcSun, IcMoon } from './icons.jsx'

// Connectivity + theme toggle, shown in the top bar. The "last updated" label
// is wired per-screen from the data layer once that lands.
export default function StatusBar() {
  const online = useOnlineStatus()
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="row" style={{ gap: 'var(--sp-2)' }}>
      <div className="statusbar" title={online ? 'Online — data can refresh' : 'Offline — showing cached data'}>
        <span className={`dot ${online ? 'online' : 'offline'}`} />
        <span>{online ? 'Online' : 'Offline'}</span>
      </div>
      <button
        className="icon-btn"
        onClick={toggleTheme}
        aria-label={theme === 'sea' ? 'Switch to sunlight mode' : 'Switch to sea mode'}
        title={theme === 'sea' ? 'Sunlight (high-contrast) mode' : 'Sea (dark) mode'}
      >
        {theme === 'sea' ? <IcSun /> : <IcMoon />}
      </button>
    </div>
  )
}
