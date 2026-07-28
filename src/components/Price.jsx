import PropTypes from 'prop-types'
import { getFormattedCurrency } from '../helpers/helpers.js'

export default function Price({ currency, size = 'medium', value }) {
  const valueClass = value >= 0 ? 'is-positive' : 'is-negative'

  return (
    <span className={`market-value market-value--${size} ${valueClass}`}>
      {getFormattedCurrency(currency, value)}
    </span>
  )
}

Price.propTypes = {
  currency: PropTypes.string.isRequired,
  size: PropTypes.string,
  value: PropTypes.number.isRequired
}
