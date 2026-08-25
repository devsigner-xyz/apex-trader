/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { useChartViewport } from '../../../hooks/useChartViewport.js'
import { usePersistentState } from '../../../hooks/usePersistentState.js'
import { usePriceAxisScale } from '../../../hooks/usePriceAxisScale.js'
import {
  buildSessionProfile,
  clamp,
  createPriceScale,
  createPriceTicks,
  createTimeScale,
  derivePriceDomain,
  niceDisplayStep,
  selectEvenIndexes
} from '../../../services/professionalChartGeometry.js'
import {
  normalizeChartPanelSizes,
  normalizeChartPanelVisibility
} from '../../../services/professionalTerminalPersistence.js'
import {
  aggregateProfessionalBars,
  formatCandleCloseCountdown
} from '../../../services/proPlayback.js'
import { chartDefaults, chartDimensions, chartViewportLimits, storageKeys } from '../config.js'
import { formatClock as clock, formatNumber as fmt } from '../formatters.js'
import CandlesLayer from './CandlesLayer.jsx'
import FootprintLayer from './FootprintLayer.jsx'
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
const {
  chartPanelSizes: chartPanelSizesStorageKey,
  chartPanelVisibility: chartPanelVisibilityStorageKey
} = storageKeys

export default function MarketChart({ mode, sourceTickSize, timeframe, view }) {
  const [panelSizes, setPanelSizes] = usePersistentState(
    chartPanelSizesStorageKey,
    normalizeChartPanelSizes
  )
  const [panelVisibility, setPanelVisibility] = usePersistentState(
    chartPanelVisibilityStorageKey,
    normalizeChartPanelVisibility
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const chartRef = useRef(null)
  const priceChartRef = useRef(null)
  const bars = useMemo(
    () => aggregateProfessionalBars(view.bars, timeframe),
    [timeframe, view.bars]
  )
  const current = bars.at(-1)

  useEffect(() => {
    if (!settingsOpen) return undefined
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && chartRef.current?.contains(event.target)) return
      setSettingsOpen(false)
    }
    window.addEventListener('keydown', close)
    window.addEventListener('pointerdown', close)
    return () => {
      window.removeEventListener('keydown', close)
      window.removeEventListener('pointerdown', close)
    }
  }, [settingsOpen])

  const defaultVisibleCount = chartDefaults[mode]
  const {
    dragging,
    followLatest,
    handleKeyDown,
    handlePointerDown,
    handlePointerMove,
    handleWheel,
    resetViewport,
    safeOffset,
    stopDragging,
    visible,
    visibleCount
  } = useChartViewport({
    bars,
    defaultVisibleCount,
    limits: chartViewportLimits[mode],
    mode,
    plotRatio: plotRight / chartWidth,
    timeframe
  })

  useEffect(() => {
    const chart = priceChartRef.current
    if (!chart) return undefined
    chart.addEventListener('wheel', handleWheel, { passive: false })
    return () => chart.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

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
  const priceScale = createPriceScale({ high, low, range }, mainTop, mainBottom)
  const y = priceScale.toY
  const plotWidth = plotRight - plotLeft
  const chartSlots = createTimeScale(visible.length, visibleCount, plotLeft, plotWidth)
  const step = chartSlots.step
  const x = (index) => chartSlots.positions[index]
  const profile = buildSessionProfile(view.profile, low, high)
  const maxProfile = Math.max(...profile.map((level) => level.ask + level.bid), 1)
  const profileMarkers = [
    { label: 'VAH', price: current.vah, tone: 'value-area' },
    { label: 'NPOC', price: current.poc, tone: 'npoc' },
    { label: 'VAL', price: current.val, tone: 'value-area' }
  ]
  const priceTicks = createPriceTicks({ high, low, range }, 9)
  const timeIndexes = selectEvenIndexes(visible.length, Math.min(6, visible.length))
  const candleWidth = clamp(step * 0.58, 4, 16)
  const volumeWidth = clamp(step * 0.48, 5, 18)
  const footprintZoomScale = clamp(chartDefaults.footprint / visible.length, 1, 1.6)
  const footprintFontSize = clamp(10 + (footprintZoomScale - 1) * 7, 10, 14)
  const footprintDeltaFontSize = clamp(11 + (footprintZoomScale - 1) * 5, 11, 14)
  const stepZoomScale = clamp(chartDefaults['step-profile'] / visible.length, 1, 1.5)
  const stepDeltaFontSize = clamp(13 + (stepZoomScale - 1) * 4, 13, 15)
  const footprintTickSize = niceDisplayStep((range / 28) * footprintZoomScale, sourceTickSize)
  const stepProfileTickSize = niceDisplayStep(range / 64, sourceTickSize)
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

  const windowLabel = `${clock(visible[0]?.timestamp ?? view.timestamp)} – ${clock(
    visible.at(-1)?.timestamp ?? view.timestamp
  )}`
  const candleCloseCountdown = formatCandleCloseCountdown(view.timestamp, timeframe)
  const chartPanelStyle = {
    '--volume-panel-height': panelVisibility.volume ? `${panelSizes.volume}px` : '0px',
    '--volume-resizer-height': panelVisibility.volume ? '7px' : '0px'
  }
  const resetChart = () => {
    resetViewport()
    resetPriceScale()
  }
  const handleChartKeyDown = (event) => {
    if (event.key === '0') resetPriceScale()
    handleKeyDown(event)
  }

  return (
    <section className="market-chart" ref={chartRef}>
      <header>
        <div className="chart-summary">
          <span>
            O {fmt(current.open)} · H {fmt(current.high)} · L {fmt(current.low)} · C{' '}
            {fmt(current.close)} · Δ {fmt(current.delta)} · V {fmt(current.volume)}
          </span>
        </div>
        <div className="chart-controls" aria-label="Chart controls">
          <button onClick={resetChart} type="button">
            RESET
          </button>
          <button
            aria-controls="chart-settings-panel"
            aria-expanded={settingsOpen}
            aria-label="Chart settings"
            className="chart-settings-button"
            onClick={() => setSettingsOpen((current) => !current)}
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
          role="dialog"
        >
          <strong>CHART SETTINGS</strong>
          <div className="chart-panel-options">
            <label>
              <input
                aria-label="Show session volume profile"
                checked={panelVisibility.profile}
                onChange={(event) =>
                  setPanelVisibility((current) => ({
                    ...current,
                    profile: event.target.checked
                  }))
                }
                type="checkbox"
              />
              <span>SESSION VOLUME PROFILE</span>
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
          </div>
        </aside>
      )}
      <div
        className="market-chart-panels"
        data-show-profile={panelVisibility.profile}
        data-show-volume={panelVisibility.volume}
        style={chartPanelStyle}
      >
        <div className="price-chart-panel">
          <svg
            aria-description="Use the wheel to resize the time axis around the last visible candle. Drag the chart right to reveal older candles and left to return toward the latest data. Scroll horizontally, hold Shift while scrolling, or use the arrow keys to pan. Drag the price axis vertically to resize it. Press zero to reset to the latest data."
            aria-label={`${mode} historical chart`}
            className={resizingPriceScale ? 'resizing-price-scale' : dragging ? 'dragging' : ''}
            data-follow-latest={followLatest}
            data-price-scale-factor={priceScaleFactor.toFixed(4)}
            data-right-offset={safeOffset}
            data-visible-count={visibleCount}
            data-window-end={visible.at(-1)?.timestamp ?? ''}
            data-window-start={visible[0]?.timestamp ?? ''}
            onKeyDown={handleChartKeyDown}
            onPointerCancel={stopDragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            preserveAspectRatio="none"
            ref={priceChartRef}
            role="application"
            tabIndex={0}
            viewBox={`0 0 ${chartWidth} ${priceChartHeight}`}
          >
            <rect width={chartWidth} height={priceChartHeight} fill="#0b0f12" />
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
                key={visible[index]?.timestamp}
                x1={x(index)}
                x2={x(index)}
                y1={mainTop}
                y2={priceChartHeight}
              />
            ))}

            {mode === 'candles' && (
              <CandlesLayer
                bars={visible}
                centers={chartSlots.positions}
                priceScale={priceScale}
                width={candleWidth}
              />
            )}

            {mode === 'footprint' && (
              <FootprintLayer
                bars={visible}
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
                bars={visible}
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

            {panelVisibility.profile && (
              <SessionProfileOverlay
                markers={profileMarkers}
                maximumVolume={maxProfile}
                priceScale={priceScale}
                profile={profile}
              />
            )}

            <line
              className="poc-line"
              x1={plotLeft}
              x2={plotRight}
              y1={y(current.poc)}
              y2={y(current.poc)}
            />
            <line
              className="value-line"
              x1={plotLeft}
              x2={plotRight}
              y1={y(current.vah)}
              y2={y(current.vah)}
            />
            <line
              className="value-line"
              x1={plotLeft}
              x2={plotRight}
              y1={y(current.val)}
              y2={y(current.val)}
            />

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
                key={`time-${visible[index]?.timestamp}`}
                textAnchor="middle"
                x={x(index)}
                y={timeTickY}
              >
                {clock(visible[index]?.timestamp ?? view.timestamp).slice(0, 5)}
              </text>
            ))}

            <text
              aria-label="Visible chart window"
              className="window-label"
              x={plotRight}
              y={priceChartHeight - 8}
              textAnchor="end"
            >
              {windowLabel}
            </text>

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
            bars={visible}
            centers={chartSlots.positions}
            setPanelSizes={setPanelSizes}
            timeIndexes={timeIndexes}
            width={volumeWidth}
          />
        )}
      </div>
    </section>
  )
}
