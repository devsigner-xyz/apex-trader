import PropTypes from 'prop-types'
import AssetIcon from './AssetIcon.jsx'
import Change from './Change.jsx'
import Price from './Price.jsx'

export default function Topbar({
  asset,
  counterpart,
  market,
  onOpenMarkets,
  onOpenSettings,
  timeframe
}) {
  return (
    <header className="trading-topbar">
      <div className="trading-topbar__left">
        <div className="topbar-logo">ApexTrader</div>
        <div className="topbar-item">
          <button
            aria-haspopup="dialog"
            className="button pair-button"
            onClick={onOpenMarkets}
            type="button"
          >
            <AssetIcon ticker={asset} />
            <span>
              {asset}-{counterpart}
            </span>
            <span aria-hidden="true" className="topbar-icon">
              ›
            </span>
          </button>
        </div>
        <div className="topbar-item">
          <span className="topbar-label">Price ({counterpart})</span>
          <Price currency={counterpart} size="big" value={market.price.value} />
        </div>
        <div className="topbar-item">
          <span className="topbar-label">Change ({timeframe}h)</span>
          <Change size="big" value={market.price.change} />
        </div>
        <div className="topbar-item">
          <span className="topbar-label">Volume ({timeframe}h)</span>
          <span className="market-value market-value--big">$ 6.874.214</span>
        </div>
      </div>
      <div className="trading-topbar__right">
        <button
          aria-haspopup="dialog"
          aria-label="Open settings"
          className="button transparent ui-icon-button"
          onClick={onOpenSettings}
          type="button"
        >
          <span aria-hidden="true">⚙</span>
        </button>
      </div>
    </header>
  )
}

Topbar.propTypes = {
  asset: PropTypes.string.isRequired,
  counterpart: PropTypes.string.isRequired,
  market: PropTypes.shape({
    price: PropTypes.shape({
      change: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired
    }).isRequired
  }).isRequired,
  onOpenMarkets: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  timeframe: PropTypes.number.isRequired
}
