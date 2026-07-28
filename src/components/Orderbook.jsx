import PropTypes from 'prop-types'
import Change from './Change.jsx'
import Price from './Price.jsx'
import { getFormattedCurrency } from '../helpers/helpers.js'

const orderRowShape = PropTypes.shape({
  amount: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired
})

function getCumulativeAmounts(rows) {
  return rows.reduce((amounts, row) => {
    const previous = amounts[amounts.length - 1] ?? 0
    amounts.push(previous + row.amount)
    return amounts
  }, [])
}

function OrderbookSide({ currency, label, onSelectPrice, rows, side }) {
  const cumulativeAmounts = getCumulativeAmounts(rows)
  const totalAmount = cumulativeAmounts[cumulativeAmounts.length - 1] ?? 1

  return (
    <div aria-label={label} className={`orderbook-side orderbook-side--${side}`}>
      {rows.map((row, index) => {
        const sum = cumulativeAmounts[index]
        const width = `${(sum / totalAmount) * 100}%`
        const testPrefix = side === 'bid' ? 'bid' : 'ask'

        return (
          <button
            className="orderbook-row"
            data-test={`${testPrefix}-row`}
            key={row.price}
            onClick={() => onSelectPrice(row.price)}
            type="button"
          >
            <span
              aria-hidden="true"
              className="orderbook-row__indicator"
              style={{ opacity: sum / totalAmount }}
            />
            <span className="orderbook-row__sum" data-test={`${testPrefix}-sum`}>
              {sum.toFixed(1)}
            </span>
            <span className="orderbook-row__amount">{row.amount}</span>
            <span className="orderbook-row__price">
              {getFormattedCurrency(currency, row.price, 1)}
            </span>
            <span aria-hidden="true" className="orderbook-row__bar" style={{ width }} />
          </button>
        )
      })}
    </div>
  )
}

OrderbookSide.propTypes = {
  currency: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onSelectPrice: PropTypes.func.isRequired,
  rows: PropTypes.arrayOf(orderRowShape).isRequired,
  side: PropTypes.oneOf(['ask', 'bid']).isRequired
}

export default function Orderbook({ asset, baseCurrency, market, onSelectPrice, orderbook }) {
  return (
    <section aria-label="Order book" className="orderbook-panel">
      <div className="orderbook-header">
        <span />
        <span>Sum ({asset})</span>
        <span>Amount ({asset})</span>
        <span>Price ({baseCurrency})</span>
      </div>
      <OrderbookSide
        currency={baseCurrency}
        label="Bids"
        onSelectPrice={onSelectPrice}
        rows={[...orderbook.bids].reverse()}
        side="bid"
      />
      <div className="orderbook-current">
        <span title="Spread">↔ 0.04%</span>
        <span className="orderbook-current__price">
          <Change size="medium" value={market.price.change} />
          <Price currency={baseCurrency} size="big" value={market.price.value} />
        </span>
      </div>
      <OrderbookSide
        currency={baseCurrency}
        label="Asks"
        onSelectPrice={onSelectPrice}
        rows={orderbook.asks}
        side="ask"
      />
    </section>
  )
}

Orderbook.propTypes = {
  asset: PropTypes.string.isRequired,
  baseCurrency: PropTypes.string.isRequired,
  market: PropTypes.shape({
    price: PropTypes.shape({
      change: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired
    }).isRequired
  }).isRequired,
  onSelectPrice: PropTypes.func.isRequired,
  orderbook: PropTypes.shape({
    asks: PropTypes.arrayOf(orderRowShape).isRequired,
    bids: PropTypes.arrayOf(orderRowShape).isRequired
  }).isRequired
}
