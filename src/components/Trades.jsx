import PropTypes from 'prop-types'
import { getFormattedCurrency } from '../helpers/helpers.js'

export default function Trades({ baseCurrency, trades }) {
  return (
    <section aria-label="Trades" className="trades-panel">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Amount</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr key={`${trade.time}-${index}`}>
              <td>{trade.time}</td>
              <td>{trade.amount}</td>
              <td>{getFormattedCurrency(baseCurrency, trade.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

Trades.propTypes = {
  baseCurrency: PropTypes.string.isRequired,
  trades: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.number.isRequired,
      price: PropTypes.number.isRequired,
      time: PropTypes.string.isRequired
    })
  ).isRequired
}
