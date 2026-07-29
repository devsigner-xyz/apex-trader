import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { deriveCvdSeries } from '../services/orderFlowAnalytics.js'

const CHART_WIDTH = 600
const CHART_HEIGHT = 96
const PADDING = 8

function pointList(series) {
  if (!series.length) return ''
  const values = series.map((entry) => entry.value)
  const minimum = Math.min(0, ...values)
  const maximum = Math.max(0, ...values)
  const span = Math.max(1, maximum - minimum)
  return series
    .map((entry, index) => {
      const x = PADDING + (index / Math.max(1, series.length - 1)) * (CHART_WIDTH - PADDING * 2)
      const y = PADDING + ((maximum - entry.value) / span) * (CHART_HEIGHT - PADDING * 2)
      return `${x},${y}`
    })
    .join(' ')
}

export default function CvdPanel({ bars, onSelectBar, selectedBarTimestamp }) {
  const [reset, setReset] = useState('session')
  const [windowBars, setWindowBars] = useState(8)
  const [manualResetTimestamp, setManualResetTimestamp] = useState(null)
  const series = useMemo(
    () => deriveCvdSeries(bars, { manualResetTimestamp, reset, windowBars }),
    [bars, manualResetTimestamp, reset, windowBars]
  )
  const selected = series.find((entry) => entry.timestamp === selectedBarTimestamp) ?? series.at(-1)
  const manualReset = () => {
    const anchor = selectedBarTimestamp ?? bars.at(-1)?.timestamp ?? null
    if (anchor !== null) setManualResetTimestamp(anchor)
    setReset('manual')
  }

  return (
    <section aria-label="CVD" className="cvd-panel" data-testid="cvd-panel">
      <div className="cvd-panel__heading">
        <strong>CVD</strong>
        <output aria-live="polite" data-testid="cvd-value">
          {selected ? `${selected.value >= 0 ? '+' : ''}${selected.value.toFixed(3)}` : '—'}
        </output>
      </div>
      <form aria-label="Controles de CVD" className="cvd-controls">
        <label>
          Reset
          <select
            aria-label="Reset de CVD"
            onChange={(event) => setReset(event.target.value)}
            value={reset}
          >
            <option value="session">Sesión</option>
            <option value="window">Ventana</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        {reset === 'window' && (
          <label>
            Barras
            <input
              aria-label="Barras de ventana CVD"
              min="1"
              onChange={(event) => setWindowBars(Math.max(1, Number(event.target.value) || 1))}
              type="number"
              value={windowBars}
            />
          </label>
        )}
        <button className="cvd-reset-button" onClick={manualReset} type="button">
          Resetear en barra seleccionada
        </button>
      </form>
      <svg
        aria-label="Serie CVD acumulada"
        className="cvd-panel__chart"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <line
          className="cvd-panel__baseline"
          x1="0"
          x2={CHART_WIDTH}
          y1={CHART_HEIGHT / 2}
          y2={CHART_HEIGHT / 2}
        />
        <polyline className="cvd-panel__line" points={pointList(series)} />
      </svg>
      <ol aria-label="Contribución delta por barra" className="cvd-contributions">
        {series.map((entry) => (
          <li key={entry.timestamp}>
            <button
              aria-pressed={entry.timestamp === selectedBarTimestamp}
              className={entry.delta >= 0 ? 'is-positive' : 'is-negative'}
              onClick={() => onSelectBar(entry.timestamp)}
              type="button"
            >
              {new Date(entry.timestamp).toISOString().slice(11, 16)} Δ{' '}
              {entry.delta >= 0 ? '+' : ''}
              {entry.delta.toFixed(3)}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

CvdPanel.propTypes = {
  bars: PropTypes.arrayOf(
    PropTypes.shape({
      delta: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired
    })
  ).isRequired,
  onSelectBar: PropTypes.func.isRequired,
  selectedBarTimestamp: PropTypes.number
}
