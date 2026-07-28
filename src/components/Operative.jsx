import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'

const orderTypes = [
  { value: 'limit', label: 'Limit' },
  { value: 'market', label: 'Market' },
  { value: 'stopLimit', label: 'Stop Limit' },
  { value: 'oco', label: 'OCO' }
]

function PriceField({ animatePrice, counterpart, selectedPrice }) {
  return (
    <div className="form-element">
      <label htmlFor="price">Price ({counterpart})</label>
      <input
        className={animatePrice ? 'animate-background' : undefined}
        id="price"
        name="price"
        readOnly
        type="number"
        value={selectedPrice ?? ''}
      />
    </div>
  )
}

PriceField.propTypes = {
  animatePrice: PropTypes.bool.isRequired,
  counterpart: PropTypes.string.isRequired,
  selectedPrice: PropTypes.number
}

export default function Operative({
  asset,
  counterpart,
  onSubmit,
  selectedPrice,
  selectedTab,
  onSelectTab
}) {
  const [orderType, setOrderType] = useState('limit')
  const [animatePrice, setAnimatePrice] = useState(false)

  useEffect(() => {
    if (selectedPrice === null) return undefined
    setAnimatePrice(true)
    const timeout = window.setTimeout(() => setAnimatePrice(false), 500)
    return () => window.clearTimeout(timeout)
  }, [selectedPrice])

  const showsPrice = orderType === 'limit' || orderType === 'stopLimit' || orderType === 'oco'
  const needsQuantity = orderType !== 'oco'

  return (
    <section aria-label="Order form" className="operative-panel">
      <div aria-label="Order side" className="ui-tabs" role="tablist">
        {['buy', 'sell'].map((tab) => (
          <button
            aria-selected={selectedTab === tab}
            className={`ui-tab ${tab}${selectedTab === tab ? ' is-active' : ''}`}
            key={tab}
            onClick={() => onSelectTab(tab)}
            role="tab"
            type="button"
          >
            {tab === 'buy' ? 'Buy' : 'Sell'}
          </button>
        ))}
      </div>
      <form
        className="operative-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="form-element">
          <label htmlFor="orderType">Order type</label>
          <select
            id="orderType"
            name="orderType"
            onChange={(event) => setOrderType(event.target.value)}
            value={orderType}
          >
            {orderTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {orderType === 'stopLimit' && (
          <div className="form-element">
            <label htmlFor="triggerPrice">Trigger Price ({counterpart})</label>
            <input id="triggerPrice" name="triggerPrice" type="number" />
          </div>
        )}
        {showsPrice && (
          <PriceField
            animatePrice={animatePrice}
            counterpart={counterpart}
            selectedPrice={selectedPrice}
          />
        )}
        {orderType === 'oco' && (
          <>
            <div className="form-element">
              <label htmlFor="stop">Stop ({counterpart})</label>
              <input id="stop" name="stop" type="number" />
            </div>
            <div className="form-element">
              <label htmlFor="limit">Limit ({counterpart})</label>
              <input id="limit" name="limit" type="number" />
            </div>
          </>
        )}
        {needsQuantity && (
          <div className="form-element">
            <label htmlFor="quantity">Quantity ({asset})</label>
            <input id="quantity" name="quantity" type="number" />
          </div>
        )}
        {orderType !== 'oco' && (
          <div className="form-element">
            <label htmlFor="total">
              Total {orderType === 'market' ? 'Price' : '(incl. fee)'} ({counterpart})
            </label>
            <input id="total" name="total" type="number" />
          </div>
        )}
        {orderType === 'oco' && (
          <div className="form-element">
            <label htmlFor="ocoQuantity">Quantity ({asset})</label>
            <input id="ocoQuantity" name="ocoQuantity" type="number" />
          </div>
        )}
        <button className={`button order-submit order-submit--${selectedTab} w-100`} type="submit">
          {selectedTab === 'buy' ? 'Buy' : 'Sell'}
        </button>
        <fieldset className="advanced-options">
          <legend>Advanced options</legend>
          <div className="form-element">
            <label htmlFor="timeInForce">Time in force</label>
            <select defaultValue="Good Til Cancelled" id="timeInForce" name="timeInForce">
              <option>Good Til Cancelled</option>
              <option>Immediate or Cancel</option>
              <option>Fill or Kill</option>
            </select>
          </div>
          <label className="checkbox-field" htmlFor="postOnly">
            <input id="postOnly" name="postOnly" type="checkbox" /> Post Only?
          </label>
        </fieldset>
      </form>
    </section>
  )
}

Operative.propTypes = {
  asset: PropTypes.string.isRequired,
  counterpart: PropTypes.string.isRequired,
  onSelectTab: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  selectedPrice: PropTypes.number,
  selectedTab: PropTypes.oneOf(['buy', 'sell']).isRequired
}
