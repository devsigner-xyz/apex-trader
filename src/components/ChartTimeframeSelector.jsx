import PropTypes from 'prop-types'

export const chartTimeframes = [
  { label: '1m', minutes: 1, supported: false },
  { label: '5m', minutes: 5, supported: true },
  { label: '15m', minutes: 15, supported: true },
  { label: '30m', minutes: 30, supported: true },
  { label: '1h', minutes: 60, supported: true },
  { label: '4h', minutes: 240, supported: true },
  { label: '1D', minutes: 1440, supported: true }
]

export default function ChartTimeframeSelector({ onChange, value }) {
  return (
    <div aria-label="Chart timeframe" className="chart-timeframe-selector" role="group">
      {chartTimeframes.map(({ label, minutes, supported }) => (
        <button
          aria-label={supported ? label : `${label} unavailable: source data starts at 5m`}
          aria-pressed={value === minutes}
          className="chart-timeframe-selector__button"
          disabled={!supported}
          key={minutes}
          onClick={() => onChange(minutes)}
          title={supported ? undefined : 'La sesión histórica tiene velas base de 5m.'}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

ChartTimeframeSelector.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOf(chartTimeframes.filter(({ supported }) => supported).map(({ minutes }) => minutes))
    .isRequired
}
