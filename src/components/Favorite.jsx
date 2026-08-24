import PropTypes from 'prop-types'
import { Star } from 'lucide-react'

export default function Favorite({ favorite, onToggle, ticker }) {
  return (
    <button
      aria-label={`${favorite ? 'Remove' : 'Add'} ${ticker} ${favorite ? 'from' : 'to'} favorites`}
      aria-pressed={favorite}
      className={`favorite-button${favorite ? ' is-favorite' : ''}`}
      onClick={onToggle}
      type="button"
    >
      <Star
        aria-hidden="true"
        fill={favorite ? 'currentColor' : 'none'}
        size={16}
        strokeWidth={2}
      />
    </button>
  )
}

Favorite.propTypes = {
  favorite: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  ticker: PropTypes.string.isRequired
}
