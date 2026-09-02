import { useState } from 'react'
import PropTypes from 'prop-types'
import ChartSettingsPopover from './ChartSettingsPopover.jsx'

const meta = {
  title: 'Chart/Settings popover',
  component: ChartSettingsPopover
}

export default meta

function InteractiveSettings({ initialLiquidityEnabled = true, mode = 'candles' }) {
  const [liquidity, setLiquidity] = useState({ enabled: initialLiquidityEnabled, intensity: 0.6 })
  const [candleColors, setCandleColors] = useState({ down: null, up: null })
  const [panelVisibility, setPanelVisibility] = useState({
    profile: true,
    valueArea: true,
    volume: true
  })

  return (
    <div className="storybook-chart-settings">
      <ChartSettingsPopover
        candleColors={candleColors}
        liquidity={liquidity}
        mode={mode}
        onCandleColorChange={(side, color) =>
          setCandleColors((current) => ({ ...current, [side]: color }))
        }
        onLiquidityEnabledChange={(enabled) => setLiquidity((current) => ({ ...current, enabled }))}
        onLiquidityIntensityChange={(intensity) =>
          setLiquidity((current) => ({ ...current, intensity }))
        }
        onPanelVisibilityChange={(panel, visible) =>
          setPanelVisibility((current) => ({ ...current, [panel]: visible }))
        }
        panelVisibility={panelVisibility}
        resetCandleColors={() => setCandleColors({ down: null, up: null })}
      />
    </div>
  )
}

InteractiveSettings.propTypes = {
  initialLiquidityEnabled: PropTypes.bool,
  mode: PropTypes.oneOf(['candles', 'footprint', 'step-profile'])
}

export const Default = {
  render: () => <InteractiveSettings />
}

export const HeatmapDisabled = {
  render: () => <InteractiveSettings initialLiquidityEnabled={false} />
}

export const FootprintContext = {
  render: () => <InteractiveSettings mode="footprint" />
}
