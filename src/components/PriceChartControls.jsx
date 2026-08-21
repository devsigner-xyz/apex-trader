import PropTypes from 'prop-types'

const options = [
  { label: 'Velas', value: 'candlestick' },
  { label: 'Línea', value: 'line' },
  { label: 'Heikin Ashi', value: 'heikinAshi' }
]

export default function PriceChartControls({ chartType, onChartTypeChange, onSmaChange, showSma }) {
  return (
    <div className="price-chart-controls">
      <label>
        <span>Tipo</span>
        <select
          aria-label="Chart type"
          onChange={(event) => onChartTypeChange(event.target.value)}
          value={chartType}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="price-chart-controls__indicator">
        <input
          aria-label="Show SMA 20"
          checked={showSma}
          onChange={(event) => onSmaChange(event.target.checked)}
          type="checkbox"
        />
        <span>SMA 20</span>
      </label>
    </div>
  )
}

PriceChartControls.propTypes = {
  chartType: PropTypes.oneOf(['candlestick', 'line', 'heikinAshi']).isRequired,
  onChartTypeChange: PropTypes.func.isRequired,
  onSmaChange: PropTypes.func.isRequired,
  showSma: PropTypes.bool.isRequired
}
