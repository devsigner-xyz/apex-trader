/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useChartViewport } from '../../../hooks/useChartViewport.js'
import { usePersistentState } from '../../../hooks/usePersistentState.js'
import { usePriceAxisScale } from '../../../hooks/usePriceAxisScale.js'
import { useSettingsPopoverFocus } from '../../../hooks/useSettingsPopoverFocus.js'
import {
  buildSessionProfile,
  createPriceScale,
  createPriceTicks,
  createTemporalViewport,
  createTimeScale,
  derivePriceDomain,
  findTimeScaleBarIndex
} from '../../../services/professionalChartGeometry.js'
import {
  normalizeChartAppearance,
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
  chartViewportLimits,
  storageKeys
} from '../config.js'
import ChartControls from './ChartControls.jsx'
import ChartSettingsPopover from './ChartSettingsPopover.jsx'
import ChartSummary from './ChartSummary.jsx'
import MarketChartSurface from './MarketChartSurface.jsx'
import {
  deriveChartLayerPresentation,
  deriveChartPanelStyle,
  deriveProfileMarkers,
  selectVisibleTimeTickIndexes
} from './marketChartPresentation.js'
import { trackEvent } from '../../../services/analytics.js'

const { chartWidth, mainBottom, mainTop, plotLeft, plotRight, priceChartHeight } = chartDimensions
const plotWidth = plotRight - plotLeft
const {
  chartAppearance: chartAppearanceStorageKey,
  chartLiquidity: chartLiquidityStorageKey,
  chartPanelSizes: chartPanelSizesStorageKey,
  chartPanelVisibility: chartPanelVisibilityStorageKey
} = storageKeys

