import PropTypes from 'prop-types'
import Chart from './Chart.jsx'
import ChartModeToggle from './ChartModeToggle.jsx'
import DepthChart from './DepthChart.jsx'
import FootprintChart from './FootprintChart.jsx'
import Operative from './Operative.jsx'
import Orderbook from './Orderbook.jsx'
import Topbar from './Topbar.jsx'
import Trades from './Trades.jsx'

const marketShape = PropTypes.shape({
  price: PropTypes.shape({
    change: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
  }).isRequired
})
const orderbookShape = PropTypes.shape({
  asks: PropTypes.arrayOf(PropTypes.object).isRequired,
  bids: PropTypes.arrayOf(PropTypes.object).isRequired
})
const tradeShape = PropTypes.shape({
  amount: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired,
  time: PropTypes.string.isRequired
})

export default function Grid({
  appState,
  onChartModeChange,
  onOpenMarkets,
  onOpenSettings,
  onOrderSubmit,
  onSelectPrice,
  onSelectTab
}) {
  const {
    asset,
    baseCurrency,
    chartMode,
    market,
    orderbook,
    selectedPrice,
    selectedTab,
    timeframe,
    trades
  } = appState

  return (
    <div className={`trading-grid ${chartMode === 'footprint' ? 'trading-grid--footprint' : ''}`}>
      <div className="grid-topbar ui-surface">
        <Topbar
          asset={asset}
          counterpart={baseCurrency}
          market={market}
          onOpenMarkets={onOpenMarkets}
          onOpenSettings={onOpenSettings}
          timeframe={timeframe}
        />
      </div>
      <div className="grid-operative grid-item">
        <Operative
          asset={asset}
          counterpart={baseCurrency}
          onSelectTab={onSelectTab}
          onSubmit={onOrderSubmit}
          selectedPrice={selectedPrice}
          selectedTab={selectedTab}
        />
      </div>
      <div className="grid-orderbook grid-item">
        <Orderbook
          asset={asset}
          baseCurrency={baseCurrency}
          market={market}
          onSelectPrice={onSelectPrice}
          orderbook={orderbook}
        />
      </div>
      <section
        aria-label="Price chart"
        className={`grid-chart grid-item ${
          chartMode === 'footprint' ? 'grid-chart--footprint' : ''
        }`}
      >
        <ChartModeToggle chartMode={chartMode} onChange={onChartModeChange} />
        {chartMode === 'footprint' ? (
          <FootprintChart baseCurrency={baseCurrency} />
        ) : (
          <>
            <Chart asset={asset} baseCurrency={baseCurrency} />
            <DepthChart asks={orderbook.asks} bids={orderbook.bids} />
          </>
        )}
      </section>
      <div className="grid-tabs grid-item" />
      <div className="grid-trades grid-item">
        <Trades baseCurrency={baseCurrency} trades={trades} />
      </div>
      <footer className="grid-footer ui-surface">
        <span>
          ApexTrader by{' '}
          <a href="https://github.com/FrontendCrypto/apex-trader" rel="noreferrer" target="_blank">
            Pablo Carballeda
          </a>
        </span>
      </footer>
    </div>
  )
}

Grid.propTypes = {
  appState: PropTypes.shape({
    asset: PropTypes.string.isRequired,
    baseCurrency: PropTypes.string.isRequired,
    chartMode: PropTypes.oneOf(['price', 'footprint']).isRequired,
    market: marketShape.isRequired,
    orderbook: orderbookShape.isRequired,
    selectedPrice: PropTypes.number,
    selectedTab: PropTypes.oneOf(['buy', 'sell']).isRequired,
    timeframe: PropTypes.number.isRequired,
    trades: PropTypes.arrayOf(tradeShape).isRequired
  }).isRequired,
  onChartModeChange: PropTypes.func.isRequired,
  onOpenMarkets: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  onOrderSubmit: PropTypes.func.isRequired,
  onSelectPrice: PropTypes.func.isRequired,
  onSelectTab: PropTypes.func.isRequired
}
