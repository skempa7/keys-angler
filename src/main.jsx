import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { getInitialTheme } from './hooks/useTheme.js'
import './styles/theme.css'
import './styles/global.css'

// Apply persisted theme before first paint to avoid a flash.
document.documentElement.setAttribute('data-theme', getInitialTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
