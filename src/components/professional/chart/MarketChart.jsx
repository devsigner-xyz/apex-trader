/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { useChartViewport } from '../../../hooks/useChartViewport.js'
import { usePersistentState } from '../../../hooks/usePersistentState.js'
import { usePriceAxisScale } from '../../../hooks/usePriceAxisScale.js'
import { useSettingsPopoverFocus } from '../../../hooks/useSettingsPopoverFocus.js'
import {
  buildSessionProfile,
  clamp,
  createPriceScale,
  createPriceTicks,
  createTemporalViewport,
  createTimeScale,
  derivePriceDomain,
  findTimeScaleBarIndex,
  niceDisplayStep,
  selectTimeTickIndexes
} from '../../../services/professionalChartGeometry.js'
import {
  normalizeChartLiquidity,
  normalizeChartPanelSizes,
  normalizeChartPanelVisibility
} from '../../../services/professionalTerminalPersistence.js'
import {
  aggregateProfessionalBars,
  deriveVolumeProfile,
  formatCandleCloseCountdown
} from '../../../services/proPlayback.js'
import {
  chartDefaults,
  chartDimensions,
  chartFutureSpaceRatio,
  chartTimeframes,
  chartViewportLimits,
  footprintTimeframes,
  storageKeys
} from '../config.js'
import { formatClock as clock, formatNumber as fmt } from '../formatters.js'
import CandlesLayer from './CandlesLayer.jsx'
import FootprintLayer from './FootprintLayer.jsx'
import LiquidityHeatmapLayer from './LiquidityHeatmapLayer.jsx'
import SessionProfileOverlay from './SessionProfileOverlay.jsx'
import StepProfileLayer from './StepProfileLayer.jsx'
import VolumePanel from './VolumePanel.jsx'

const {
  chartWidth,
  mainBottom,
  mainTop,
  plotLeft,
  plotRight,
  priceAxisX,
  priceChartHeight,
  timeTickY
} = chartDimensions
const profileMarkerWidth = 38
const profileMarkerX = plotLeft + 8
const profileMarkerTextX = profileMarkerX + profileMarkerWidth / 2
const {
  chartLiquidity: chartLiquidityStorageKey,
  chartPanelSizes: chartPanelSizesStorageKey,
  chartPanelVisibility: chartPanelVisibilityStorageKey
} = storageKeys

