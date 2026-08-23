import { useEffect, useState } from 'react'
import ProfessionalTerminal from './components/ProfessionalTerminal.jsx'
import { useProfessionalPlayback } from './hooks/useProfessionalPlayback.js'

function modeFromPath() {
  if (location.pathname.includes('footprint')) return 'footprint'
  if (location.pathname.includes('step-profile')) return 'step-profile'
  return 'candles'
}

export default function App() {
  const [mode, setMode] = useState(modeFromPath)
  const playback = useProfessionalPlayback()
  useEffect(() => {
    const update = () => setMode(modeFromPath())
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  if (playback.error)
    return <main className="pro-status"><p role="alert">Historical session unavailable: {playback.error}</p></main>
  if (playback.isLoading) return <main className="pro-status">Loading the real BTCUSDT session…</main>
  return <ProfessionalTerminal mode={mode} onMode={setMode} playback={playback} />
}
