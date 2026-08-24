/* eslint-disable react/prop-types */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { deriveFootprintBar, formatFootprintVolume } from '../services/footprintPresentation.js'
import {
  aggregateDomOrderbook,
  domPriceGroupings,
  formatDomGrouping
} from '../services/domPresentation.js'
import { aggregateProfessionalBars, formatCandleCloseCountdown } from '../services/proPlayback.js'

const fixtureMarkets = [
  ['BTCUSDT', '7,391.62', '7,391.61', '7,391.63', '+0.30%', '5.1K'],
  ['ETHUSDT', '151.42', '151.41', '151.43', '-0.89%', '112K'],
  ['BNBUSDT', '15.88', '15.87', '15.89', '+0.43%', '47K'],
  ['XRPUSDT', '0.2251', '0.2250', '0.2252', '+1.12%', '2.4M'],
  ['ES', '3,146.25', '3,146.00', '3,146.50', '+0.38%', '1.1M'],
  ['NQ', '8,402.50', '8,402.25', '8,402.75', '+0.95%', '484K'],
  ['YM', '28,083', '28,082', '28,084', '+0.76%', '64K'],
  ['RTY', '1,624.1', '1,624.0', '1,624.2', '+0.26%', '129K'],
  ['CL', '55.42', '55.41', '55.43', '+2.39%', '211K'],
  ['GC', '1,472.6', '1,472.5', '1,472.7', '+2.09%', '191K'],
  ['SI', '17.05', '17.04', '17.06', '+1.82%', '63K'],
  ['ZN', "129'085", "129'080", "129'090", '-0.22%', '2.4M'],
  ['EURUSD', '1.1018', '1.1017', '1.1019', '+0.06%', '—'],
  ['GBPUSD', '1.2904', '1.2903', '1.2905', '+0.10%', '—'],
  ['USDJPY', '109.52', '109.51', '109.53', '-0.11%', '—'],
  ['AAPL', '66.04', '66.03', '66.05', '-0.63%', '47M'],
  ['MSFT', '151.38', '151.37', '151.39', '+0.43%', '23M'],
  ['NVDA', '5.40', '5.39', '5.41', '-0.98%', '99M'],
  ['AMD', '39.15', '39.14', '39.16', '+0.81%', '14M'],
  ['TSLA', '22.10', '22.09', '22.11', '+5.14%', '59M'],
  ['META', '202.00', '201.99', '202.01', '+0.75%', '14M'],
  ['AMZN', '89.08', '89.07', '89.09', '-0.57%', '36M'],
  ['GOOGL', '65.68', '65.67', '65.69', '+1.22%', '21M'],
  ['NFLX', '314.66', '314.65', '314.67', '-0.69%', '24M'],
  ['DAX', '13,236', '—', '—', '+0.59%', '43M'],
  ['VIX', '12.62', '—', '—', '-5.50%', '—'],
  ['QQQ', '205.58', '205.57', '205.59', '+0.35%', '33M'],
  ['SPY', '314.31', '314.30', '314.32', '+0.41%', '39M']
]

const watchlistColumns = [
  { id: 'symbol', label: 'SYM', required: true, sourceIndex: 0, width: 'minmax(0, 1.4fr)' },
  { id: 'last', label: 'LAST', required: true, sourceIndex: 1, width: 'minmax(0, 1.15fr)' },
  { id: 'bid', label: 'BID', sourceIndex: 2, width: 'minmax(0, 1fr)' },
  { id: 'ask', label: 'ASK', sourceIndex: 3, width: 'minmax(0, 1fr)' },
  { id: 'change', label: 'Δ%', sourceIndex: 4, width: 'minmax(0, 0.82fr)' },
  { id: 'volume', label: 'VOL', sourceIndex: 5, width: 'minmax(0, 0.9fr)' }
]
const optionalWatchlistColumns = watchlistColumns
  .filter(({ required }) => !required)
  .map(({ id }) => id)
const watchlistColumnsStorageKey = 'apex-trader:markets-columns'
const panelSizesStorageKey = 'apex-trader:panel-sizes:v1'
const panelSizeDefaults = { dom: 218, execution: 280, watch: 360 }
const panelSizeLimits = {
  dom: [218, 340],
  execution: [250, 380],
  watch: [340, 460]
}

const activityTabs = [
  ['POSITIONS', 'POSITIONS  2'],
  ['ORDERS', 'ORDERS  4'],
  ['FILLS', 'FILLS  12'],
  ['ACTIVITY', 'ACTIVITY'],
  ['ACCOUNT & RISK', 'ACCOUNT & RISK']
]

