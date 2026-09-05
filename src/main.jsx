import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/components.css'
import './styles/professional/foundation.css'
import './styles/landing.css'

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
