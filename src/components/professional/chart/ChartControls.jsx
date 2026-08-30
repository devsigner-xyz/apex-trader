/* eslint-disable react/prop-types */
import { Settings as SettingsIcon } from 'lucide-react'
import { chartTimeframes, footprintTimeframes } from '../config.js'

export default function ChartControls({
  mode,
  onMode,
  onOpenSettings,
  onTimeframe,
  settingsOpen,
  settingsTriggerRef,
  timeframe
}) {
  return (
    <div aria-label="Chart controls" className="chart-controls" role="toolbar">
      <select
        aria-label="Timeframe"
        className="chart-timeframe-select"
        onChange={(event) => onTimeframe(Number(event.target.value))}
        value={timeframe}
      >
        {(mode === 'footprint' ? footprintTimeframes : chartTimeframes).map(
          ({ label, minutes }) => (
            <option key={minutes} value={minutes}>
              {label}
            </option>
          )
        )}
      </select>
      <select
        aria-label="Chart mode"
        className="chart-mode-select"
        onChange={(event) => onMode(event.target.value)}
        value={mode}
      >
        <option value="candles">Candles</option>
        <option value="footprint">Footprint</option>
        <option value="step-profile">Step Profile</option>
      </select>
      <button
        aria-controls="chart-settings-panel"
        aria-expanded={settingsOpen}
        aria-label="Chart settings"
        className="chart-settings-button"
        onClick={onOpenSettings}
        ref={settingsTriggerRef}
        title="Chart settings"
        type="button"
      >
        <SettingsIcon aria-hidden="true" size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
