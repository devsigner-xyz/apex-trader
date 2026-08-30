/* eslint-disable react/prop-types */
import { chartDimensions } from '../config.js'
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
const plotWidth = plotRight - plotLeft
const profileMarkerWidth = 38
const profileMarkerX = plotLeft + 8
const profileMarkerTextX = profileMarkerX + profileMarkerWidth / 2

export default function MarketChartSurface({
  candleCloseCountdown,
  chartSlots,
  crosshair,
  current,
  dragging,
  followLatest,
  handleChartKeyDown,
  handleChartPointerCancel,
  handleChartPointerLeave,
  handleChartPointerMove,
  handlePointerDown,
  handlePointerUp,
  liquidity,
  maxProfile,
  mode,
  panelVisibility,
  presentation,
  priceDomain,
  priceScale,
  priceScaleFactor,
  priceScaleHandlers,
  profile,
  profileMarkers,
  renderBars,
  resizingPriceScale,
  safeOffset,
  setPanelSizes,
  svgRef,
  timeIndexes,
  timeframe,
  view,
  viewportEnd,
  viewportStart,
  visible,
  visibleProfile,
  visibleCount
}) {
  const { high, low, range } = priceDomain
  const y = priceScale.toY
  const x = (index) => chartSlots.positions[index]

  return (
    <>
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
          onPointerLeave={handleChartPointerLeave}
          onPointerMove={handleChartPointerMove}
          onPointerUp={handlePointerUp}
          preserveAspectRatio="none"
          ref={svgRef}
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

          {presentation.priceTicks.map((price) => (
            <g key={price}>
              <line className="gridline" x1={plotLeft} x2={plotRight} y1={y(price)} y2={y(price)} />
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
                width={presentation.candleWidth}
              />
            )}

            {mode === 'footprint' && (
              <FootprintLayer
                bars={renderBars}
                centers={chartSlots.positions}
                deltaFontSize={presentation.footprintDeltaFontSize}
                domain={{ high, low, range }}
                fontSize={presentation.footprintFontSize}
                plotBounds={{ bottom: mainBottom, top: mainTop }}
                priceScale={priceScale}
                settings={presentation.footprintSettings}
                step={chartSlots.step}
                tickSize={presentation.footprintTickSize}
                zoomScale={presentation.footprintZoomScale}
              />
            )}

            {mode === 'step-profile' && (
              <StepProfileLayer
                bars={renderBars}
                centers={chartSlots.positions}
                deltaFontSize={presentation.stepDeltaFontSize}
                domain={{ high, low, range }}
                plotBounds={{ bottom: mainBottom, top: mainTop }}
                priceScale={priceScale}
                settings={presentation.stepProfileSettings}
                step={chartSlots.step}
                tickSize={presentation.stepProfileTickSize}
                zoomScale={presentation.stepZoomScale}
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
            onDoubleClick={priceScaleHandlers.handleDoubleClick}
            onKeyDown={priceScaleHandlers.handleKeyDown}
            onPointerCancel={priceScaleHandlers.stopResizing}
            onPointerDown={priceScaleHandlers.handlePointerDown}
            onPointerMove={priceScaleHandlers.handlePointerMove}
            onPointerUp={priceScaleHandlers.stopResizing}
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
          crosshairX={crosshair?.x ?? null}
          maximumVolume={presentation.maximumVisibleVolume}
          setPanelSizes={setPanelSizes}
          timeIndexes={timeIndexes}
          width={presentation.volumeWidth}
        />
      )}
    </>
  )
}