export default function MarketChart({
  mode,
  onMode,
  onTimeframe,
  sourceTickSize,
  timeframe,
  view
}) {
  const [liquidity, setLiquidity] = usePersistentState(
    chartLiquidityStorageKey,
    normalizeChartLiquidity
  )
  const [panelSizes, setPanelSizes] = usePersistentState(
    chartPanelSizesStorageKey,
    normalizeChartPanelSizes
  )
  const [panelVisibility, setPanelVisibility] = usePersistentState(
    chartPanelVisibilityStorageKey,
    normalizeChartPanelVisibility
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null)
  const [crosshair, setCrosshair] = useState(null)
  const chartRef = useRef(null)
  const priceChartRef = useRef(null)
  const settingsPopoverRef = useRef(null)
  const settingsTriggerRef = useRef(null)
  const { handleTriggerClick } = useSettingsPopoverFocus({
    containerRef: chartRef,
    isOpen: settingsOpen,
    popoverRef: settingsPopoverRef,
    setIsOpen: setSettingsOpen,
    triggerRef: settingsTriggerRef
  })
  const bars = useMemo(
    () => aggregateProfessionalBars(view.bars, timeframe),
    [timeframe, view.bars]
  )
  const current = bars.at(-1)

  const defaultVisibleCount = chartDefaults[mode]
  const {
    dragging,
    followLatest,
    handleKeyDown,
    handlePointerDown,
    handlePointerMove,
    handleWheel,
    logicalEnd,
    logicalStart,
    phase,
    renderBars,
    safeOffset,
    startIndex,
    stopDragging,
    visibleCount
  } = useChartViewport({
    bars,
    defaultVisibleCount,
    futureSpaceRatio: chartFutureSpaceRatio,
    limits: chartViewportLimits[mode],
    mode,
    plotRatio: plotRight / chartWidth,
    timeframe
  })

  useEffect(() => {
    setHoveredBarIndex(null)
    setCrosshair(null)
  }, [logicalEnd, logicalStart, mode, timeframe, visibleCount])

  useEffect(() => {
    const chart = priceChartRef.current
    if (!chart) return undefined
    chart.addEventListener('wheel', handleWheel, { passive: false })
    return () => chart.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const visible = renderBars.filter((_, index) => {
    const center = startIndex + index + 0.5
    return center >= logicalStart && center < logicalEnd
  })
  const automaticPriceDomain = derivePriceDomain(visible, mode)
  const {
    domain: priceDomain,
    handleDoubleClick: handlePriceScaleDoubleClick,
    handleKeyDown: handlePriceScaleKeyDown,
    handlePointerDown: handlePriceScalePointerDown,
    handlePointerMove: handlePriceScalePointerMove,
    resetPriceScale,
    resizing: resizingPriceScale,
    scaleFactor: priceScaleFactor,
    stopResizing: stopPriceScaleResize
  } = usePriceAxisScale({ automaticDomain: automaticPriceDomain, mode, timeframe })
  const { high, low, range } = priceDomain
  const pricePlotTop = mode === 'footprint' ? mainTop + 12 : mainTop
  const priceScale = createPriceScale({ high, low, range }, pricePlotTop, mainBottom)
  const y = priceScale.toY
  const plotWidth = plotRight - plotLeft
  const chartSlots = createTimeScale(renderBars.length, visibleCount, plotLeft, plotWidth, phase)
  const step = chartSlots.step
  const x = (index) => chartSlots.positions[index]
  const { end: viewportEnd, start: viewportStart } = createTemporalViewport({
    firstTimestamp: bars[0].timestamp,
    intervalMs: timeframe * 60_000,
    logicalStart,
    slotCount: visibleCount
  })
  const visibleProfile = deriveVolumeProfile(visible)
  const profile = buildSessionProfile(visibleProfile.levels, low, high)
  const maxProfile = Math.max(...profile.map((level) => level.ask + level.bid), 1)
  const profileMarkers = Number.isFinite(visibleProfile.poc)
    ? [
        { label: 'VAH', price: visibleProfile.vah, tone: 'value-area' },
        { label: 'POC', price: visibleProfile.poc, tone: 'poc' },
        { label: 'VAL', price: visibleProfile.val, tone: 'value-area' }
      ]
    : []
  const priceTicks = createPriceTicks({ high, low, range }, 9)
  const timeIndexes = selectTimeTickIndexes(chartSlots.positions).filter((index) => {
    const position = chartSlots.positions[index]
    return position >= plotLeft + 24 && position <= plotRight - 24
  })
  const candleWidth = clamp(step * 0.58, 4, 16)
  const volumeWidth = clamp(step * 0.48, 5, 18)
  const maximumVisibleVolume = Math.max(...visible.map((bar) => bar.volume), 1)
  const footprintZoomScale = clamp(chartDefaults.footprint / visibleCount, 1, 1.6)
  const footprintFontSize = clamp(10 + (footprintZoomScale - 1) * 7, 10, 14)
  const footprintDeltaFontSize = clamp(11 + (footprintZoomScale - 1) * 5, 11, 14)
  const stepZoomScale = clamp(chartDefaults['step-profile'] / visibleCount, 1, 9)
  const stepDeltaFontSize = clamp(13 + (stepZoomScale - 1) * 1.25, 13, 19)
  const footprintTickSize = niceDisplayStep((range / 28) * footprintZoomScale, sourceTickSize)
  const stepProfileTickSize = niceDisplayStep(
    (range / 64) * Math.sqrt(stepZoomScale),
    sourceTickSize
  )
  const footprintSettings = {
    format: 'compact',
    imbalanceRatio: 3,
    minimumVolume: 0,
    mode: 'bidAsk',
    scale: 'linear',
    stackedImbalanceSize: 3,
    tickSize: footprintTickSize
  }
  const stepProfileSettings = {
    ...footprintSettings,
    tickSize: stepProfileTickSize
  }

  const candleCloseCountdown = formatCandleCloseCountdown(view.timestamp, timeframe)
  const chartPanelStyle = {
    '--volume-panel-height': panelVisibility.volume ? `${panelSizes.volume}px` : '0px',
    '--volume-resizer-height': panelVisibility.volume ? '7px' : '0px'
  }
  const handleChartKeyDown = (event) => {
    if (event.key === '0') resetPriceScale()
    handleKeyDown(event)
  }
  const handleChartPointerMove = (event) => {
    handlePointerMove(event)
    const bounds = event.currentTarget.getBoundingClientRect()
    const chartX = ((event.clientX - bounds.left) / bounds.width) * chartWidth
    const chartY = ((event.clientY - bounds.top) / bounds.height) * priceChartHeight
    const insidePricePlot =
      chartX >= plotLeft && chartX <= plotRight && chartY >= mainTop && chartY <= mainBottom
    setCrosshair(insidePricePlot ? { x: chartX, y: chartY } : null)
    setHoveredBarIndex(
      findTimeScaleBarIndex({
        barCount: bars.length,
        chartX,
        logicalEnd,
        logicalStart,
        plotLeft,
        plotWidth,
        visibleCount
      })
    )
  }
  const handleChartPointerCancel = (event) => {
    setHoveredBarIndex(null)
    setCrosshair(null)
    stopDragging(event)
  }
  const summaryBar = bars[hoveredBarIndex] ?? current

  return (
    <section className="market-chart" ref={chartRef}>
      <header>
        <div className="chart-summary">
          <span>
            O {fmt(summaryBar.open)} · H {fmt(summaryBar.high)} · L {fmt(summaryBar.low)} · C{' '}
            {fmt(summaryBar.close)} · Δ {fmt(summaryBar.delta)} · V {fmt(summaryBar.volume)}
          </span>
        </div>
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
            onClick={handleTriggerClick}
            ref={settingsTriggerRef}
            title="Chart settings"
            type="button"
          >
            <SettingsIcon aria-hidden="true" size={16} strokeWidth={2} />
          </button>
        </div>
      </header>
      {settingsOpen && (
        <aside
          aria-label="Chart settings"
          className="chart-settings-popover"
          id="chart-settings-panel"
          ref={settingsPopoverRef}
          role="dialog"
        >
          <strong>CHART SETTINGS</strong>
          <div className="chart-panel-options">
            <label>
              <input
                aria-label="Show visible range volume profile"
                checked={panelVisibility.profile}
                onChange={(event) =>
                  setPanelVisibility((current) => ({
                    ...current,
                    profile: event.target.checked
                  }))
                }
                type="checkbox"
              />
              <span>VISIBLE RANGE VOLUME PROFILE</span>
            </label>
            <label>
              <input
                aria-label="Show VAH, POC and VAL"
                checked={panelVisibility.valueArea}
                onChange={(event) =>
                  setPanelVisibility((current) => ({
                    ...current,
                    valueArea: event.target.checked
                  }))
                }
                type="checkbox"
              />
              <span>VAH / POC / VAL</span>
            </label>
            <label>
              <input
                aria-label="Show volume"
                checked={panelVisibility.volume}
                onChange={(event) =>
                  setPanelVisibility((current) => ({
                    ...current,
                    volume: event.target.checked
                  }))
                }
                type="checkbox"
              />
              <span>VOLUME</span>
            </label>
            <label>
              <input
                aria-label="Show liquidity heatmap"
                checked={liquidity.enabled}
                onChange={(event) =>
                  setLiquidity((current) => ({ ...current, enabled: event.target.checked }))
                }
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
                onChange={(event) =>
                  setLiquidity((current) => ({
                    ...current,
                    intensity: Number(event.target.value) / 100
                  }))
                }
                step="5"
                type="range"
                value={Math.round(liquidity.intensity * 100)}
              />
              <output>{Math.round(liquidity.intensity * 100)}%</output>
            </label>
          </div>
        </aside>
      )}
      <div
        className="market-chart-panels"
        data-show-profile={panelVisibility.profile}
        data-show-value-area={panelVisibility.valueArea}
        data-show-volume={panelVisibility.volume}
        style={chartPanelStyle}
      >
        <div className="price-chart-panel">
          {mode === 'candles' && (
            <LiquidityHeatmapLayer
              enabled={liquidity.enabled}
              intensity={liquidity.intensity}
              priceDomain={priceDomain}
              replayTimestamp={view.timestamp}
              sessionStart={view.bars[0].timestamp}
              timeframe={timeframe}
              viewportEnd={viewportEnd}
              viewportStart={viewportStart}
            />
          )}
          <svg
            aria-description="Move the pointer over the price plot to show a dotted crosshair and inspect the bar OHLC, delta and volume. The vertical guide continues through the volume panel when visible. Changing timeframe starts with maximum future space between current data and the Volume Profile. Hold the primary pointer button and drag continuously; drag right to restore profile overlap or left to create future space. Use the wheel to resize the time axis around the last visible candle. Scroll horizontally, hold Shift while scrolling, or use the arrow keys to pan. Drag the price axis vertically to resize it. Press zero to reset to the latest data at the right edge."
            aria-label={`${mode} historical chart`}
            className={resizingPriceScale ? 'resizing-price-scale' : dragging ? 'dragging' : ''}
            data-follow-latest={followLatest}
            data-price-scale-factor={priceScaleFactor.toFixed(4)}
            data-profile-poc={visibleProfile.poc ?? ''}
            data-profile-vah={visibleProfile.vah ?? ''}
            data-profile-val={visibleProfile.val ?? ''}
            data-right-offset={safeOffset}
            data-visible-count={visibleCount}
            data-window-end={visible.at(-1)?.timestamp ?? ''}
            data-window-start={visible[0]?.timestamp ?? ''}
            onKeyDown={handleChartKeyDown}
            onPointerCancel={handleChartPointerCancel}
            onPointerDown={handlePointerDown}
            onPointerLeave={() => {
              setHoveredBarIndex(null)
              setCrosshair(null)
            }}
            onPointerMove={handleChartPointerMove}
            onPointerUp={stopDragging}
            preserveAspectRatio="none"
            ref={priceChartRef}
            role="application"
            tabIndex={0}
            viewBox={`0 0 ${chartWidth} ${priceChartHeight}`}
          >
            <rect width={chartWidth} height={priceChartHeight} fill="transparent" />
            <defs>
              <clipPath id="market-chart-price-plot-clip">
                <rect height={priceChartHeight} width={plotWidth} x={plotLeft} y="0" />
              </clipPath>
            </defs>
            <rect
              className="price-axis-bg"
              x={priceAxisX}
              y="0"
              width={chartWidth - priceAxisX}
              height={priceChartHeight}
            />

            {priceTicks.map((price) => (
              <g key={price}>
                <line
                  className="gridline"
                  x1={plotLeft}
                  x2={plotRight}
                  y1={y(price)}
                  y2={y(price)}
                />
                <line
                  className="price-tick-mark"
                  x1={plotRight}
                  x2={priceAxisX}
                  y1={y(price)}
                  y2={y(price)}
                />
                <text className="price-tick" x={priceAxisX + 8} y={y(price) + 4}>
                  {fmt(price)}
                </text>
              </g>
            ))}
            {timeIndexes.map((index) => (
              <line
                className="gridline faint"
                key={renderBars[index]?.timestamp}
                x1={x(index)}
                x2={x(index)}
                y1={mainTop}
                y2={priceChartHeight}
              />
            ))}

            <g className="chart-data-layer" clipPath="url(#market-chart-price-plot-clip)">
              {mode === 'candles' && (
                <CandlesLayer
                  bars={renderBars}
                  centers={chartSlots.positions}
                  priceScale={priceScale}
                  width={candleWidth}
                />
              )}

              {mode === 'footprint' && (
                <FootprintLayer
                  bars={renderBars}
                  centers={chartSlots.positions}
                  deltaFontSize={footprintDeltaFontSize}
                  domain={{ high, low, range }}
                  fontSize={footprintFontSize}
                  plotBounds={{ bottom: mainBottom, top: mainTop }}
                  priceScale={priceScale}
                  settings={footprintSettings}
                  step={step}
                  tickSize={footprintTickSize}
                  zoomScale={footprintZoomScale}
                />
              )}

              {mode === 'step-profile' && (
                <StepProfileLayer
                  bars={renderBars}
                  centers={chartSlots.positions}
                  deltaFontSize={stepDeltaFontSize}
                  domain={{ high, low, range }}
                  plotBounds={{ bottom: mainBottom, top: mainTop }}
                  priceScale={priceScale}
                  settings={stepProfileSettings}
                  step={step}
                  tickSize={stepProfileTickSize}
                  zoomScale={stepZoomScale}
                />
              )}
            </g>

            {panelVisibility.profile && (
              <SessionProfileOverlay
                maximumVolume={maxProfile}
                priceScale={priceScale}
                profile={profile}
              />
            )}

            {panelVisibility.valueArea && profileMarkers.length > 0 && (
              <g aria-label="Visible range value area">
                <g aria-label="VAH, POC and VAL markers" role="img">
                  <title>VAH, POC and VAL markers aligned to the left price edge</title>
                  {profileMarkers.map(({ label, price, tone }) => (
                    <g key={label}>
                      <line
                        className={tone === 'poc' ? 'poc-line' : 'value-line'}
                        x1={plotLeft}
                        x2={plotRight}
                        y1={y(price)}
                        y2={y(price)}
                      />
                      <g
                        className={`session-profile-marker session-profile-marker--${tone}`}
                        transform={`translate(0 ${y(price)})`}
                      >
                        <title>{`${label} ${fmt(price)}`}</title>
                        <rect
                          height="16"
                          rx="2"
                          width={profileMarkerWidth}
                          x={profileMarkerX}
                          y="-8"
                        />
                        <text textAnchor="middle" x={profileMarkerTextX} y="3">
                          {label}
                        </text>
                      </g>
                    </g>
                  ))}
                </g>
              </g>
            )}

            <line
              className="current-price-line"
              x1={plotRight - 18}
              x2={priceAxisX}
              y1={y(current.close)}
              y2={y(current.close)}
            />
            <rect
              className="current-price-tag"
              height="32"
              width={chartWidth - priceAxisX - 4}
              x={priceAxisX + 2}
              y={y(current.close) - 16}
            />
            <text className="current-price-text" x={priceAxisX + 6} y={y(current.close) - 2}>
              {fmt(current.close)}
            </text>
            <text
              aria-label={`Candle closes in ${candleCloseCountdown}`}
              className="current-price-countdown"
              x={priceAxisX + 6}
              y={y(current.close) + 11}
            >
              CLOSE {candleCloseCountdown}
            </text>

            {timeIndexes.map((index) => (
              <text
                className="time-tick"
                key={`time-${renderBars[index]?.timestamp}`}
                textAnchor="middle"
                x={x(index)}
                y={timeTickY}
              >
                {clock(renderBars[index]?.timestamp ?? view.timestamp).slice(0, 5)}
              </text>
            ))}

            {crosshair && (
              <g aria-hidden="true" className="chart-crosshair" pointerEvents="none">
                <line
                  className="chart-crosshair-line chart-crosshair-line--vertical"
                  x1={crosshair.x}
                  x2={crosshair.x}
                  y1={mainTop}
                  y2={priceChartHeight}
                />
                <line
                  className="chart-crosshair-line chart-crosshair-line--horizontal"
                  x1={plotLeft}
                  x2={plotRight}
                  y1={crosshair.y}
                  y2={crosshair.y}
                />
              </g>
            )}

            <rect
              aria-hidden="true"
              className="chart-pan-surface"
              fill="transparent"
              height={priceChartHeight}
              pointerEvents="all"
              width={plotWidth}
              x={plotLeft}
              y="0"
            />

            <rect
              aria-label="Resize price scale"
              aria-orientation="vertical"
              aria-valuemax="400"
              aria-valuemin="25"
              aria-valuenow={Math.round(priceScaleFactor * 100)}
              aria-valuetext={`${Math.round(priceScaleFactor * 100)}% of automatic price range`}
              className="price-axis-resizer"
              fill="transparent"
              height={mainBottom - mainTop}
              onDoubleClick={handlePriceScaleDoubleClick}
              onKeyDown={handlePriceScaleKeyDown}
              onPointerCancel={stopPriceScaleResize}
              onPointerDown={handlePriceScalePointerDown}
              onPointerMove={handlePriceScalePointerMove}
              onPointerUp={stopPriceScaleResize}
              pointerEvents="all"
              role="slider"
              tabIndex="0"
              width={chartWidth - priceAxisX}
              x={priceAxisX}
              y={mainTop}
            />
          </svg>
        </div>
        {panelVisibility.volume && (
          <VolumePanel
            bars={renderBars}
            centers={chartSlots.positions}
            maximumVolume={maximumVisibleVolume}
            crosshairX={crosshair?.x ?? null}
            setPanelSizes={setPanelSizes}
            timeIndexes={timeIndexes}
            width={volumeWidth}
          />
        )}
      </div>
    </section>
  )
}
