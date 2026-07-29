import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { getFormattedCurrency } from '../helpers/helpers.js'
import {
  deriveTimeAndSalesRows,
  isExecutionSelectionMatch
} from '../services/orderFlowAnalytics.js'

function numberFilter(value) {
  return value === '' ? undefined : Number(value)
}

export default function Trades({
  barDurationMs,
  baseCurrency,
  onSelectExecution,
  selectedExecution,
  tickSize,
  trades
}) {
  const [filters, setFilters] = useState({
    grouping: 'none',
    maximumPrice: '',
    minimumPrice: '',
    minimumSize: '',
    side: 'all'
  })
  const [selectedRowId, setSelectedRowId] = useState(null)
  const rows = useMemo(
    () =>
      deriveTimeAndSalesRows(trades, {
        ...filters,
        maximumPrice: numberFilter(filters.maximumPrice),
        minimumPrice: numberFilter(filters.minimumPrice),
        minimumSize: numberFilter(filters.minimumSize)
      }),
    [filters, trades]
  )
  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }))
  const selectRow = (trade) => {
    setSelectedRowId(trade.id)
    onSelectExecution(trade.executions.at(-1))
  }

  return (
    <section aria-label="Time and Sales" className="trades-panel" data-testid="time-and-sales">
      <header className="trades-panel__header">
        <strong>Time &amp; Sales</strong>
        <small>Ejecutado · Tardis</small>
      </header>
      <form aria-label="Filtros de Time and Sales" className="time-sales-controls">
        <label>
          Tamaño mín.
          <input
            aria-label="Tamaño mínimo de Time and Sales"
            min="0"
            onChange={(event) => updateFilter('minimumSize', event.target.value)}
            step="0.001"
            type="number"
            value={filters.minimumSize}
          />
        </label>
        <label>
          Lado
          <select
            aria-label="Lado de Time and Sales"
            onChange={(event) => updateFilter('side', event.target.value)}
            value={filters.side}
          >
            <option value="all">Todos</option>
            <option value="buy">Compra</option>
            <option value="sell">Venta</option>
          </select>
        </label>
        <label>
          Precio mín.
          <input
            aria-label="Precio mínimo de Time and Sales"
            min="0"
            onChange={(event) => updateFilter('minimumPrice', event.target.value)}
            type="number"
            value={filters.minimumPrice}
          />
        </label>
        <label>
          Precio máx.
          <input
            aria-label="Precio máximo de Time and Sales"
            min="0"
            onChange={(event) => updateFilter('maximumPrice', event.target.value)}
            type="number"
            value={filters.maximumPrice}
          />
        </label>
        <label>
          Agrupar
          <select
            aria-label="Agrupación de Time and Sales"
            onChange={(event) => updateFilter('grouping', event.target.value)}
            value={filters.grouping}
          >
            <option value="none">Sin agrupar</option>
            <option value="price">Precio y lado</option>
            <option value="second">Segundo, precio y lado</option>
          </select>
        </label>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Lado</th>
            <th scope="col">Tamaño</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((trade) => (
            <tr
              aria-pressed={
                selectedRowId === trade.id ||
                trade.executions.some((execution) =>
                  isExecutionSelectionMatch(execution, selectedExecution, barDurationMs, tickSize)
                )
              }
              className={`time-sales-row time-sales-row--${trade.side}`}
              data-testid="time-sales-row"
              key={trade.id}
              onClick={() => selectRow(trade)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  selectRow(trade)
                }
              }}
              role="button"
              tabIndex="0"
            >
              <td>{new Date(trade.timestamp).toISOString().slice(11, 19)}</td>
              <td>{trade.side === 'buy' ? 'Compra' : 'Venta'}</td>
              <td>
                {trade.amount.toFixed(3)}
                {trade.count > 1 ? ` (${trade.count})` : ''}
              </td>
              <td>{getFormattedCurrency(baseCurrency, trade.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

Trades.propTypes = {
  barDurationMs: PropTypes.number.isRequired,
  baseCurrency: PropTypes.string.isRequired,
  onSelectExecution: PropTypes.func.isRequired,
  selectedExecution: PropTypes.shape({
    barTimestamp: PropTypes.number,
    footprintPrice: PropTypes.number,
    price: PropTypes.number,
    side: PropTypes.string
  }),
  tickSize: PropTypes.number.isRequired,
  trades: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.number.isRequired,
      price: PropTypes.number.isRequired,
      side: PropTypes.oneOf(['buy', 'sell']).isRequired,
      timestamp: PropTypes.number.isRequired,
      time: PropTypes.string.isRequired
    })
  ).isRequired
}
