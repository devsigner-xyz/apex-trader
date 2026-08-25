import PropTypes from 'prop-types'
import OrderTicket from './OrderTicket.jsx'
import TimeSales from './TimeSales.jsx'

export default function Execution({ price, setPrice, trades }) {
  return (
    <aside className="execution">
      <OrderTicket price={price} setPrice={setPrice} />
      <TimeSales trades={trades} />
    </aside>
  )
}

Execution.propTypes = {
  price: PropTypes.string.isRequired,
  setPrice: PropTypes.func.isRequired,
  trades: PropTypes.arrayOf(PropTypes.object).isRequired
}