const activityRows = {
  POSITIONS: [
    [
      '02:17:06',
      'POSITION',
      'BTCUSDT',
      'BUY',
      '0.25',
      '7,366.42',
      'OPEN',
      '+$6.30',
      'DEMO',
      'CLOSE'
    ],
    [
      '01:48:03',
      'POSITION',
      'BTCUSDT',
      'SELL',
      '0.10',
      '7,405.00',
      'OPEN',
      '+$4.58',
      'DEMO',
      'CLOSE'
    ]
  ],
  ORDERS: [
    ['04:02:18', 'LIMIT', 'BTCUSDT', 'BUY', '0.25', '7,380.50', 'WORKING', '—', 'DEMO', 'CANCEL'],
    ['03:58:40', 'STOP', 'BTCUSDT', 'SELL', '0.25', '7,350.00', 'WORKING', '—', 'DEMO', 'CANCEL'],
    [
      '02:17:06',
      'LIMIT',
      'BTCUSDT',
      'SELL',
      '0.10',
      '7,412.18',
      'FILLED',
      '+$4.58',
      'DEMO',
      'DETAILS'
    ],
    ['01:48:03', 'STOP', 'BTCUSDT', 'BUY', '0.10', '7,405.00', 'CANCELLED', '—', 'DEMO', 'DETAILS']
  ],
  FILLS: [
    [
      '03:42:11',
      'MARKET',
      'BTCUSDT',
      'BUY',
      '0.25',
      '7,366.42',
      'FILLED',
      '+$6.30',
      'DEMO',
      'DETAILS'
    ],
    [
      '02:17:06',
      'LIMIT',
      'BTCUSDT',
      'SELL',
      '0.10',
      '7,412.18',
      'FILLED',
      '+$4.58',
      'DEMO',
      'DETAILS'
    ],
    [
      '01:22:14',
      'LIMIT',
      'BTCUSDT',
      'BUY',
      '0.15',
      '7,398.24',
      'FILLED',
      '+$7.54',
      'DEMO',
      'DETAILS'
    ]
  ],
  ACTIVITY: [
    ['04:02:18', 'ORDER', 'BTCUSDT', 'BUY', '0.25', '7,380.50', 'ACCEPTED', '—', 'DEMO', 'DETAILS'],
    [
      '03:58:40',
      'RISK',
      'BTCUSDT',
      'SELL',
      '0.25',
      '7,350.00',
      'VALIDATED',
      '—',
      'DEMO',
      'DETAILS'
    ],
    [
      '03:42:11',
      'FILL',
      'BTCUSDT',
      'BUY',
      '0.25',
      '7,366.42',
      'COMPLETE',
      '+$6.30',
      'DEMO',
      'DETAILS'
    ]
  ],
  'ACCOUNT & RISK': [
    ['SESSION', 'RISK', 'BTCUSDT', '—', '0.50', '—', 'WITHIN LIMITS', '+$18.42', 'DEMO', 'DETAILS'],
    ['SESSION', 'FEES', 'BTCUSDT', '—', '—', '$0.75', 'ESTIMATED', '—', 'DEMO', 'DETAILS']
  ]
}

function activityTabId(id) {
  return `activity-tab-${id.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`
}

const chartDefaults = { candles: 34, footprint: 12, 'step-profile': 9 }
const chartMinimums = { candles: 10, footprint: 4, 'step-profile': 4 }
const chartTimeframes = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '4 hours', minutes: 240 },
  { label: '1 day', minutes: 1440 }
]
const footprintTimeframes = chartTimeframes.filter(({ minutes }) => minutes >= 60)
const chartWidth = 1128
const chartHeight = 730
const plotLeft = 0
const chartLabelInset = 8
const plotRight = 1048
const profileWidth = 150
const profileClearance = 20
const priceAxisX = 1056
const mainTop = 42
const mainBottom = 505
const volumeTop = 558
const volumeBottom = 625
const deltaTop = 662
const deltaBaseline = 692

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function loadPanelSizes() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(panelSizesStorageKey))
    return Object.fromEntries(
      Object.entries(panelSizeDefaults).map(([panel, fallback]) => {
        const value = Number(stored?.[panel])
        const [minimum, maximum] = panelSizeLimits[panel]
        return [panel, Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback]
      })
    )
  } catch {
    return { ...panelSizeDefaults }
  }
}

function fmt(value, digits = 2) {
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  })
}

function clock(timestamp, milliseconds = false) {
  return new Date(timestamp).toISOString().slice(11, milliseconds ? 23 : 19)
}

function formatTimeframe(timeframe) {
  if (timeframe === 1440) return '1D'
  if (timeframe >= 60) return `${timeframe / 60}H`
  return `${timeframe}M`
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z" />
      <path d="m19.2 13.1 1.5 1.2-1.8 3.1-1.8-.7c-.5.4-1 .8-1.6 1l-.3 1.9h-3.6l-.3-1.9a7 7 0 0 1-1.6-1l-1.8.7-1.8-3.1 1.5-1.2a7.2 7.2 0 0 1 0-2.2L6.1 9.7l1.8-3.1 1.8.7c.5-.4 1-.8 1.6-1l.3-1.9h3.6l.3 1.9c.6.2 1.1.6 1.6 1l1.8-.7 1.8 3.1-1.5 1.2a7.2 7.2 0 0 1 0 2.2Z" />
    </svg>
  )
}

function Watchlist() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [optionalColumns, setOptionalColumns] = useState(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(watchlistColumnsStorageKey))
      if (!Array.isArray(stored)) return optionalWatchlistColumns
      return optionalWatchlistColumns.filter((column) => stored.includes(column))
    } catch {
      return optionalWatchlistColumns
    }
  })
  const watchlistRef = useRef(null)
  const visibleColumns = watchlistColumns.filter(
    ({ id, required }) => required || optionalColumns.includes(id)
  )
  const gridTemplateColumns = visibleColumns.map(({ width }) => width).join(' ')

  useEffect(() => {
    window.localStorage.setItem(watchlistColumnsStorageKey, JSON.stringify(optionalColumns))
  }, [optionalColumns])

  useEffect(() => {
    if (!settingsOpen) return undefined
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && watchlistRef.current?.contains(event.target)) return
      setSettingsOpen(false)
    }
    window.addEventListener('keydown', close)
    window.addEventListener('pointerdown', close)
    return () => {
      window.removeEventListener('keydown', close)
      window.removeEventListener('pointerdown', close)
    }
  }, [settingsOpen])

  return (
    <section className="pro-watchlist" aria-label="Markets" ref={watchlistRef}>
      <header>
        <strong>MARKETS</strong>
        <button
          aria-controls="markets-settings-panel"
          aria-expanded={settingsOpen}
          aria-label="Markets settings"
          className="watch-settings-button"
          onClick={() => setSettingsOpen((current) => !current)}
          title="Markets settings"
          type="button"
        >
          <SettingsIcon />
        </button>
      </header>
      {settingsOpen && (
        <aside
          aria-label="Markets columns"
          className="watch-settings-popover"
          id="markets-settings-panel"
          role="dialog"
        >
          <strong>VISIBLE COLUMNS</strong>
          <div className="watch-column-options">
            {watchlistColumns.map(({ id, label, required }) => (
              <label key={id}>
                <input
                  aria-label={`Show ${label} column`}
                  checked={required || optionalColumns.includes(id)}
                  disabled={required}
                  onChange={() => {
                    if (required) return
                    setOptionalColumns((current) =>
                      current.includes(id)
                        ? current.filter((column) => column !== id)
                        : [...current, id]
                    )
                  }}
                  type="checkbox"
                />
                <span>{label}</span>
                {required && <small>ALWAYS</small>}
              </label>
            ))}
          </div>
        </aside>
      )}
      <div className="watch-head" style={{ gridTemplateColumns }}>
        {visibleColumns.map(({ id, label }) => (
          <span className={`watch-cell watch-cell--${id}`} key={id}>
            {label}
          </span>
        ))}
      </div>
      {fixtureMarkets.map((row, index) => (
        <button
          className={index === 0 ? 'selected' : ''}
          key={row[0]}
          style={{ gridTemplateColumns }}
          type="button"
        >
          {visibleColumns.map(({ id, sourceIndex }) => {
            const cell = row[sourceIndex]
            return (
              <span
                className={`watch-cell watch-cell--${id}${
                  id === 'change' ? ` ${cell.startsWith('-') ? 'negative' : 'positive'}` : ''
                }`}
                key={id}
              >
                {cell}
              </span>
            )
          })}
        </button>
      ))}
    </section>
  )
}

