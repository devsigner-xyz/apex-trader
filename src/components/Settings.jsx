import PropTypes from 'prop-types'

const currencies = ['USD', 'EUR']

export default function Settings({ baseCurrency, isOpen, onClose, onCurrencyChange }) {
  if (!isOpen) {
    return null
  }

  return (
    <aside
      aria-label="Settings"
      aria-modal="true"
      className="panel settings-panel panel--right panel--open"
      role="dialog"
    >
      <div className="header">
        <span className="panel-title">Settings</span>
        <button
          aria-label="Close settings"
          className="button transparent ui-icon-button"
          onClick={onClose}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="content">
        <div className="form-element">
          <label htmlFor="baseCurrency">Base currency</label>
          <select
            id="baseCurrency"
            name="baseCurrency"
            onChange={(event) => onCurrencyChange(event.target.value)}
            value={baseCurrency}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  )
}

Settings.propTypes = {
  baseCurrency: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCurrencyChange: PropTypes.func.isRequired
}
