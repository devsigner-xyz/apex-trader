import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import CvdPanel from './CvdPanel.jsx'
import FootprintInspector from './FootprintInspector.jsx'
import {
  createDefaultFootprintSettings,
  deriveFootprintBars,
  deriveFootprintProfile,
  formatCellValue,
  formatFootprintVolume,
  getDiagonalPair,
  normalizeFootprintSettings
} from '../services/footprintPresentation.js'

const VIEWBOX_WIDTH = 1080
const VIEWBOX_HEIGHT = 520
const PADDING = { top: 42, right: 18, bottom: 50, left: 18 }

function intensity(level, maximum) {
  return 0.12 + (level.total / Math.max(maximum, 1)) * 0.62
}

const SETTINGS_STORAGE_PREFIX = 'apextrader.footprint-settings/v1'

function getSettingsStorageKey(asset, sessionDate, sessionSymbol) {
  return `${SETTINGS_STORAGE_PREFIX}:${asset}:${sessionSymbol}:${sessionDate}`
}

function readStoredSettings(storageKey, sourceTickSize) {
  if (typeof window === 'undefined') return createDefaultFootprintSettings(sourceTickSize)

  try {
    const value = window.localStorage.getItem(storageKey)
    return normalizeFootprintSettings(value ? JSON.parse(value) : null, sourceTickSize)
  } catch {
    return createDefaultFootprintSettings(sourceTickSize)
  }
}

function formatRatio(value) {
  return value === null ? 'sin contraparte' : `${value.toFixed(2)}×`
}

