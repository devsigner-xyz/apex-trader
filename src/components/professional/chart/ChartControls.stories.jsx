import { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import ChartControls from './ChartControls.jsx'

const meta = {
  title: 'Chart/Controls',
  component: ChartControls
}

export default meta

function InteractiveControls({ initialMode = 'candles', initialTimeframe = 30 }) {
  const [mode, setMode] = useState(initialMode)
  const [timeframe, setTimeframe] = useState(initialTimeframe)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsTriggerRef = useRef(null)

  return (
    <div className="storybook-chart-controls">
      <ChartControls
        mode={mode}
        onMode={setMode}
        onOpenSettings={() => setSettingsOpen((current) => !current)}
        onTimeframe={setTimeframe}
        settingsOpen={settingsOpen}
        settingsTriggerRef={settingsTriggerRef}
        timeframe={timeframe}
      />
      <output aria-live="polite">
        {mode} · {timeframe} min · settings {settingsOpen ? 'open' : 'closed'}
      </output>
    </div>
  )
}

InteractiveControls.propTypes = {
  initialMode: PropTypes.string,
  initialTimeframe: PropTypes.number
}

export const Candles = {
  render: () => <InteractiveControls />
}

export const Footprint = {
  render: () => <InteractiveControls initialMode="footprint" initialTimeframe={60} />
}
