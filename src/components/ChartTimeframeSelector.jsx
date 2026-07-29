import PropTypes from 'prop-types'

const timeframes = [
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 }
]

export default function ChartTimeframeSelector({ onChange, value }) {
  return (
    <div aria-label="Chart timeframe" className="chart-timeframe-selector" role="group">
      {timeframes.map(({ label, minutes }) => (
        <button
          aria-pressed={value === minutes}
          className="chart-timeframe-selector__button"
          key={minutes}
          onClick={() => onChange(minutes)}
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
  value: PropTypes.oneOf(timeframes.map(({ minutes }) => minutes)).isRequired
}
