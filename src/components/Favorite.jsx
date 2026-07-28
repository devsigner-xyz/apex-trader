import PropTypes from 'prop-types'

export default function Favorite({ favorite, onToggle, ticker }) {
  return (
    <button
      aria-label={`${favorite ? 'Remove' : 'Add'} ${ticker} ${favorite ? 'from' : 'to'} favorites`}
      aria-pressed={favorite}
      className={`favorite-button${favorite ? ' is-favorite' : ''}`}
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true">★</span>
    </button>
  )
}

Favorite.propTypes = {
  favorite: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  ticker: PropTypes.string.isRequired
}
