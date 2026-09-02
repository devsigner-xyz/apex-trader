import PropTypes from 'prop-types'
import ProfessionalTerminal from '../components/ProfessionalTerminal.jsx'
import DemoViewportNotice from '../components/professional/DemoViewportNotice.jsx'
import { demoModes } from '../app/routes.js'
import { useProfessionalPlayback } from '../hooks/useProfessionalPlayback.js'

export default function DemoPage({ mode, onMode }) {
  const playback = useProfessionalPlayback()
  let content

  if (playback.error)
    content = (
      <main className="pro-status">
        <p role="alert">Historical session unavailable: {playback.error}</p>
      </main>
    )
  else if (playback.isLoading)
    content = <main className="pro-status">Loading the real BTCUSDT session…</main>
  else content = <ProfessionalTerminal mode={mode} onMode={onMode} playback={playback} />

  return (
    <>
      <DemoViewportNotice />
      {content}
    </>
  )
}

DemoPage.propTypes = {
  mode: PropTypes.oneOf(demoModes).isRequired,
  onMode: PropTypes.func.isRequired
}