export default function FootprintChart({
  asset,
  baseCurrency,
  bars,
  cvd,
  cvdBars,
  onSelectBar,
  onSelectExecution,
  profile,
  selectedExecution,
  sessionDate,
  sessionSymbol,
  tickSize: sourceTickSize
}) {
  const storageKey = getSettingsStorageKey(asset, sessionDate, sessionSymbol)
  const [settings, setSettings] = useState(() => readStoredSettings(storageKey, sourceTickSize))
  const [selectedId, setSelectedId] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)

  useEffect(() => {
    setSettings(readStoredSettings(storageKey, sourceTickSize))
  }, [sourceTickSize, storageKey])

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(settings))
    } catch {
      // Keep the controls usable when storage is unavailable.
    }
  }, [settings, storageKey])

  const displayedBars = useMemo(() => deriveFootprintBars(bars, settings), [bars, settings])
  const displayedProfile = useMemo(
    () => deriveFootprintProfile(profile, settings),
    [profile, settings]
  )

  useEffect(() => {
    if (!displayedBars.some((bar) => bar.timestamp === selectedId)) setSelectedId(null)
  }, [displayedBars, selectedId])

  useEffect(() => {
    if (selectedExecution?.barTimestamp) setSelectedId(selectedExecution.barTimestamp)
  }, [selectedExecution])

  const selectedBar =
    displayedBars.find((bar) => bar.timestamp === selectedId) ?? displayedBars.at(-1)
  const maximumLevel = Math.max(
    1,
    ...displayedBars.flatMap((bar) => bar.levels.map((level) => level.total))
  )
  const chartWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right
  const chartHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom
  const barWidth = chartWidth / displayedBars.length
  const maxPrice = Math.max(...displayedBars.map((bar) => bar.high))
  const minPrice = Math.min(...displayedBars.map((bar) => bar.low))
  const rowHeight = Math.max(
    5,
    chartHeight / Math.ceil((maxPrice - minPrice) / settings.tickSize + 1)
  )
  const yForPrice = (price) =>
    PADDING.top + ((maxPrice - price) / (maxPrice - minPrice + settings.tickSize)) * chartHeight
  const selectBar = (timestamp) => setSelectedId(timestamp)

  const updateSetting = (name, value) => {
    setSettings((current) =>
      normalizeFootprintSettings({ ...current, [name]: value }, sourceTickSize)
    )
  }
  const setFocusedCell = (bar, level) => {
    const pair = getDiagonalPair(level, bar.levels, settings)
    setSelectedCell({ bar, level, pair })
    selectBar(bar.timestamp)
  }
  const moveCellFocus = (event, bar, levelIndex) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const targetIndex =
      event.key === 'ArrowDown'
        ? Math.max(0, levelIndex - 1)
        : event.key === 'ArrowUp'
        ? Math.min(bar.levels.length - 1, levelIndex + 1)
        : event.key === 'Home'
        ? 0
        : bar.levels.length - 1
    const target = document.getElementById(
      `footprint-cell-${bar.timestamp}-${bar.levels[targetIndex].price}`
    )
    target?.focus()
  }

  return (
    <section
      aria-label="Historical BTCUSDT footprint chart"
      className="footprint-chart chart-slot"
      data-testid="footprint-chart"
    >
      <form aria-label="Controles de footprint" className="footprint-controls">
        <label>
          Modo
          <select
            aria-label="Modo de footprint"
            onChange={(event) => updateSetting('mode', event.target.value)}
            value={settings.mode}
          >
            <option value="bidAsk">Bid × Ask</option>
            <option value="delta">Delta</option>
            <option value="volume">Volumen</option>
          </select>
        </label>
        <label>
          Tick
          <input
            aria-label="Tick size"
            min={sourceTickSize}
            onChange={(event) => updateSetting('tickSize', Number(event.target.value))}
            step={sourceTickSize}
            type="number"
            value={settings.tickSize}
          />
        </label>
        <label>
          Ratio
          <input
            aria-label="Ratio de imbalance"
            min="1"
            onChange={(event) => updateSetting('imbalanceRatio', Number(event.target.value))}
            step="0.25"
            type="number"
            value={settings.imbalanceRatio}
          />
        </label>
        <label>
          Volumen mínimo
          <input
            aria-label="Volumen mínimo"
            min="0"
            onChange={(event) => updateSetting('minimumVolume', Number(event.target.value))}
            step="0.01"
            type="number"
            value={settings.minimumVolume}
          />
        </label>
        <label>
          Escala
          <select
            aria-label="Escala de intensidad"
            onChange={(event) => updateSetting('scale', event.target.value)}
            value={settings.scale}
          >
            <option value="linear">Lineal</option>
            <option value="logarithmic">Logarítmica</option>
          </select>
        </label>
        <label>
          Formato
          <select
            aria-label="Formato de volumen"
            onChange={(event) => updateSetting('format', event.target.value)}
            value={settings.format}
          >
            <option value="compact">Compacto</option>
            <option value="precise">Preciso</option>
          </select>
        </label>
        <label>
          Stack
          <select
            aria-label="Tamaño de imbalance apilado"
            onChange={(event) => updateSetting('stackedImbalanceSize', Number(event.target.value))}
            value={settings.stackedImbalanceSize}
          >
            {[2, 3, 4, 5].map((size) => (
              <option key={size} value={size}>
                {size} niveles
              </option>
            ))}
          </select>
        </label>
      </form>
      <p className="footprint-legend">
        {settings.mode === 'bidAsk' ? 'Bid × Ask' : settings.mode === 'delta' ? 'Δ' : 'Volumen'} ·
        Tick {settings.tickSize} · Ratio {settings.imbalanceRatio}× · mínimo{' '}
        {settings.minimumVolume}
      </p>
      <div
        aria-live="polite"
        className="footprint-tooltip"
        data-testid="footprint-tooltip"
        role="status"
      >
        {selectedCell ? (
          <>
            Precio {selectedCell.level.price.toLocaleString('en-US')} · Ask diagonal{' '}
            {selectedCell.pair.ask.counterpartPrice.toLocaleString('en-US')} Bid{' '}
            {formatFootprintVolume(selectedCell.pair.ask.counterpart, settings.format)} (
            {formatRatio(selectedCell.pair.ask.ratio)}) · Bid diagonal{' '}
            {selectedCell.pair.bid.counterpartPrice.toLocaleString('en-US')} Ask{' '}
            {formatFootprintVolume(selectedCell.pair.bid.counterpart, settings.format)} (
            {formatRatio(selectedCell.pair.bid.ratio)}) · umbral {settings.imbalanceRatio}× / mínimo{' '}
            {settings.minimumVolume}
          </>
        ) : (
          'Enfoca una celda para inspeccionar su pareja diagonal exacta, ratio y umbral aplicado.'
        )}
      </div>
      <svg
        aria-label="Historical footprint order flow"
        className="footprint-chart__svg"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        {displayedBars.map((bar, barIndex) => {
          const x = PADDING.left + barIndex * barWidth
          return (
            <g
              aria-label={`Footprint bar ${new Date(bar.timestamp)
                .toISOString()
                .slice(11, 16)} UTC`}
              className={selectedBar.timestamp === bar.timestamp ? 'is-selected' : ''}
              key={bar.timestamp}
              onClick={() => {
                selectBar(bar.timestamp)
                onSelectBar(bar.timestamp)
              }}
              role="group"
            >
              <rect
                className="footprint-bar-outline"
                height={Math.max(3, yForPrice(bar.low) - yForPrice(bar.high))}
                width={barWidth - 4}
                x={x + 2}
                y={yForPrice(bar.high)}
              />
              {bar.levels.map((level, levelIndex) => {
                const y = yForPrice(level.price)
                const fill =
                  level.delta >= 0 ? 'var(--color-footprint-buy)' : 'var(--color-footprint-sell)'
                const pair = getDiagonalPair(level, bar.levels, settings)
                const cellLabel = `Precio ${level.price}. ${formatCellValue(
                  level,
                  settings
                )}. Ask diagonal frente a Bid ${pair.ask.counterpartPrice}: ${formatRatio(
                  pair.ask.ratio
                )}. Bid diagonal frente a Ask ${pair.bid.counterpartPrice}: ${formatRatio(
                  pair.bid.ratio
                )}.`
                return (
                  <g
                    aria-label={cellLabel}
                    data-cell-id={`${bar.timestamp}-${level.price}`}
                    id={`footprint-cell-${bar.timestamp}-${level.price}`}
                    key={level.price}
                    className={
                      selectedExecution?.barTimestamp === bar.timestamp &&
                      (selectedExecution?.footprintPrice ?? selectedExecution?.price) ===
                        level.price
                        ? 'is-cross-selected'
                        : ''
                    }
                    onBlur={() => setSelectedCell(null)}
                    onClick={(event) => {
                      event.stopPropagation()
                      setFocusedCell(bar, level)
                      onSelectExecution({ barTimestamp: bar.timestamp, price: level.price })
                    }}
                    onFocus={() => setFocusedCell(bar, level)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelectExecution({ barTimestamp: bar.timestamp, price: level.price })
                      } else {
                        moveCellFocus(event, bar, levelIndex)
                      }
                    }}
                    onMouseEnter={() => setFocusedCell(bar, level)}
                    role="button"
                    tabIndex="0"
                  >
                    <title>{cellLabel}</title>
                    <rect
                      fill={fill}
                      fillOpacity={
                        settings.scale === 'logarithmic'
                          ? 0.12 + (Math.log1p(level.total) / Math.log1p(maximumLevel)) * 0.62
                          : intensity(level, maximumLevel)
                      }
                      height={rowHeight - 1}
                      width={barWidth - 5}
                      x={x + 2.5}
                      y={y}
                    />
                    {level.isPoc && (
                      <rect
                        className="footprint-poc"
                        height={rowHeight - 2}
                        width="2"
                        x={x + 2.5}
                        y={y + 1}
                      />
                    )}
                    {(level.askImbalance || level.bidImbalance) && (
                      <circle
                        className={`footprint-imbalance ${
                          level.isStackedAskImbalance || level.isStackedBidImbalance
                            ? 'is-stacked'
                            : ''
                        }`}
                        cx={x + barWidth - 7}
                        cy={y + rowHeight / 2}
                        r="2"
                      />
                    )}
                    <text
                      className="footprint-cell-text"
                      textAnchor="middle"
                      x={x + barWidth / 2}
                      y={y + rowHeight * 0.66}
                    >
                      {formatCellValue(level, settings)}
                    </text>
                  </g>
                )
              })}
              <text
                className="footprint-bar-total"
                textAnchor="middle"
                x={x + barWidth / 2}
                y={VIEWBOX_HEIGHT - 25}
              >
                Δ {bar.delta >= 0 ? '+' : ''}
                {bar.delta}
              </text>
            </g>
          )
        })}
      </svg>
      <CvdPanel
        bars={cvdBars}
        onSelectBar={onSelectBar}
        selectedBarTimestamp={selectedExecution?.barTimestamp ?? selectedBar.timestamp}
      />
      <FootprintInspector bar={selectedBar} cvd={cvd} profile={displayedProfile} />
      <span className="footprint-currency">{baseCurrency}</span>
    </section>
  )
}

