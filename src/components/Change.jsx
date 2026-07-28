import PropTypes from 'prop-types'

export default function Change({ size = 'medium', value }) {
  const valueClass = value >= 0 ? 'is-positive' : 'is-negative'

  return <span className={`market-value market-value--${size} ${valueClass}`}>{value}%</span>
}

Change.propTypes = {
  size: PropTypes.string,
  value: PropTypes.number.isRequired
}
