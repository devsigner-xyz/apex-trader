import { useState } from 'react'
import PropTypes from 'prop-types'
import MarketChart from './MarketChart.jsx'
import { chartStoryTickSize, chartStoryView } from './chartStoryFixture.js'

const hiddenVolume = { profile: true, valueArea: true, volume: false }
const shownVolume = { profile: true, valueArea: true, volume: true }
const disabledLiquidity = { enabled: false, intensity: 0.6 }

const meta = {
  title: 'Chart/Market chart',
  component: MarketChart
}

export default meta

function InteractiveChart({ initialMode, initialPanelVisibility, initialTimeframe }) {
  const [mode, setMode] = useState(initialMode)
  const [timeframe, setTimeframe] = useState(initialTimeframe)

  return (
    <div className="storybook-market-chart">
      <MarketChart
        initialLiquidity={disabledLiquidity}
        initialPanelVisibility={initialPanelVisibility}
        mode={mode}
        onMode={setMode}
        onTimeframe={setTimeframe}
        sourceTickSize={chartStoryTickSize}
        timeframe={timeframe}
        view={chartStoryView}
      />
    </div>
  )
}

InteractiveChart.propTypes = {
  initialMode: PropTypes.string.isRequired,
  initialPanelVisibility: PropTypes.object.isRequired,
  initialTimeframe: PropTypes.number.isRequired
}

export const CandlesVolumeShown = {
  render: () => (
    <InteractiveChart initialMode="candles" initialPanelVisibility={shownVolume} initialTimeframe={30} />
  )
}

export const CandlesVolumeHidden = {
  render: () => (
    <InteractiveChart initialMode="candles" initialPanelVisibility={hiddenVolume} initialTimeframe={30} />
  )
}

export const FootprintVolumeShown = {
  render: () => (
    <InteractiveChart initialMode="footprint" initialPanelVisibility={shownVolume} initialTimeframe={60} />
  )
}

export const FootprintVolumeHidden = {
  render: () => (
    <InteractiveChart initialMode="footprint" initialPanelVisibility={hiddenVolume} initialTimeframe={60} />
  )
}

export const StepProfileVolumeShown = {
  render: () => (
    <InteractiveChart initialMode="step-profile" initialPanelVisibility={shownVolume} initialTimeframe={60} />
  )
}

export const StepProfileVolumeHidden = {
  render: () => (
    <InteractiveChart initialMode="step-profile" initialPanelVisibility={hiddenVolume} initialTimeframe={60} />
  )
}
