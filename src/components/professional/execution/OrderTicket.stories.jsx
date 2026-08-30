import { useState } from 'react'
import OrderTicket from './OrderTicket.jsx'

const meta = {
  title: 'Execution/Order ticket',
  component: OrderTicket
}

export default meta

function InteractiveTicket() {
  const [price, setPrice] = useState('7407.25')

  return (
    <div className="storybook-panel">
      <OrderTicket price={price} setPrice={setPrice} />
    </div>
  )
}

export const Default = {
  render: () => <InteractiveTicket />
}