function sessionProfile(profile, minimum, maximum) {
  const bins = Array.from({ length: 25 }, (_, index) => ({
    ask: 0,
    bid: 0,
    price: minimum + ((maximum - minimum) * index) / 24
  }))
  for (const level of profile) {
    const index = clamp(
      Math.round(((level.price - minimum) / (maximum - minimum || 1)) * 24),
      0,
      24
    )
    bins[index].ask += level.ask
    bins[index].bid += level.bid
  }
  return bins
}

function uniqueIndexes(length, count) {
  if (length <= 1) return [0]
  return [
    ...new Set(
      Array.from({ length: count }, (_, index) => Math.round((index * (length - 1)) / (count - 1)))
    )
  ]
}

function niceDisplayStep(target, sourceTickSize) {
  if (!Number.isFinite(target) || target <= sourceTickSize) return sourceTickSize
  const magnitude = 10 ** Math.floor(Math.log10(target))
  const normalized = target / magnitude
  const multiplier =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  return Math.max(sourceTickSize, Number((multiplier * magnitude).toFixed(8)))
}

function MarketChart({ mode, sourceTickSize, timeframe, view }) {
  const [visibleCount, setVisibleCount] = useState(chartDefaults[mode])
  const [rightOffset, setRightOffset] = useState(0)
  const [reserveProfileSpace, setReserveProfileSpace] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragState = useRef(null)
  const bars = useMemo(
    () => aggregateProfessionalBars(view.bars, timeframe),
    [timeframe, view.bars]
  )
  const current = bars.at(-1)

  useEffect(() => {
    setVisibleCount(chartDefaults[mode])
    setRightOffset(0)
  }, [mode, timeframe])

  const minimumCount = chartMinimums[mode]
  const maximumOffset = Math.max(0, bars.length - Math.min(visibleCount, bars.length))
  const safeOffset = clamp(rightOffset, 0, maximumOffset)
  const endIndex = bars.length - safeOffset
  const startIndex = Math.max(0, endIndex - visibleCount)
  const visible = bars.slice(startIndex, endIndex)

  useEffect(() => {
    if (rightOffset !== safeOffset) setRightOffset(safeOffset)
  }, [rightOffset, safeOffset])

  const rawLow = Math.min(...visible.map((bar) => bar.low))
  const rawHigh = Math.max(...visible.map((bar) => bar.high))
  const rawRange = rawHigh - rawLow || Math.max(rawHigh * 0.001, 1)
  const low = rawLow - rawRange * 0.08
  const high = rawHigh + rawRange * (mode === 'footprint' ? 0.12 : 0.08)
  const range = high - low
  const y = (price) => mainBottom - ((price - low) / range) * (mainBottom - mainTop)
  const dataPlotRight = reserveProfileSpace
    ? plotRight - profileWidth - profileClearance
    : plotRight
  const plotWidth = dataPlotRight - plotLeft
  const step = plotWidth / Math.max(visible.length, 1)
  const x = (index) => plotLeft + (index + 0.5) * step
  const profile = sessionProfile(view.profile, low, high)
  const maxProfile = Math.max(...profile.map((level) => level.ask + level.bid), 1)
  const maxVolume = Math.max(...visible.map((bar) => bar.volume), 1)
  const maxDelta = Math.max(...visible.map((bar) => Math.abs(bar.delta)), 1)
  const priceTicks = Array.from({ length: 9 }, (_, index) => high - (range * index) / 8)
  const timeIndexes = uniqueIndexes(visible.length, Math.min(6, visible.length))
  const candleWidth = clamp(step * 0.58, 4, 16)
  const volumeWidth = clamp(step * 0.48, 5, 18)
  const footprintZoomScale = clamp(chartDefaults.footprint / visible.length, 1, 1.6)
  const footprintFontSize = clamp(10 + (footprintZoomScale - 1) * 7, 10, 14)
  const footprintDeltaFontSize = clamp(11 + (footprintZoomScale - 1) * 5, 11, 14)
  const stepZoomScale = clamp(chartDefaults['step-profile'] / visible.length, 1, 1.5)
  const stepDeltaFontSize = clamp(13 + (stepZoomScale - 1) * 4, 13, 15)
  const footprintTickSize = niceDisplayStep((range / 28) * footprintZoomScale, sourceTickSize)
  const footprintSettings = {
    format: 'compact',
    imbalanceRatio: 3,
    minimumVolume: 0,
    mode: 'bidAsk',
    scale: 'linear',
    stackedImbalanceSize: 3,
    tickSize: footprintTickSize
  }

  const zoom = (direction) => {
    const increment = mode === 'candles' ? 4 : 1
    setVisibleCount((current) => clamp(current + direction * increment, minimumCount, 96))
  }

  const resetViewport = () => {
    setVisibleCount(chartDefaults[mode])
    setRightOffset(0)
  }

  const handleWheel = (event) => {
    event.preventDefault()
    if (event.shiftKey) {
      setRightOffset((current) => clamp(current + (event.deltaY > 0 ? 2 : -2), 0, maximumOffset))
      return
    }
    zoom(event.deltaY > 0 ? 1 : -1)
  }

  const handlePointerDown = (event) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = { offset: safeOffset, startX: event.clientX }
    setDragging(true)
  }

  const handlePointerMove = (event) => {
    if (!dragState.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const pixelsPerBar = bounds.width / Math.max(visible.length, 1)
    const delta = Math.round((event.clientX - dragState.current.startX) / Math.max(pixelsPerBar, 4))
    setRightOffset(clamp(dragState.current.offset + delta, 0, maximumOffset))
  }

  const stopDragging = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    dragState.current = null
    setDragging(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') setRightOffset((current) => clamp(current + 1, 0, maximumOffset))
    else if (event.key === 'ArrowRight')
      setRightOffset((current) => clamp(current - 1, 0, maximumOffset))
    else if (event.key === '+' || event.key === '=') zoom(-1)
    else if (event.key === '-') zoom(1)
    else if (event.key === '0') resetViewport()
    else return
    event.preventDefault()
  }

  const windowLabel = `${clock(visible[0]?.timestamp ?? view.timestamp)} – ${clock(
    visible.at(-1)?.timestamp ?? view.timestamp
  )}`
  const timeframeLabel = formatTimeframe(timeframe)
  const candleCloseCountdown = formatCandleCloseCountdown(view.timestamp, timeframe)

  return (
    <section className="market-chart">
      <header>
        <div className="chart-summary">
          <span>
            O {fmt(current.open)} H {fmt(current.high)} L {fmt(current.low)} C {fmt(current.close)}
          </span>
          <span>
            {mode === 'footprint'
              ? `Δ ${fmt(current.delta)} · V ${fmt(current.volume)}`
              : `VWAP ${fmt(current.vwap)} · POC ${fmt(current.poc)}`}
          </span>
        </div>
        <div className="chart-controls" aria-label="Chart navigation controls">
          <button aria-label="Zoom chart in" onClick={() => zoom(-1)} type="button">
            −
          </button>
          <output aria-label="Visible bars">{visible.length} bars</output>
          <button aria-label="Zoom chart out" onClick={() => zoom(1)} type="button">
            +
          </button>
          <button onClick={resetViewport} type="button">
            RESET
          </button>
          <button
            aria-label="Reserve space for volume profile"
            aria-pressed={reserveProfileSpace}
            onClick={() => setReserveProfileSpace((current) => !current)}
            title="Keep price bars clear of the session volume profile"
            type="button"
          >
            PROFILE SPACE
          </button>
        </div>
      </header>
      <svg
        aria-description="Drag horizontally to pan. Use the mouse wheel or plus and minus keys to zoom. Press zero to reset."
        aria-label={`${mode} historical chart`}
        className={dragging ? 'dragging' : ''}
        onKeyDown={handleKeyDown}
        onPointerCancel={stopDragging}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onWheel={handleWheel}
        preserveAspectRatio="none"
        role="application"
        tabIndex={0}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        <rect width={chartWidth} height={chartHeight} fill="#0b0f12" />
        <rect
          className="price-axis-bg"
          x={priceAxisX}
          y="0"
          width={chartWidth - priceAxisX}
          height={chartHeight}
        />

        {priceTicks.map((price) => (
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
            key={visible[index]?.timestamp}
            x1={x(index)}
            x2={x(index)}
            y1={mainTop}
            y2={chartHeight}
          />
        ))}

        <text className="quiet" x={chartLabelInset} y="24">
          {mode === 'candles'
            ? `CANDLES · ${timeframeLabel} · VWAP · EMA20`
            : mode === 'footprint'
            ? `BID × ASK · ${timeframeLabel} · ${fmt(footprintTickSize)} USD DISPLAY · ${fmt(
                sourceTickSize
              )} SOURCE`
            : `STEP PROFILE · ${timeframeLabel} · BID × ASK · VA 70%`}
        </text>
        <text className="quiet" x={plotRight - 170} y="24">
          SESSION VOLUME PROFILE
        </text>

        <g className="session-profile" data-layer="background">
          {profile.map((level, index) => {
            const total = level.ask + level.bid
            const width = (total / maxProfile) * profileWidth
            return (
              <g key={index}>
                <rect
                  className="session-profile-bar session-profile-bar--bid"
                  height="8"
                  width={width * 0.48}
                  x={plotRight - width}
                  y={y(level.price) - 4}
                />
                <rect
                  className="session-profile-bar session-profile-bar--ask"
                  height="8"
                  width={width * 0.52}
                  x={plotRight - width * 0.52}
                  y={y(level.price) - 4}
                />
              </g>
            )
          })}
        </g>

        {mode === 'candles' &&
          visible.map((bar, index) => {
            const center = x(index)
            const rising = bar.close >= bar.open
            return (
              <g className={rising ? 'up' : 'down'} key={bar.timestamp}>
                <line x1={center} x2={center} y1={y(bar.high)} y2={y(bar.low)} />
                <rect
                  height={Math.max(2, Math.abs(y(bar.open) - y(bar.close)))}
                  width={candleWidth}
                  x={center - candleWidth / 2}
                  y={Math.min(y(bar.open), y(bar.close))}
                />
              </g>
            )
          })}

        {mode === 'footprint' &&
          visible.map((bar, index) => {
            const center = x(index)
            const footprintBar = deriveFootprintBar(
              {
                ...bar,
                levels: bar.levels.filter(
                  (level) => level.price >= low - footprintTickSize && level.price <= high
                )
              },
              footprintSettings
            )
            const levels = footprintBar.levels.filter(
              (level) =>
                level.price + footprintTickSize / 2 >= low &&
                level.price + footprintTickSize / 2 <= high
            )
            const maximum = Math.max(...levels.flatMap((level) => [level.ask, level.bid]), 1)
            const barWidth = Math.min(step * 0.78, 76)
            const halfWidth = barWidth / 2
            const rowHeight = clamp(
              (footprintTickSize / range) * (mainBottom - mainTop) * 0.88,
              16,
              24 * footprintZoomScale
            )
            return (
              <g className="footprint-bar" key={bar.timestamp}>
                {levels.map((level) => {
                  const price = level.price + footprintTickSize / 2
                  const bidLabel = formatFootprintVolume(level.bid, 'compact')
                  const askLabel = formatFootprintVolume(level.ask, 'compact')
                  return (
                    <g
                      className={`footprint-cell${level.isPoc ? ' is-poc' : ''}`}
                      data-ask={level.ask}
                      data-bid={level.bid}
                      data-price={level.price}
                      key={level.price}
                    >
                      <title>
                        {fmt(level.price)}–{fmt(level.price + footprintTickSize)} · Bid{' '}
                        {fmt(level.bid, 3)} × Ask {fmt(level.ask, 3)}
                      </title>
                      <rect
                        className="footprint-bid-bg"
                        fillOpacity={0.2 + Math.min(1, level.bid / maximum) * 0.72}
                        height={rowHeight}
                        width={halfWidth}
                        x={center - halfWidth}
                        y={y(price) - rowHeight / 2}
                      />
                      <rect
                        className="footprint-ask-bg"
                        fillOpacity={0.2 + Math.min(1, level.ask / maximum) * 0.72}
                        height={rowHeight}
                        width={halfWidth}
                        x={center}
                        y={y(price) - rowHeight / 2}
                      />
                      <line
                        className="footprint-divider"
                        x1={center}
                        x2={center}
                        y1={y(price) - rowHeight / 2}
                        y2={y(price) + rowHeight / 2}
                      />
                      <text
                        className={`footprint-cell-value bid${
                          level.bidImbalance ? ' is-imbalance' : ''
                        }`}
                        style={{ fontSize: footprintFontSize }}
                        textAnchor="end"
                        x={center - 3}
                        y={y(price) + 3}
                      >
                        {bidLabel}
                      </text>
                      <text
                        className={`footprint-cell-value ask${
                          level.askImbalance ? ' is-imbalance' : ''
                        }`}
                        style={{ fontSize: footprintFontSize }}
                        textAnchor="start"
                        x={center + 3}
                        y={y(price) + 3}
                      >
                        {askLabel}
                      </text>
                      {level.isPoc && (
                        <rect
                          className="footprint-poc-outline"
                          height={rowHeight}
                          width={barWidth}
                          x={center - halfWidth}
                          y={y(price) - rowHeight / 2}
                        />
                      )}
                    </g>
                  )
                })}
                <text
                  className={`bar-delta ${bar.delta >= 0 ? 'positive-fill' : 'negative-fill'}`}
                  style={{ fontSize: footprintDeltaFontSize }}
                  textAnchor="middle"
                  x={center}
                  y={Math.max(mainTop + footprintDeltaFontSize, y(bar.high) - 26)}
                >
                  Δ {fmt(bar.delta, 3)}
                </text>
              </g>
            )
          })}

        {mode === 'step-profile' &&
          visible.map((bar, index) => {
            const center = x(index)
            const levels = bar.levels.filter((level) => level.price >= low && level.price <= high)
            const maximum = Math.max(...levels.map((level) => level.ask + level.bid), 1)
            return (
              <g key={bar.timestamp}>
                {levels.map((level) => {
                  const width = ((level.ask + level.bid) / maximum) * step * 0.74
                  return (
                    <rect
                      fill={level.price === bar.poc ? '#d68b54' : '#315f76'}
                      height="4"
                      key={level.price}
                      width={width}
                      x={center - width / 2}
                      y={y(level.price) - 2}
                    />
                  )
                })}
                <line
                  className="profile-spine"
                  x1={center}
                  x2={center}
                  y1={y(bar.high)}
                  y2={y(bar.low)}
                />
                <text
                  className={`bar-delta step-delta ${
                    bar.delta >= 0 ? 'positive-fill' : 'negative-fill'
                  }`}
                  style={{ fontSize: stepDeltaFontSize }}
                  textAnchor="middle"
                  x={center}
                  y={y(bar.low) + 16}
                >
                  Δ {fmt(bar.delta, 2)}
                </text>
              </g>
            )
          })}

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
            y="535"
          >
            {clock(visible[index]?.timestamp ?? view.timestamp).slice(0, 5)}
          </text>
        ))}

        <text className="label" x={chartLabelInset} y={volumeTop - 10}>
          VOLUME · ALIGNED TO PRICE BARS
        </text>
        {visible.map((bar, index) => {
          const height = Math.max(2, (bar.volume / maxVolume) * (volumeBottom - volumeTop))
          return (
            <rect
              className={`volume-bar ${bar.close >= bar.open ? 'volume-up' : 'volume-down'}`}
              height={height}
              key={`volume-${bar.timestamp}`}
              width={volumeWidth}
              x={x(index) - volumeWidth / 2}
              y={volumeBottom - height}
            />
          )
        })}

        <text className="label" x={chartLabelInset} y={deltaTop - 9}>
          CVD Δ · PER BAR
        </text>
        <line
          className="delta-baseline"
          x1={plotLeft}
          x2={plotRight}
          y1={deltaBaseline}
          y2={deltaBaseline}
        />
        {visible.map((bar, index) => {
          const height = (Math.abs(bar.delta) / maxDelta) * (deltaBaseline - deltaTop)
          return (
            <rect
              className={`delta-bar ${bar.delta >= 0 ? 'volume-up' : 'volume-down'}`}
              height={height}
              key={`delta-${bar.timestamp}`}
              width={volumeWidth}
              x={x(index) - volumeWidth / 2}
              y={bar.delta >= 0 ? deltaBaseline - height : deltaBaseline}
            />
          )
        })}

        <text
          aria-label="Visible chart window"
          className="window-label"
          x={plotRight}
          y="718"
          textAnchor="end"
        >
          {windowLabel}
        </text>
      </svg>
    </section>
  )
}

