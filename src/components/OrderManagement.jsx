const openOrders = [
  { filled: '0%', id: 'LMT-1038', price: 7_265.5, quantity: 0.18, side: 'Buy', type: 'Limit' },
  { filled: '35%', id: 'STP-8421', price: 7_184, quantity: 0.12, side: 'Sell', type: 'Stop' }
]

const orderHistory = [
  { id: 'LMT-1021', price: 7_318.25, quantity: 0.08, side: 'Buy', status: 'Filled', time: '03:51:10' },
  { id: 'LMT-1014', price: 7_356.5, quantity: 0.15, side: 'Sell', status: 'Cxl', time: '03:28:44' }
]

function formatNumber(value) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function OrderManagement() {
  return (
    <section aria-label="Order management" className="order-management" data-testid="order-management">
      <section aria-label="Open orders" className="order-management__panel">
        <header className="order-management__header">
          <span>Open orders</span>
          <span>{openOrders.length}</span>
        </header>
        <div className="order-management__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Side</th>
                <th>Type</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Filled</th>
              </tr>
            </thead>
            <tbody>
              {openOrders.map((order) => (
                <tr key={order.id}>
                  <td className={order.side === 'Buy' ? 'buy' : 'sell'}>{order.side}</td>
                  <td>{order.type}</td>
                  <td>{formatNumber(order.price)}</td>
                  <td>{formatNumber(order.quantity)}</td>
                  <td>{order.filled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section aria-label="Order history" className="order-management__panel">
        <header className="order-management__header">
          <span>Order history</span>
          <span>{orderHistory.length}</span>
        </header>
        <div className="order-management__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Side</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((order) => (
                <tr key={order.id}>
                  <td>{order.time}</td>
                  <td className={order.side === 'Buy' ? 'buy' : 'sell'}>{order.side}</td>
                  <td>{formatNumber(order.price)}</td>
                  <td>{formatNumber(order.quantity)}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
