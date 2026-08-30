import { useState } from 'react'
import Dom from './Dom.jsx'

const orderbook = {
  asks: [
    { price: 7408.25, amount: 0.52 },
    { price: 7408, amount: 1.18 },
    { price: 7407.75, amount: 0.36 },
    { price: 7407.5, amount: 2.04 }
  ],
  bids: [
    { price: 7407.25, amount: 1.62 },
    { price: 7407, amount: 0.78 },
    { price: 7406.75, amount: 1.35 },
    { price: 7406.5, amount: 0.42 }
  ],
  groupsApplied: 1
}

const meta = {
  title: 'Markets/Depth of Market',
  component: Dom
}

export default meta

function InteractiveDom() {
  const [currentPrice, setCurrentPrice] = useState(7407.25)

  return (
    <div className="storybook-panel">
      <Dom
        currentPrice={currentPrice}
        onPrice={setCurrentPrice}
        orderbook={orderbook}
        sourceTickSize={0.25}
      />
    </div>
  )
}

export const Default = {
  render: () => <InteractiveDom />
}
