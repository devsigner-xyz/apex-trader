/* eslint-disable react/prop-types */
export function LiquidityIntensityControl({ enabled, intensity, onChange, onCommit }) {
  const commitIntensity = (event) => onCommit?.(Number(event.currentTarget.value) / 100)

  return (
    <label className="chart-liquidity-intensity">
      <span>INTENSITY</span>
      <input
        aria-label="Liquidity heatmap intensity"
        disabled={!enabled}
        max="100"
        min="20"
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        onKeyUp={(event) => {
          if (
            [
              'ArrowDown',
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'End',
              'Home',
              'PageDown',
              'PageUp'
            ].includes(event.key)
          )
            commitIntensity(event)
        }}
        onPointerUp={commitIntensity}
        step="5"
        type="range"
        value={Math.round(intensity * 100)}
      />
      <output>{Math.round(intensity * 100)}%</output>
    </label>
  )
}

function semanticColor(token) {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim()
}

function CandleColorControls({ colors, onChange, onReset }) {
  return (
    <fieldset className="chart-candle-color-options">
      <legend>CANDLES</legend>
      <label>
        <span>UP CANDLE</span>
        <input
          aria-label="Up candle color"
          onChange={(event) => onChange('up', event.target.value)}
          type="color"
          value={colors.up ?? semanticColor('--pro-buy')}
        />
      </label>
      <label>
        <span>DOWN CANDLE</span>
        <input
          aria-label="Down candle color"
          onChange={(event) => onChange('down', event.target.value)}
          type="color"
          value={colors.down ?? semanticColor('--pro-sell')}
        />
      </label>
      <button className="chart-colors-reset" onClick={onReset} type="button">
        RESET CANDLE COLORS
      </button>
    </fieldset>
  )
}

export default function ChartSettingsPopover({
  candleColors,
  liquidity,
  mode,
  onCandleColorChange,
  onLiquidityEnabledChange,
  onLiquidityIntensityCommit,
  onLiquidityIntensityChange,
  onPanelVisibilityChange,
  panelVisibility,
  popoverRef,
  resetCandleColors
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
        <span className="chart-settings-section-label">COMMON</span>
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
        {mode === 'candles' && (
          <>
            <CandleColorControls
              colors={candleColors}
              onChange={onCandleColorChange}
              onReset={resetCandleColors}
            />
            <span className="chart-settings-section-label">CANDLES OVERLAYS</span>
            <label>
              <input
                aria-label="Show liquidity heatmap"
                checked={liquidity.enabled}
                onChange={(event) => onLiquidityEnabledChange(event.target.checked)}
                type="checkbox"
              />
              <span>LIQUIDITY HEATMAP</span>
            </label>
            <LiquidityIntensityControl
              enabled={liquidity.enabled}
              intensity={liquidity.intensity}
              onCommit={onLiquidityIntensityCommit}
              onChange={onLiquidityIntensityChange}
            />
          </>
        )}
      </div>
    </aside>
  )
}
