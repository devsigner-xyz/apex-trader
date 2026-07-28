import PropTypes from 'prop-types'

export default function ChartModeToggle({ chartMode, onChange }) {
  return (
    <div aria-label="Chart visualization" className="chart-mode-toggle" role="group">
      <button
        aria-pressed={chartMode === 'price'}
        className="ui-button chart-mode-toggle__button"
        onClick={() => onChange('price')}
        type="button"
      >
        Precio
      </button>
      <button
        aria-pressed={chartMode === 'footprint'}
        className="ui-button chart-mode-toggle__button"
        onClick={() => onChange('footprint')}
        type="button"
      >
        Footprint
      </button>
    </div>
  )
}

ChartModeToggle.propTypes = {
  chartMode: PropTypes.oneOf(['price', 'footprint']).isRequired,
  onChange: PropTypes.func.isRequired
}