export default function MarketChart({
  initialLiquidity,
  initialPanelVisibility,
  mode,
  onMode,
  onTimeframe,
  sourceTickSize,
  timeframe,
  view
}) {
  const [appearance, setAppearance] = usePersistentState(
    chartAppearanceStorageKey,
    normalizeChartAppearance
  )
  const [persistedLiquidity, setPersistedLiquidity] = usePersistentState(
    chartLiquidityStorageKey,
    normalizeChartLiquidity
  )
  const [panelSizes, setPanelSizes] = usePersistentState(
    chartPanelSizesStorageKey,
    normalizeChartPanelSizes
  )
  const [persistedPanelVisibility, setPersistedPanelVisibility] = usePersistentState(
    chartPanelVisibilityStorageKey,
    normalizeChartPanelVisibility
  )
  const [storyLiquidity, setStoryLiquidity] = useState(() =>
    normalizeChartLiquidity(initialLiquidity)
  )
  const [storyPanelVisibility, setStoryPanelVisibility] = useState(() =>
    normalizeChartPanelVisibility(initialPanelVisibility)
  )
  const liquidity = initialLiquidity ? storyLiquidity : persistedLiquidity
  const panelVisibility = initialPanelVisibility ? storyPanelVisibility : persistedPanelVisibility
  const setLiquidity = initialLiquidity ? setStoryLiquidity : setPersistedLiquidity
  const setPanelVisibility = initialPanelVisibility
    ? setStoryPanelVisibility
    : setPersistedPanelVisibility
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
  const chartSlots = createTimeScale(renderBars.length, visibleCount, plotLeft, plotWidth, phase)
  const { end: viewportEnd, start: viewportStart } = createTemporalViewport({
    firstTimestamp: bars[0].timestamp,
    intervalMs: timeframe * 60_000,
    logicalStart,
    slotCount: visibleCount
  })
  const visibleProfile = deriveVolumeProfile(visible)
  const profile = buildSessionProfile(visibleProfile.levels, low, high)
  const maxProfile = Math.max(...profile.map((level) => level.ask + level.bid), 1)
  const presentation = {
    ...deriveChartLayerPresentation({
      range,
      sourceTickSize,
      step: chartSlots.step,
      visible,
      visibleCount
    }),
    priceTicks: createPriceTicks({ high, low, range }, 9)
  }
  const profileMarkers = deriveProfileMarkers(visibleProfile)
  const timeIndexes = selectVisibleTimeTickIndexes(chartSlots.positions, plotLeft, plotRight)
  const candleCloseCountdown = formatCandleCloseCountdown(view.timestamp, timeframe)
  const chartPanelStyle = deriveChartPanelStyle(panelSizes, panelVisibility)

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
    const price = priceScale.fromY(chartY)
    const roundedPrice = Math.round(price / sourceTickSize) * sourceTickSize
    setCrosshair(insidePricePlot ? { price: roundedPrice, x: chartX, y: chartY } : null)
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
  const handleChartPointerLeave = () => {
    setHoveredBarIndex(null)
    setCrosshair(null)
  }
  const handlePanelVisibilityChange = (panel, visible) => {
    setPanelVisibility((currentVisibility) => ({ ...currentVisibility, [panel]: visible }))
    trackEvent('change_demo_setting', {
      area: 'chart',
      setting: panel,
      value: visible ? 'visible' : 'hidden'
    })
  }
  const handleLiquidityEnabledChange = (enabled) => {
    setLiquidity((currentLiquidity) => ({ ...currentLiquidity, enabled }))
    trackEvent('change_demo_setting', {
      area: 'chart',
      setting: 'liquidity_heatmap',
      value: enabled ? 'enabled' : 'disabled'
    })
  }
  const handleLiquidityIntensityChange = (intensity) => {
    setLiquidity((currentLiquidity) => ({ ...currentLiquidity, intensity }))
  }
  const handleLiquidityIntensityCommit = (intensity) => {
    trackEvent('change_demo_setting', {
      area: 'chart',
      setting: 'liquidity_intensity',
      value: Math.round(intensity * 100)
    })
  }
  const handleCandleColorChange = (side, color) => {
    setAppearance((currentAppearance) => ({
      ...currentAppearance,
      candles: { ...currentAppearance.candles, [side]: color }
    }))
    trackEvent('change_demo_setting', {
      area: 'chart',
      setting: `candles_${side}_color`,
      value: color
    })
  }
  const resetCandleColors = () => {
    setAppearance((currentAppearance) => ({
      ...currentAppearance,
      candles: { down: null, up: null }
    }))
    trackEvent('change_demo_setting', {
      area: 'chart',
      setting: 'candles_colors',
      value: 'system_default'
    })
  }
  const handleStepProfileColorChange = (side, color) => {
    setAppearance((currentAppearance) => ({
      ...currentAppearance,
      stepProfile: { ...currentAppearance.stepProfile, [side]: color }
    }))
    trackEvent('change_demo_setting', {
      area: 'chart',
      setting: `step_profile_${side}_color`,
      value: color
    })
  }
  const resetStepProfileColors = () => {
    setAppearance((currentAppearance) => ({
      ...currentAppearance,
      stepProfile: { ask: null, bid: null }
    }))
    trackEvent('change_demo_setting', {
      area: 'chart',
      setting: 'step_profile_colors',
      value: 'system_default'
    })
  }
  const summaryBar = bars[hoveredBarIndex] ?? current
  const activeModeColorStyle =
    mode === 'candles'
      ? {
          ...(appearance.candles.down
            ? { '--pro-chart-negative': appearance.candles.down }
            : {}),
          ...(appearance.candles.up ? { '--pro-chart-positive': appearance.candles.up } : {})
        }
      : mode === 'step-profile'
        ? {
            ...(appearance.stepProfile.ask
              ? { '--pro-chart-negative': appearance.stepProfile.ask }
              : {}),
            ...(appearance.stepProfile.bid
              ? { '--pro-chart-positive': appearance.stepProfile.bid }
              : {})
          }
        : {}
  const chartAppearanceStyle = {
    ...chartPanelStyle,
    ...activeModeColorStyle,
    ...(appearance.candles.down ? { '--pro-candle-down': appearance.candles.down } : {}),
    ...(appearance.candles.up ? { '--pro-candle-up': appearance.candles.up } : {}),
    ...(appearance.stepProfile.ask
      ? { '--pro-step-profile-ask': appearance.stepProfile.ask }
      : {}),
    ...(appearance.stepProfile.bid
      ? { '--pro-step-profile-bid': appearance.stepProfile.bid }
      : {})
  }

  return (
    <section className="market-chart" ref={chartRef}>
      <header>
        <ChartSummary bar={summaryBar} />
        <ChartControls
          mode={mode}
          onMode={onMode}
          onOpenSettings={handleTriggerClick}
          onTimeframe={onTimeframe}
          settingsOpen={settingsOpen}
          settingsTriggerRef={settingsTriggerRef}
          timeframe={timeframe}
        />
      </header>
      {settingsOpen && (
        <ChartSettingsPopover
          candleColors={appearance.candles}
          liquidity={liquidity}
          mode={mode}
          onCandleColorChange={handleCandleColorChange}
          onLiquidityEnabledChange={handleLiquidityEnabledChange}
          onLiquidityIntensityCommit={handleLiquidityIntensityCommit}
          onLiquidityIntensityChange={handleLiquidityIntensityChange}
          onPanelVisibilityChange={handlePanelVisibilityChange}
          onStepProfileColorChange={handleStepProfileColorChange}
          panelVisibility={panelVisibility}
          popoverRef={settingsPopoverRef}
          resetCandleColors={resetCandleColors}
          resetStepProfileColors={resetStepProfileColors}
          stepProfileColors={appearance.stepProfile}
        />
      )}
      <div
        className="market-chart-panels"
        data-show-profile={panelVisibility.profile}
        data-show-value-area={panelVisibility.valueArea}
        data-show-volume={panelVisibility.volume}
        style={chartAppearanceStyle}
      >
        <MarketChartSurface
          candleCloseCountdown={candleCloseCountdown}
          chartSlots={chartSlots}
          crosshair={crosshair}
          current={current}
          dragging={dragging}
          followLatest={followLatest}
          handleChartKeyDown={handleChartKeyDown}
          handleChartPointerCancel={handleChartPointerCancel}
          handleChartPointerLeave={handleChartPointerLeave}
          handleChartPointerMove={handleChartPointerMove}
          handlePointerDown={handlePointerDown}
          handlePointerUp={stopDragging}
          liquidity={liquidity}
          maxProfile={maxProfile}
          mode={mode}
          panelVisibility={panelVisibility}
          presentation={presentation}
          priceDomain={priceDomain}
          priceScale={priceScale}
          priceScaleFactor={priceScaleFactor}
          priceScaleHandlers={{
            handleDoubleClick: handlePriceScaleDoubleClick,
            handleKeyDown: handlePriceScaleKeyDown,
            handlePointerDown: handlePriceScalePointerDown,
            handlePointerMove: handlePriceScalePointerMove,
            stopResizing: stopPriceScaleResize
          }}
          profile={profile}
          profileMarkers={profileMarkers}
          renderBars={renderBars}
          resizingPriceScale={resizingPriceScale}
          safeOffset={safeOffset}
          setPanelSizes={setPanelSizes}
          svgRef={priceChartRef}
          timeIndexes={timeIndexes}
          timeframe={timeframe}
          view={view}
          viewportEnd={viewportEnd}
          viewportStart={viewportStart}
          visible={visible}
          visibleProfile={visibleProfile}
          visibleCount={visibleCount}
        />
      </div>
    </section>
  )
}
