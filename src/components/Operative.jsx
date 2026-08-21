import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'

const orderTypes = [
  { value: 'limit', label: 'Limit', help: 'Appears at the configured limit price.' },
  { value: 'market', label: 'Market', help: 'Uses the available price without a limit price.' },
  { value: 'stop', label: 'Stop', help: 'Activates when the reference price reaches the trigger.' },
  {
    value: 'stopLimit',
    label: 'Stop Limit',
    help: 'After triggering, it presents a limit order that may not complete.'
  },
  {
    value: 'takeProfit',
    label: 'Take Profit',
    help: 'Activates when the reference price reaches the target.'
  },
  {
    value: 'takeProfitLimit',
    label: 'Take Profit Limit',
    help: 'After triggering, it presents a limit order at the configured price.'
  },
  {
    value: 'trailingStop',
    label: 'Trailing Stop',
    help: 'The trigger follows the reference price by the configured distance.'
  },
  {
    value: 'oco',
    label: 'OCO',
    help: 'Shows linked limit and stop parameters in one configuration.'
  },
  {
    value: 'bracket',
    label: 'Bracket',
    help: 'Groups entry, target, and stop parameters in one configuration.'
  },
  {
    value: 'iceberg',
    label: 'Iceberg',
    help: 'Shows a visible quantity smaller than the configured total quantity.'
  }
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

export default function Operative({ asset, counterpart, onSelectTab, selectedPrice, selectedTab }) {
  const [orderType, setOrderType] = useState('limit')
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const inputRefs = useRef({})
  const fields = getFields(orderType, asset, counterpart)
  const selectedOrderType = orderTypes.find((type) => type.value === orderType)
  const supportsTimeInForce = ['limit', 'stopLimit', 'takeProfitLimit', 'oco', 'iceberg'].includes(
    orderType
  )

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
      <header className="panel-heading">
        <span>Order ticket</span>
        <span>{asset}/{counterpart}</span>
      </header>
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
        <div className="form-element">
          <label htmlFor="orderType">Order type</label>
          <select id="orderType" name="orderType" onChange={changeOrderType} value={orderType}>
            {orderTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <small className="field-help" id="order-type-help">
            {selectedOrderType.help}
          </small>
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
  onSelectTab: PropTypes.func.isRequired,
  selectedPrice: PropTypes.number,
  selectedTab: PropTypes.oneOf(['buy', 'sell']).isRequired
}
