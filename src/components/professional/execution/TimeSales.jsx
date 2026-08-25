import PropTypes from 'prop-types'
import { formatClock as clock, formatNumber as fmt } from '../formatters.js'

export default function TimeSales({ trades }) {
  return (
    <section className="tape">
      <header>
        <strong>TIME &amp; SALES</strong>
        <span>BTC · HIST</span>
      </header>
      <div className="tape-head">
        <span>TIME</span>
        <span>PRICE</span>
        <span>SIZE</span>
      </div>
      {trades.slice(0, 20).map((trade, index) => (
        <button
          aria-label={`${trade.side} trade at ${fmt(trade.price)} for ${fmt(trade.amount, 4)}`}
          className={trade.side}
          key={`${trade.timestamp}-${index}`}
          type="button"
        >
          <span>{clock(trade.timestamp, true)}</span>
          <span>{fmt(trade.price)}</span>
          <span>{fmt(trade.amount, 4)}</span>
        </button>
      ))}
    </section>
  )
}

TimeSales.propTypes = {
  trades: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.number.isRequired,
      price: PropTypes.number.isRequired,
      side: PropTypes.string.isRequired,
      timestamp: PropTypes.number.isRequired
    })
  ).isRequired
}