const levelShape = PropTypes.shape({
  ask: PropTypes.number.isRequired,
  askImbalance: PropTypes.bool.isRequired,
  bid: PropTypes.number.isRequired,
  bidImbalance: PropTypes.bool.isRequired,
  delta: PropTypes.number.isRequired,
  isPoc: PropTypes.bool.isRequired,
  price: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired
})

FootprintChart.propTypes = {
  asset: PropTypes.string.isRequired,
  bars: PropTypes.arrayOf(
    PropTypes.shape({
      close: PropTypes.number.isRequired,
      delta: PropTypes.number.isRequired,
      high: PropTypes.number.isRequired,
      levels: PropTypes.arrayOf(levelShape).isRequired,
      low: PropTypes.number.isRequired,
      open: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired
    })
  ).isRequired,
  baseCurrency: PropTypes.string.isRequired,
  cvd: PropTypes.number.isRequired,
  cvdBars: PropTypes.arrayOf(
    PropTypes.shape({
      delta: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired
    })
  ).isRequired,
  onSelectBar: PropTypes.func.isRequired,
  onSelectExecution: PropTypes.func.isRequired,
  profile: PropTypes.shape({
    levels: PropTypes.arrayOf(levelShape).isRequired,
    pocPrice: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
  }).isRequired,
  selectedExecution: PropTypes.shape({
    barTimestamp: PropTypes.number,
    footprintPrice: PropTypes.number,
    price: PropTypes.number,
    side: PropTypes.string
  }),
  sessionDate: PropTypes.string.isRequired,
  sessionSymbol: PropTypes.string.isRequired,
  tickSize: PropTypes.number.isRequired
}