function Dom({ currentPrice, orderbook, onPrice, sourceTickSize }) {
  const [priceGrouping, setPriceGrouping] = useState(sourceTickSize)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const domRef = useRef(null)
  const askLevelsRef = useRef(null)
  const bidLevelsRef = useRef(null)
  const domScrollPosition = useRef({ askFromBottom: 0, bidFromTop: 0 })
  const previousDomGrouping = useRef(null)
  const groupingOptions = useMemo(
    () =>
      domPriceGroupings.filter((grouping) => {
        const multiple = grouping / sourceTickSize
        return grouping >= sourceTickSize && Math.abs(multiple - Math.round(multiple)) < 1e-8
      }),
    [sourceTickSize]
  )
  const groupedOrderbook = useMemo(
    () => aggregateDomOrderbook(orderbook, priceGrouping),
    [orderbook, priceGrouping]
  )
  const asks = [...groupedOrderbook.asks].reverse()
  const bids = groupedOrderbook.bids
  const rows = [...asks, ...bids]
  const maximum = Math.max(...rows.map((row) => row.amount), 1)
  const bestAsk = Number(orderbook.asks[0]?.price)
  const bestBid = Number(orderbook.bids[0]?.price)
  const spread = Number.isFinite(bestAsk) && Number.isFinite(bestBid) ? bestAsk - bestBid : 0
  const groupingMultiple = Math.round(priceGrouping / sourceTickSize)

  useLayoutEffect(() => {
    if (previousDomGrouping.current !== priceGrouping) {
      domScrollPosition.current = { askFromBottom: 0, bidFromTop: 0 }
      previousDomGrouping.current = priceGrouping
    }

    const asksElement = askLevelsRef.current
    const bidsElement = bidLevelsRef.current
    if (asksElement) {
      const { askFromBottom } = domScrollPosition.current
      asksElement.scrollTop = Math.max(
        0,
        asksElement.scrollHeight - asksElement.clientHeight - askFromBottom
      )
    }
    if (bidsElement) bidsElement.scrollTop = domScrollPosition.current.bidFromTop
  }, [groupedOrderbook, priceGrouping])

  useEffect(() => {
    if (!settingsOpen) return undefined
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && domRef.current?.contains(event.target)) return
      setSettingsOpen(false)
    }
    window.addEventListener('keydown', close)
    window.addEventListener('pointerdown', close)
    return () => {
      window.removeEventListener('keydown', close)
      window.removeEventListener('pointerdown', close)
    }
  }, [settingsOpen])

  const renderRow = (row, side, index) => (
    <button
      className={`dom-row ${side}`}
      data-price={row.price}
      key={`${side}-${row.price}`}
      onClick={() => onPrice(row.price)}
      type="button"
    >
      <span>{fmt(row.price)}</span>
      <span>
        {index % 3 === 0 ? `${side === 'bid' ? '+' : '-'}${Math.round(row.amount * 10)}` : ''}
      </span>
      <span style={{ backgroundSize: `${Math.max(8, (row.amount / maximum) * 100)}% 90%` }}>
        {fmt(row.amount, 3)}
      </span>
      <span>{index % 5 === 0 ? Math.round(row.amount * 3) : ''}</span>
    </button>
  )

  return (
    <section
      className="dom"
      data-groups-applied={orderbook.groupsApplied}
      data-price-grouping={priceGrouping}
      ref={domRef}
    >
      <header>
        <strong>DOM</strong>
        <div className="dom-header-meta">
          <span>
            BTC · {formatDomGrouping(priceGrouping)} · x{groupingMultiple}
          </span>
          <button
            aria-controls="dom-settings-panel"
            aria-expanded={settingsOpen}
            aria-label="DOM settings"
            className="dom-settings-button"
            onClick={() => setSettingsOpen((current) => !current)}
            title="DOM settings"
            type="button"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>
      {settingsOpen && (
        <aside
          aria-label="DOM settings"
          className="dom-settings-popover"
          id="dom-settings-panel"
          role="dialog"
        >
          <strong>DOM SETTINGS</strong>
          <label>
            PRICE GROUPING
            <select
              aria-label="DOM price grouping"
              onChange={(event) => setPriceGrouping(Number(event.target.value))}
              value={priceGrouping}
            >
              {groupingOptions.map((grouping) => (
                <option key={grouping} value={grouping}>
                  {formatDomGrouping(grouping)} USDT · x{Math.round(grouping / sourceTickSize)}
                </option>
              ))}
            </select>
          </label>
          <small>
            Aggregates real book levels into price increments. Bids round down; asks round up.
          </small>
        </aside>
      )}
      <div className="dom-head">
        <span>PRICE</span>
        <span>Δ</span>
        <span>SIZE</span>
        <span>LAST</span>
      </div>
      <div className="dom-ladder">
        <div
          aria-label="Ask price levels"
          className="dom-book-side dom-book-side--asks"
          data-level-count={asks.length}
          onScroll={(event) => {
            const element = event.currentTarget
            domScrollPosition.current.askFromBottom = Math.max(
              0,
              element.scrollHeight - element.clientHeight - element.scrollTop
            )
          }}
          ref={askLevelsRef}
          tabIndex={0}
        >
          {asks.map((row, index) => renderRow(row, 'ask', index))}
        </div>
        <div
          aria-label={`Last price ${fmt(currentPrice)}, spread ${fmt(spread)}`}
          className="dom-spread-row"
          data-price={currentPrice}
          data-spread={spread}
        >
          <span>
            <small>LAST</small>
            <strong>{fmt(currentPrice)}</strong>
          </span>
          <span>
            <small>SPREAD</small>
            <strong>{fmt(spread)}</strong>
          </span>
        </div>
        <div
          aria-label="Bid price levels"
          className="dom-book-side dom-book-side--bids"
          data-level-count={bids.length}
          onScroll={(event) => {
            domScrollPosition.current.bidFromTop = event.currentTarget.scrollTop
          }}
          ref={bidLevelsRef}
          tabIndex={0}
        >
          {bids.map((row, index) => renderRow(row, 'bid', index))}
        </div>
      </div>
      <footer>
        <span>
          BID {fmt(orderbook.bids[0]?.price)} ASK {fmt(orderbook.asks[0]?.price)}
        </span>
      </footer>
    </section>
  )
}

