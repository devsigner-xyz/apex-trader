import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { TradingStateProvider } from './app/tradingState.jsx'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/components.css'

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <TradingStateProvider>
      <App />
    </TradingStateProvider>
  </StrictMode>
)
