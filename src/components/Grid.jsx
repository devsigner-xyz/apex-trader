import { useState } from 'react'
import PropTypes from 'prop-types'
import Chart from './Chart.jsx'
import ChartModeToggle from './ChartModeToggle.jsx'
import ChartTimeframeSelector from './ChartTimeframeSelector.jsx'
import DepthChart from './DepthChart.jsx'
import FootprintChart from './FootprintChart.jsx'
import Operative from './Operative.jsx'
import Orderbook from './Orderbook.jsx'
import OrderManagement from './OrderManagement.jsx'
import PlaybackControls from './PlaybackControls.jsx'
import PriceChartControls from './PriceChartControls.jsx'
import Topbar from './Topbar.jsx'
import Trades from './Trades.jsx'
import { getBarTimestampForExecution } from '../services/orderFlowAnalytics.js'

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
  onChartTimeframeChange,
  onOpenMarkets,
  onOpenSettings,
  onSelectPrice,
  onSelectTab
}) {
  const {
    asset,
    baseCurrency,
    barDurationMs,
    candlesticks,
    chartMode,
    chartTimeframe,
    cvd,
    cvdBars,
    footprintBars,
    market,
    orderbook,
    playbackTimestamp,
    profile,
    selectedPrice,
    selectedTab,
    sessionDate,
    sessionSymbol,
    timeframe,
    tickSize,
    trades,
    volumes
  } = appState
  const [selectedExecution, setSelectedExecution] = useState(null)
  const [priceChartType, setPriceChartType] = useState('candlestick')
  const [showSma, setShowSma] = useState(false)
  const selectExecution = (execution) => {
    if (!execution) return
    setSelectedExecution({
      barTimestamp: getBarTimestampForExecution(execution.timestamp, barDurationMs),
      footprintPrice: Math.round(execution.price / tickSize) * tickSize,
      price: execution.price,
      side: execution.side
    })
    onSelectPrice(execution.price)
  }
  const selectFootprintCell = ({ barTimestamp, price }) => {
    setSelectedExecution({ barTimestamp, footprintPrice: price, price })
    onSelectPrice(price)
  }
  const selectCvdBar = (barTimestamp) => setSelectedExecution({ barTimestamp })

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
          marketPrice={market.price.value}
          onSelectTab={onSelectTab}
          selectedPrice={selectedPrice}
          selectedTab={selectedTab}
        />
      </div>
      <div className="grid-orderbook grid-item">
        <Orderbook
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
        <div className="chart-toolbar">
          <ChartModeToggle chartMode={chartMode} onChange={onChartModeChange} />
          <ChartTimeframeSelector onChange={onChartTimeframeChange} value={chartTimeframe} />
          <PriceChartControls
            chartType={priceChartType}
            onChartTypeChange={setPriceChartType}
            onSmaChange={setShowSma}
            showSma={showSma}
          />
          <PlaybackControls timestamp={playbackTimestamp} />
        </div>
        {chartMode === 'footprint' ? (
          <FootprintChart
            asset={asset}
            bars={footprintBars}
            baseCurrency={baseCurrency}
            cvd={cvd}
            cvdBars={cvdBars}
            onSelectBar={selectCvdBar}
            onSelectExecution={selectFootprintCell}
            profile={profile}
            selectedExecution={selectedExecution}
            sessionDate={sessionDate}
            sessionSymbol={sessionSymbol}
            tickSize={tickSize}
          />
        ) : (
          <>
            <Chart
              candlesticks={candlesticks}
              chartType={priceChartType}
              selectedPrice={selectedExecution?.price ?? selectedPrice}
              showSma={showSma}
              timeframe={chartTimeframe}
              volumes={volumes}
            />
            <DepthChart asks={orderbook.asks} bids={orderbook.bids} />
          </>
        )}
      </section>
      <div className="grid-tabs grid-item">
        <OrderManagement />
      </div>
      <div className="grid-trades grid-item">
        <Trades
          barDurationMs={barDurationMs}
          baseCurrency={baseCurrency}
          onSelectExecution={selectExecution}
          selectedExecution={selectedExecution}
          tickSize={tickSize}
          trades={trades}
        />
      </div>
    </div>
  )
}

Grid.propTypes = {
  appState: PropTypes.shape({
    asset: PropTypes.string.isRequired,
    baseCurrency: PropTypes.string.isRequired,
    barDurationMs: PropTypes.number.isRequired,
    candlesticks: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
    chartMode: PropTypes.oneOf(['price', 'footprint']).isRequired,
    chartTimeframe: PropTypes.oneOf([5, 15, 30, 60]).isRequired,
    cvd: PropTypes.number.isRequired,
    cvdBars: PropTypes.arrayOf(
      PropTypes.shape({
        delta: PropTypes.number.isRequired,
        timestamp: PropTypes.number.isRequired
      })
    ).isRequired,
    footprintBars: PropTypes.arrayOf(PropTypes.object).isRequired,
    market: marketShape.isRequired,
    orderbook: orderbookShape.isRequired,
    playbackTimestamp: PropTypes.number.isRequired,
    profile: PropTypes.object.isRequired,
    selectedPrice: PropTypes.number,
    selectedTab: PropTypes.oneOf(['buy', 'sell']).isRequired,
    sessionDate: PropTypes.string.isRequired,
    sessionSymbol: PropTypes.string.isRequired,
    timeframe: PropTypes.number.isRequired,
    tickSize: PropTypes.number.isRequired,
    trades: PropTypes.arrayOf(tradeShape).isRequired,
    volumes: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired
  }).isRequired,
  onChartModeChange: PropTypes.func.isRequired,
  onChartTimeframeChange: PropTypes.func.isRequired,
  onOpenMarkets: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  onSelectPrice: PropTypes.func.isRequired,
  onSelectTab: PropTypes.func.isRequired
}
