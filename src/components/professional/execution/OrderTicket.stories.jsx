import { useState } from 'react'
import PropTypes from 'prop-types'
import OrderTicket from './OrderTicket.jsx'

const meta = {
  title: 'Execution/Order ticket',
  component: OrderTicket
}

export default meta

function InteractiveTicket({ initialOrderType, initialSide }) {
  const [price, setPrice] = useState('7407.25')

  return (
    <div className="storybook-panel">
      <OrderTicket
        initialOrderType={initialOrderType}
        initialSide={initialSide}
        price={price}
        setPrice={setPrice}
      />
    </div>
  )
}

InteractiveTicket.propTypes = {
  initialOrderType: PropTypes.string.isRequired,
  initialSide: PropTypes.string.isRequired
}

export const Default = {
  render: () => <InteractiveTicket initialOrderType="limit" initialSide="buy" />
}

function orderVariant(initialSide, initialOrderType) {
  return {
    render: () => <InteractiveTicket initialOrderType={initialOrderType} initialSide={initialSide} />
  }
}

export const BuyMarket = orderVariant('buy', 'market')
export const BuyStopMarket = orderVariant('buy', 'stop-market')
export const BuyStopLimit = orderVariant('buy', 'stop-limit')
export const BuyOco = orderVariant('buy', 'oco')
export const SellLimit = orderVariant('sell', 'limit')
export const SellMarket = orderVariant('sell', 'market')
export const SellStopMarket = orderVariant('sell', 'stop-market')
export const SellStopLimit = orderVariant('sell', 'stop-limit')
export const SellOco = orderVariant('sell', 'oco')