function TimeSales({ trades }) {
  return (
    <section className="tape">
      <header>
        <strong>TIME &amp; SALES</strong>
        <span>BTC · HIST</span>
      </header>
      <div className="tape-head">
        <span>TIME</span>
        <span>PRICE</span>
        <span>SIZE</span>
      </div>
      {trades.slice(0, 20).map((trade, index) => (
        <button
          aria-label={`${trade.side} trade at ${fmt(trade.price)} for ${fmt(trade.amount, 4)}`}
          className={trade.side}
          key={`${trade.timestamp}-${index}`}
          type="button"
        >
          <span>{clock(trade.timestamp, true)}</span>
          <span>{fmt(trade.price)}</span>
          <span>{fmt(trade.amount, 4)}</span>
        </button>
      ))}
    </section>
  )
}

function Execution({ price, setPrice, trades }) {
  const [side, setSide] = useState('buy')
  const [quantity, setQuantity] = useState('0.10')
  const [orderType, setOrderType] = useState('Limit')
  const [status, setStatus] = useState('SIM fixture · no order is transmitted')
  const valid = Number(price) > 0 && Number(quantity) > 0
  return (
    <aside className="execution">
      <section className="ticket">
        <header>
          <strong>EXECUTION</strong>
          <span>BTCUSDT</span>
        </header>
        <div className="side-tabs">
          <button
            className={side === 'buy' ? 'active buy' : ''}
            onClick={() => setSide('buy')}
            type="button"
          >
            BUY
          </button>
          <button
            className={side === 'sell' ? 'active sell' : ''}
            onClick={() => setSide('sell')}
            type="button"
          >
            SELL
          </button>
        </div>
        <label>
          ORDER TYPE
          <select onChange={(event) => setOrderType(event.target.value)} value={orderType}>
            <option>Limit</option>
            <option>Market</option>
            <option>Stop</option>
          </select>
        </label>
        <label>
          LIMIT PRICE
          <div className="field">
            <input
              aria-label="Limit price"
              onChange={(event) => setPrice(event.target.value)}
              value={price}
            />
            <span>USDT</span>
          </div>
        </label>
        <label>
          TIME IN FORCE
          <select>
            <option>Day</option>
            <option>GTC</option>
            <option>IOC</option>
          </select>
        </label>
        <label>
          STOP LOSS
          <input defaultValue={price ? fmt(Number(price) - 25) : ''} />
        </label>
        <label>
          TAKE PROFIT
          <input defaultValue={price ? fmt(Number(price) + 35) : ''} />
        </label>
        <label>
          QUANTITY
          <input onChange={(event) => setQuantity(event.target.value)} value={quantity} />
        </label>
        <button
          className={`submit ${side}`}
          disabled={!valid}
          onClick={() =>
            setStatus(
              `SIM ${side.toUpperCase()} ${orderType.toUpperCase()} staged · ${quantity} BTCUSDT${
                orderType === 'Market' ? '' : ` @ ${fmt(price)}`
              } · not transmitted`
            )
          }
          type="button"
        >
          PLACE {side.toUpperCase()} {orderType.toUpperCase()}
        </button>
        <small aria-live="polite">{status}</small>
      </section>
      <TimeSales trades={trades} />
    </aside>
  )
}

