import PropTypes from 'prop-types'
import { X } from 'lucide-react'
import AssetIcon from './AssetIcon.jsx'
import Favorite from './Favorite.jsx'
import { getFormattedCurrency } from '../helpers/helpers.js'

export default function PairSelector({
  asset,
  counterpart,
  favorites,
  isOpen,
  markets,
  onClose,
  onSelectPair,
  onToggleFavorite,
  timeframe
}) {
  if (!isOpen) {
    return null
  }

  return (
    <aside
      aria-label="Markets"
      aria-modal="true"
      className="panel markets-panel panel--left panel--open"
      role="dialog"
    >
      <div className="header">
        <span className="panel-title">Markets</span>
        <button
          aria-label="Close markets"
          className="button transparent ui-icon-button"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={2} />
        </button>
      </div>
      <div className="content markets-content">
        <div className="market-row market-row--header" role="row">
          <span>Pair</span>
          <span>Volume ({timeframe}h)</span>
          <span>Price ({counterpart})</span>
          <span>Favorite</span>
        </div>
        {markets.map((pair) => {
          const isSelected = pair.ticker === asset
          const isFavorite = favorites.has(pair.ticker)

          return (
            <div
              className={`market-row${isSelected ? ' is-selected' : ''}`}
              key={pair.ticker}
              role="row"
            >
              <button
                aria-label={`Select ${pair.ticker}-${counterpart}`}
                className="market-row__select"
                onClick={() => onSelectPair(pair.ticker)}
                type="button"
              >
                <span className="asset-naming">
                  <AssetIcon ticker={pair.ticker} size="large" />
                  <span>
                    <span>{pair.ticker}</span>
                    <span>{pair.name}</span>
                  </span>
                </span>
                <span className="market-row__value">
                  <span>{getFormattedCurrency(counterpart, pair.volume.counterpart, 1)}</span>
                  <span>{getFormattedCurrency(pair.ticker, pair.volume.asset)}</span>
                </span>
                <span className="market-row__value">
                  <span>{getFormattedCurrency(counterpart, pair.price.value)}</span>
                  <span className={pair.price.change >= 0 ? 'is-positive' : 'is-negative'}>
                    {pair.price.change}%
                  </span>
                </span>
              </button>
              <Favorite
                favorite={isFavorite}
                onToggle={() => onToggleFavorite(pair.ticker)}
                ticker={pair.ticker}
              />
            </div>
          )
        })}
      </div>
    </aside>
  )
}

PairSelector.propTypes = {
  asset: PropTypes.string.isRequired,
  counterpart: PropTypes.string.isRequired,
  favorites: PropTypes.instanceOf(Set).isRequired,
  isOpen: PropTypes.bool.isRequired,
  markets: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      price: PropTypes.shape({
        change: PropTypes.number.isRequired,
        value: PropTypes.number.isRequired
      }).isRequired,
      ticker: PropTypes.string.isRequired,
      volume: PropTypes.shape({
        asset: PropTypes.number.isRequired,
        counterpart: PropTypes.number.isRequired
      }).isRequired
    })
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectPair: PropTypes.func.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  timeframe: PropTypes.number.isRequired
}
