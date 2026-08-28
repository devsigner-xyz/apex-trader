import PropTypes from 'prop-types'
import ProfessionalTerminal from '../components/ProfessionalTerminal.jsx'
import { demoModes } from '../app/routes.js'
import { useProfessionalPlayback } from '../hooks/useProfessionalPlayback.js'

export default function DemoPage({ mode, onMode }) {
  const playback = useProfessionalPlayback()

  if (playback.error)
    return (
      <main className="pro-status">
        <p role="alert">Historical session unavailable: {playback.error}</p>
      </main>
    )

  if (playback.isLoading)
    return <main className="pro-status">Loading the real BTCUSDT session…</main>

  return <ProfessionalTerminal mode={mode} onMode={onMode} playback={playback} />
}

DemoPage.propTypes = {
  mode: PropTypes.oneOf(demoModes).isRequired,
  onMode: PropTypes.func.isRequired
}