function Activity() {
  const [tab, setTab] = useState('POSITIONS')
  const rows = activityRows[tab]
  return (
    <section aria-label="Orders and positions" className="activity">
      <header>
        <div aria-label="Activity views" role="tablist">
          {activityTabs.map(([id, label]) => (
            <button
              aria-controls="activity-panel"
              aria-selected={tab === id}
              id={activityTabId(id)}
              key={id}
              onClick={() => setTab(id)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div>
          <span className="fixture-badge">DEMO DATA</span>
          <span>UPL +$6.30</span>
          <span>RPL +$18.42</span>
          <span>FEES $0.75</span>
        </div>
      </header>
      <div
        aria-labelledby={activityTabId(tab)}
        aria-live="polite"
        id="activity-panel"
        role="tabpanel"
      >
        <div className="activity-head">
          {[
            'TIME',
            'TYPE',
            'SYMBOL',
            'SIDE',
            'QTY',
            'PRICE',
            'STATUS',
            'PNL',
            'ACCOUNT',
            'ACTION'
          ].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        {rows.map((row, index) => (
          <div className="activity-row" key={`${tab}-${index}`}>
            {row.map((cell, cellIndex) => (
              <span className={cell.startsWith('+') ? 'positive' : ''} key={cellIndex}>
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function PanelResizer({ className = '', label, onResize }) {
  const startX = useRef(null)
  const handlePointerDown = (event) => {
    startX.current = event.clientX
    const handleMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX.current
      startX.current = moveEvent.clientX
      onResize(delta)
    }
    const handleUp = () => {
      startX.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }
  return (
    <button
      aria-label={label}
      className={`panel-resizer ${className}`.trim()}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') onResize(-8)
        else if (event.key === 'ArrowRight') onResize(8)
        else return
        event.preventDefault()
      }}
      onPointerDown={handlePointerDown}
      type="button"
    />
  )
}

export default function ProfessionalTerminal({ mode, onMode, playback }) {
  const { isBuffering, playing, seek, session, setPlaying, timestamp, view } = playback
  const [price, setPrice] = useState(Number(view.current.close).toFixed(2))
  const [settings, setSettings] = useState(false)
  const [timeframe, setTimeframe] = useState(() => (mode === 'footprint' ? 60 : 5))
  const [columns, setColumns] = useState(loadPanelSizes)

  useEffect(() => {
    try {
      window.localStorage.setItem(panelSizesStorageKey, JSON.stringify(columns))
    } catch {
      // Keep resizing functional when browser storage is unavailable.
    }
  }, [columns])

  useEffect(() => {
    if (!settings) return undefined
    const close = (event) => {
      if (event.key === 'Escape') setSettings(false)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [settings])

  useEffect(() => {
    if (mode === 'footprint' && timeframe < 60) setTimeframe(60)
  }, [mode, timeframe])

  const modeTitle = {
    candles: 'PRICE CHART WORKSTATION',
    footprint: 'ORDER FLOW WORKSTATION',
    'step-profile': 'STEP PROFILE WORKSTATION'
  }[mode]
  const routeMode = (next) => {
    if (next === 'footprint') setTimeframe((current) => Math.max(current, 60))
    onMode(next)
    history.pushState({}, '', next === 'candles' ? '/price-chart' : `/${next}`)
  }
  const workspaceStyle = {
    '--dom-width': `${columns.dom}px`,
    '--execution-width': `${columns.execution}px`,
    '--watch-width': `${columns.watch}px`
  }

  return (
    <div className="pro-terminal">
      <header className="market-header">
        <strong>APEX TRADER</strong>
        <b>{modeTitle}</b>
        <span>BTCUSDT</span>
        <strong>{fmt(view.current.close)}</strong>
        <span className={view.change >= 0 ? 'positive' : 'negative'}>
          {view.change >= 0 ? '+' : ''}
          {view.change.toFixed(2)}%
        </span>
        <span>UTC · {clock(timestamp)}</span>
      </header>
      <div className="terminal-workspace" style={workspaceStyle}>
        <Watchlist />
        <PanelResizer
          className="watch-resizer"
          label="Resize watchlist"
          onResize={(delta) =>
            setColumns((current) => ({ ...current, watch: clamp(current.watch + delta, 340, 460) }))
          }
        />
        <nav className="workspace-toolbar">
          <select aria-label="Market">
            <option>BTCUSDT</option>
          </select>
          <select
            aria-label="Timeframe"
            onChange={(event) => setTimeframe(Number(event.target.value))}
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
            onChange={(event) => routeMode(event.target.value)}
            value={mode}
          >
            <option value="candles">Candles</option>
            <option value="footprint">Footprint</option>
            <option value="step-profile">Step Profile</option>
          </select>
          <select aria-label="Tick size">
            <option>0.01 USD</option>
          </select>
          <button onClick={() => setSettings(true)} type="button">
            Layout 01&nbsp;&nbsp;·&nbsp;&nbsp;Settings
          </button>
        </nav>
        <div className="chart-stack">
          <MarketChart
            mode={mode}
            sourceTickSize={session.tickSize}
            timeframe={timeframe}
            view={view}
          />
          <Activity />
        </div>
        <PanelResizer
          className="dom-resizer"
          label="Resize DOM"
          onResize={(delta) =>
            setColumns((current) => ({ ...current, dom: clamp(current.dom - delta, 218, 340) }))
          }
        />
        <Dom
          currentPrice={view.current.close}
          onPrice={(next) => setPrice(Number(next).toFixed(2))}
          orderbook={view.orderbook}
          sourceTickSize={session.tickSize}
        />
        <PanelResizer
          className="execution-resizer"
          label="Resize execution panel"
          onResize={(delta) =>
            setColumns((current) => ({
              ...current,
              dom: clamp(current.dom + delta, 218, 340),
              execution: clamp(current.execution - delta, 250, 380)
            }))
          }
        />
        <Execution price={price} setPrice={setPrice} trades={view.trades} />
      </div>
      <div className="playback-dock">
        <button onClick={() => setPlaying(!playing)} type="button">
          {playing ? 'PAUSE' : 'PLAY'}
        </button>
        <input
          aria-label="Historical time"
          min={session.playbackStart}
          max={session.sessionEndExclusive - 1}
          onChange={(event) => seek(event.target.value)}
          step="1000"
          type="range"
          value={timestamp}
        />
        <output>
          {session.date} · {clock(timestamp)} UTC
        </output>
        <span className={playing ? 'replay-status active' : 'replay-status'}>
          {isBuffering ? 'BUFFERING' : playing ? '● REPLAYING' : 'Ⅱ PAUSED'}
        </span>
      </div>
      {settings && (
        <div className="modal-backdrop" onMouseDown={() => setSettings(false)} role="presentation">
          <section
            aria-label="Workspace settings"
            aria-modal="true"
            className="settings-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header>
              <strong>WORKSPACE SETTINGS</strong>
              <button onClick={() => setSettings(false)} type="button">
                ×
              </button>
            </header>
            <label>
              DOM render rate
              <input disabled value="20 Hz render / exact event replay" />
            </label>
            <button onClick={() => setSettings(false)} type="button">
              DONE
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

ProfessionalTerminal.propTypes = {
  mode: PropTypes.oneOf(['candles', 'footprint', 'step-profile']).isRequired,
  onMode: PropTypes.func.isRequired,
  playback: PropTypes.object.isRequired
}
