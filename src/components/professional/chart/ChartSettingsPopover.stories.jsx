import { useState } from 'react'
import PropTypes from 'prop-types'
import ChartSettingsPopover from './ChartSettingsPopover.jsx'

const meta = {
  title: 'Chart/Settings popover',
  component: ChartSettingsPopover
}

export default meta

function InteractiveSettings({ initialLiquidityEnabled = true }) {
  const [liquidity, setLiquidity] = useState({ enabled: initialLiquidityEnabled, intensity: 0.6 })
  const [panelVisibility, setPanelVisibility] = useState({
    profile: true,
    valueArea: true,
    volume: true
  })

  return (
    <div className="storybook-chart-settings">
      <ChartSettingsPopover
        liquidity={liquidity}
        onLiquidityEnabledChange={(enabled) => setLiquidity((current) => ({ ...current, enabled }))}
        onLiquidityIntensityChange={(intensity) =>
          setLiquidity((current) => ({ ...current, intensity }))
        }
        onPanelVisibilityChange={(panel, visible) =>
          setPanelVisibility((current) => ({ ...current, [panel]: visible }))
        }
        panelVisibility={panelVisibility}
      />
    </div>
  )
}

InteractiveSettings.propTypes = {
  initialLiquidityEnabled: PropTypes.bool
}

export const Default = {
  render: () => <InteractiveSettings />
}

export const HeatmapDisabled = {
  render: () => <InteractiveSettings initialLiquidityEnabled={false} />
}
