import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'

const orderTypes = [
  { value: 'limit', label: 'Limit' },
  { value: 'market', label: 'Market' },
  { value: 'stop', label: 'Stop' },
  { value: 'stopLimit', label: 'Stop Limit' },
  { value: 'takeProfit', label: 'Take Profit' },
  { value: 'takeProfitLimit', label: 'Take Profit Limit' },
  { value: 'trailingStop', label: 'Trailing Stop' },
  { value: 'oco', label: 'OCO' },
  { value: 'bracket', label: 'Bracket' },
  { value: 'iceberg', label: 'Iceberg' }
]

const initialValues = {
  displayQuantity: '',
  price: '',
  quantity: '',
  stopLossPrice: '',
  takeProfitPrice: '',
  timeInForce: 'GTC',
  trailingDistance: '',
  triggerPrice: ''
}

const PRACTICE_BALANCE = {
  asset: 0.8421,
  quote: 12_500
}

function formatBalance(value, maximumFractionDigits = 2) {
  return value.toLocaleString('en-US', { maximumFractionDigits })
}

function NumericField({ error, help, id, inputRef, label, onChange, required, value }) {
  const helpId = `${id}-help`
  const errorId = `${id}-error`

  return (
    <div className="form-element">
      <label data-required={required || undefined} htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={[help ? helpId : null, error ? errorId : null].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        aria-required={required}
        id={id}
        inputMode="decimal"
        min="0"
        name={id}
        onChange={onChange}
        ref={inputRef}
        step="any"
        type="number"
        value={value}
      />
      {help && (
        <small className="field-help" id={helpId}>
          {help}
        </small>
      )}
      {error && (
        <small className="field-error" id={errorId}>
          {error}
        </small>
      )}
    </div>
  )
}

NumericField.propTypes = {
  error: PropTypes.string,
  help: PropTypes.string,
  id: PropTypes.string.isRequired,
  inputRef: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.string.isRequired
}

function getFields(orderType, asset, counterpart) {
  const quantity = { key: 'quantity', label: `Quantity (${asset})` }
  const price = { key: 'price', label: `Price (${counterpart})` }
  const trigger = {
    key: 'triggerPrice',
    label: `Trigger price (${counterpart})`,
    help: 'Reference price for the trigger condition.'
  }

  switch (orderType) {
    case 'market':
      return [quantity]
    case 'stop':
    case 'takeProfit':
      return [trigger, quantity]
    case 'stopLimit':
    case 'takeProfitLimit':
      return [trigger, price, quantity]
    case 'trailingStop':
      return [
        {
          key: 'trailingDistance',
          label: `Trailing distance (${counterpart})`,
          help: 'Distance that follows the best reference price.'
        },
        quantity
      ]
    case 'oco':
      return [
        { key: 'price', label: `Limit price (${counterpart})` },
        { ...trigger, label: `Stop trigger (${counterpart})` },
        quantity
      ]
    case 'bracket':
      return [
        { key: 'price', label: `Entry price (${counterpart})` },
        { key: 'takeProfitPrice', label: `Take profit price (${counterpart})` },
        { key: 'stopLossPrice', label: `Stop loss price (${counterpart})` },
        quantity
      ]
    case 'iceberg':
      return [
        price,
        quantity,
        {
          key: 'displayQuantity',
          label: `Visible quantity (${asset})`,
          help: 'Must be less than or equal to the total quantity.'
        }
      ]
    default:
      return [price, quantity]
  }
}

function validate(values, fields) {
  const errors = {}

  fields.forEach(({ key, label }) => {
    if (!values[key] || Number(values[key]) <= 0) {
      errors[key] = `${label} must be greater than zero.`
    }
  })

  if (
    values.displayQuantity &&
    values.quantity &&
    Number(values.displayQuantity) > Number(values.quantity)
  ) {
    errors.displayQuantity = 'Visible quantity cannot exceed the total quantity.'
  }

  return errors
}

export default function Operative({
  asset,
  counterpart,
  marketPrice,
  onSelectTab,
  selectedPrice,
  selectedTab
}) {
  const [orderType, setOrderType] = useState('limit')
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const inputRefs = useRef({})
  const fields = getFields(orderType, asset, counterpart)
  const supportsTimeInForce = ['limit', 'stopLimit', 'takeProfitLimit', 'oco', 'iceberg'].includes(
    orderType
  )
  const sizingPrice = Number(values.price) > 0 ? Number(values.price) : marketPrice
  const maximumQuantity = selectedTab === 'buy' ? PRACTICE_BALANCE.quote / sizingPrice : PRACTICE_BALANCE.asset
  const allocationMaximum = Number(maximumQuantity.toFixed(4))
  const quantityValue = Math.min(Number(values.quantity) || 0, allocationMaximum)
  const quantityPercent = allocationMaximum ? Math.round((quantityValue / allocationMaximum) * 100) : 0

  useEffect(() => {
    if (selectedPrice === null || selectedPrice === undefined) return
    setValues((current) => ({ ...current, price: String(selectedPrice) }))
  }, [selectedPrice])

  useEffect(() => {
    const firstInvalidField = Object.keys(errors)[0]
    if (firstInvalidField) inputRefs.current[firstInvalidField]?.focus()
  }, [errors])

  const updateValue = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
    setErrors((current) => {
      const nextErrors = { ...current }
      delete nextErrors[key]
      return nextErrors
    })
    setStatus('')
  }

  const changeOrderType = (event) => {
    setOrderType(event.target.value)
    setErrors({})
    setStatus('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values, fields)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      setStatus('Review the highlighted fields.')
      return
    }

    setStatus('Configuration is complete.')
  }

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
      <form className="operative-form" noValidate onSubmit={handleSubmit}>
        <section aria-label="Practice balance" className="operative-balance">
          <span>Practice balance</span>
          <dl>
            <div>
              <dt>{asset}</dt>
              <dd>{formatBalance(PRACTICE_BALANCE.asset, 4)}</dd>
            </div>
            <div>
              <dt>{counterpart}</dt>
              <dd>{formatBalance(PRACTICE_BALANCE.quote)}</dd>
            </div>
          </dl>
        </section>
        <div className="form-element">
          <label htmlFor="orderType">Order type</label>
          <select id="orderType" name="orderType" onChange={changeOrderType} value={orderType}>
            {orderTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {fields.map((field) => (
          <NumericField
            error={errors[field.key]}
            help={field.help}
            id={field.key}
            inputRef={(element) => {
              inputRefs.current[field.key] = element
            }}
            key={`${orderType}-${field.key}`}
            label={field.label}
            onChange={updateValue(field.key)}
            required
            value={values[field.key]}
          />
        ))}
        {fields.some(({ key }) => key === 'quantity') && (
          <div className="quantity-allocation">
            <div>
              <label htmlFor="quantityAllocation">Quantity allocation</label>
              <output>{quantityPercent}%</output>
            </div>
            <input
              aria-label="Quantity allocation"
              id="quantityAllocation"
              max={allocationMaximum}
              min="0"
              onChange={(event) => {
                updateValue('quantity')({ target: { value: Number(event.target.value).toFixed(4) } })
              }}
              step={allocationMaximum / 100}
              type="range"
              value={quantityValue}
            />
            <small>Max. {formatBalance(allocationMaximum, 4)} {asset}</small>
          </div>
        )}
        {supportsTimeInForce && (
          <fieldset className="advanced-options">
            <legend>Additional options</legend>
            <div className="form-element">
              <label htmlFor="timeInForce">Time in force</label>
              <select
                id="timeInForce"
                name="timeInForce"
                onChange={updateValue('timeInForce')}
                value={values.timeInForce}
              >
                <option value="GTC">Good Til Cancelled</option>
                <option value="IOC">Immediate or Cancel</option>
                <option value="FOK">Fill or Kill</option>
              </select>
            </div>
            {['limit', 'stopLimit', 'takeProfitLimit', 'iceberg'].includes(orderType) && (
              <label className="checkbox-field" htmlFor="postOnly">
                <input id="postOnly" name="postOnly" type="checkbox" /> Post only (display only)
              </label>
            )}
          </fieldset>
        )}
        {status && (
          <p
            className={Object.keys(errors).length ? 'form-status is-error' : 'form-status'}
            role={Object.keys(errors).length ? 'alert' : 'status'}
          >
            {status}
          </p>
        )}
        <button className={`button order-submit order-submit--${selectedTab} w-100`} type="submit">
          Review configuration
        </button>
      </form>
    </section>
  )
}

Operative.propTypes = {
  asset: PropTypes.string.isRequired,
  counterpart: PropTypes.string.isRequired,
  marketPrice: PropTypes.number.isRequired,
  onSelectTab: PropTypes.func.isRequired,
  selectedPrice: PropTypes.number,
  selectedTab: PropTypes.oneOf(['buy', 'sell']).isRequired
}
