/* eslint-disable react/prop-types */
export default function ChartSettingsPopover({
  liquidity,
  onLiquidityEnabledChange,
  onLiquidityIntensityChange,
  onPanelVisibilityChange,
  panelVisibility,
  popoverRef
}) {
  return (
    <aside
      aria-label="Chart settings"
      className="chart-settings-popover"
      id="chart-settings-panel"
      ref={popoverRef}
      role="dialog"
    >
      <strong>CHART SETTINGS</strong>
      <div className="chart-panel-options">
        <label>
          <input
            aria-label="Show visible range volume profile"
            checked={panelVisibility.profile}
            onChange={(event) => onPanelVisibilityChange('profile', event.target.checked)}
            type="checkbox"
          />
          <span>VISIBLE RANGE VOLUME PROFILE</span>
        </label>
        <label>
          <input
            aria-label="Show VAH, POC and VAL"
            checked={panelVisibility.valueArea}
            onChange={(event) => onPanelVisibilityChange('valueArea', event.target.checked)}
            type="checkbox"
          />
          <span>VAH / POC / VAL</span>
        </label>
        <label>
          <input
            aria-label="Show volume"
            checked={panelVisibility.volume}
            onChange={(event) => onPanelVisibilityChange('volume', event.target.checked)}
            type="checkbox"
          />
          <span>VOLUME</span>
        </label>
        <label>
          <input
            aria-label="Show liquidity heatmap"
            checked={liquidity.enabled}
            onChange={(event) => onLiquidityEnabledChange(event.target.checked)}
            type="checkbox"
          />
          <span>LIQUIDITY HEATMAP</span>
        </label>
        <label className="chart-liquidity-intensity">
          <span>INTENSITY</span>
          <input
            aria-label="Liquidity heatmap intensity"
            disabled={!liquidity.enabled}
            max="100"
            min="20"
            onChange={(event) => onLiquidityIntensityChange(Number(event.target.value) / 100)}
            step="5"
            type="range"
            value={Math.round(liquidity.intensity * 100)}
          />
          <output>{Math.round(liquidity.intensity * 100)}%</output>
        </label>
      </div>
    </aside>
  )
}
