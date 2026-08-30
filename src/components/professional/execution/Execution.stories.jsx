import { useState } from 'react'
import Execution from './Execution.jsx'

const trades = [
  { amount: 0.4821, price: 7407.25, side: 'buy', timestamp: 1_575_849_600_000 },
  { amount: 0.1532, price: 7407, side: 'sell', timestamp: 1_575_849_599_000 },
  { amount: 1.2024, price: 7406.75, side: 'buy', timestamp: 1_575_849_598_000 },
  { amount: 0.8231, price: 7406.5, side: 'sell', timestamp: 1_575_849_597_000 }
]

const meta = {
  title: 'Execution/Panel',
  component: Execution
}

export default meta

function InteractiveExecution() {
  const [price, setPrice] = useState('7407.25')
  return <Execution price={price} setPrice={setPrice} trades={trades} />
}

export const Default = { render: () => <InteractiveExecution /> }
