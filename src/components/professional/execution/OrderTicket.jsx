import { useState } from 'react'
import PropTypes from 'prop-types'
import { executionOrderTypes } from '../config.js'
import { formatNumber as fmt } from '../formatters.js'

export default function OrderTicket({ price, setPrice }) {
  const [side, setSide] = useState('buy')
  const [quantity, setQuantity] = useState('0.10')
  const [orderType, setOrderType] = useState('limit')
  const [timeInForce, setTimeInForce] = useState('GTC')
  const [stopPrice, setStopPrice] = useState(() =>
    Number(price) > 0 ? (Number(price) - 25).toFixed(2) : ''
  )
  const [stopLimitPrice, setStopLimitPrice] = useState(() =>
    Number(price) > 0 ? (Number(price) - 30).toFixed(2) : ''
  )
  const [takeProfitPrice, setTakeProfitPrice] = useState(() =>
    Number(price) > 0 ? (Number(price) + 35).toFixed(2) : ''
  )
  const [status, setStatus] = useState('')
  const orderConfig = executionOrderTypes[orderType]
  const fieldValues = { limitPrice: price, stopPrice, stopLimitPrice, takeProfitPrice }
  const valid =
    Number(quantity) > 0 &&
    orderConfig.priceFields.every((fieldName) => Number(fieldValues[fieldName]) > 0)

  const changeOrderType = (event) => {
    const nextOrderType = event.target.value
    setOrderType(nextOrderType)
    setTimeInForce(executionOrderTypes[nextOrderType].timeInForce[0])
    setStatus('')
  }

  const stageOrder = () => {
    const detailByType = {
      limit: ` @ ${fmt(price)}`,
      market: '',
      'stop-market': ` · trigger ${fmt(stopPrice)}`,
      'stop-limit': ` · trigger ${fmt(stopPrice)} · limit ${fmt(price)}`,
      oco: ` · take profit ${fmt(takeProfitPrice)} · stop ${fmt(stopPrice)} · stop limit ${fmt(
        stopLimitPrice
      )}`
    }
    setStatus(
      `SIM ${side.toUpperCase()} ${orderConfig.label.toUpperCase()} staged · ${quantity} BTC${
        detailByType[orderType]
      } · ${timeInForce} · not transmitted`
    )
  }

  return (
    <section className="ticket">
      <header>
        <strong>EXECUTION</strong>
      </header>
      <div className="side-tabs">
        <button
          className={side === 'buy' ? 'active buy' : ''}
          onClick={() => setSide('buy')}
          type="button"
        >
          BUY
        </button>
        <button
          className={side === 'sell' ? 'active sell' : ''}
          onClick={() => setSide('sell')}
          type="button"
        >
          SELL
        </button>
      </div>
      <label>
        ORDER TYPE
        <select aria-label="Order type" onChange={changeOrderType} value={orderType}>
          {Object.entries(executionOrderTypes).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {orderConfig.priceFields.includes('takeProfitPrice') && (
        <label>
          TAKE PROFIT PRICE
          <div className="field">
            <input
              aria-label="Take profit price"
              inputMode="decimal"
              onChange={(event) => setTakeProfitPrice(event.target.value)}
              value={takeProfitPrice}
            />
            <span>USDT</span>
          </div>
        </label>
      )}
      {orderConfig.priceFields.includes('stopPrice') && (
        <label>
          STOP PRICE
          <div className="field">
            <input
              aria-label="Stop price"
              inputMode="decimal"
              onChange={(event) => setStopPrice(event.target.value)}
              value={stopPrice}
            />
            <span>USDT</span>
          </div>
        </label>
      )}
      {orderConfig.priceFields.includes('stopLimitPrice') && (
        <label>
          STOP LIMIT PRICE
          <div className="field">
            <input
              aria-label="Stop limit price"
              inputMode="decimal"
              onChange={(event) => setStopLimitPrice(event.target.value)}
              value={stopLimitPrice}
            />
            <span>USDT</span>
          </div>
        </label>
      )}
      {orderConfig.priceFields.includes('limitPrice') && (
        <label>
          LIMIT PRICE
          <div className="field">
            <input
              aria-label="Limit price"
              inputMode="decimal"
              onChange={(event) => setPrice(event.target.value)}
              value={price}
            />
            <span>USDT</span>
          </div>
        </label>
      )}
      <label>
        QUANTITY
        <div className="field">
          <input
            aria-label="Quantity"
            inputMode="decimal"
            onChange={(event) => setQuantity(event.target.value)}
            value={quantity}
          />
          <span>BTC</span>
        </div>
      </label>
      <label>
        TIME IN FORCE
        <select
          aria-label="Time in force"
          disabled={orderConfig.timeInForce.length === 1}
          onChange={(event) => setTimeInForce(event.target.value)}
          value={timeInForce}
        >
          {orderConfig.timeInForce.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <button className={`submit ${side}`} disabled={!valid} onClick={stageOrder} type="button">
        PLACE {side.toUpperCase()} {orderConfig.label.toUpperCase()}
      </button>
      {status && <small aria-live="polite">{status}</small>}
    </section>
  )
}

OrderTicket.propTypes = {
  price: PropTypes.string.isRequired,
  setPrice: PropTypes.func.isRequired
}
