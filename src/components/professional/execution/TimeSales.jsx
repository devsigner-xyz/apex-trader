import { useMemo, useRef, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import PropTypes from 'prop-types'
import { useSettingsPopoverFocus } from '../../../hooks/useSettingsPopoverFocus.js'
import { formatClock as clock, formatNumber as fmt } from '../formatters.js'

const tradeFilters = [
  { id: 'all', label: 'All trades', summary: 'Showing all' },
  { id: 'buy', label: 'Buys only', summary: 'Showing buys' },
  { id: 'sell', label: 'Sells only', summary: 'Showing sells' }
]

export default function TimeSales({ trades }) {
  const [filter, setFilter] = useState('all')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const tapeRef = useRef(null)
  const settingsPopoverRef = useRef(null)
  const settingsTriggerRef = useRef(null)
  const { handleTriggerClick } = useSettingsPopoverFocus({
    containerRef: tapeRef,
    isOpen: settingsOpen,
    popoverRef: settingsPopoverRef,
    setIsOpen: setSettingsOpen,
    triggerRef: settingsTriggerRef
  })
  const selectedFilter = tradeFilters.find(({ id }) => id === filter)
  const visibleTrades = useMemo(
    () => trades.filter((trade) => filter === 'all' || trade.side === filter).slice(0, 20),
    [filter, trades]
  )

  return (
    <section aria-label="Time and Sales" className="tape" ref={tapeRef}>
      <header>
        <span>BTC · {selectedFilter.summary}</span>
        <button
          aria-controls="tape-settings-panel"
          aria-expanded={settingsOpen}
          aria-label="Time and Sales settings"
          className="tape-settings-button"
          onClick={handleTriggerClick}
          ref={settingsTriggerRef}
          title="Time and Sales settings"
          type="button"
        >
          <SettingsIcon aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      </header>
      {settingsOpen && (
        <aside
          aria-label="Time and Sales settings"
          className="tape-settings-popover"
          id="tape-settings-panel"
          ref={settingsPopoverRef}
          role="dialog"
        >
          <strong>SHOW TRADES</strong>
          <div className="tape-filter-options">
            {tradeFilters.map(({ id, label }) => (
              <label key={id}>
                <input
                  checked={filter === id}
                  name="time-sales-filter"
                  onChange={() => setFilter(id)}
                  type="radio"
                  value={id}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </aside>
      )}
      <div className="tape-head">
        <span>TIME</span>
        <span>PRICE</span>
        <span>SIZE</span>
      </div>
      {visibleTrades.map((trade, index) => (
        <button
          aria-label={`${trade.side} trade at ${fmt(trade.price)} for ${fmt(trade.amount, 4)}`}
          className={`tape-row ${trade.side}`}
          key={`${trade.timestamp}-${index}`}
          type="button"
        >
          <span>{clock(trade.timestamp, true)}</span>
          <span>{fmt(trade.price)}</span>
          <span>{fmt(trade.amount, 4)}</span>
        </button>
      ))}
    </section>
  )
}

TimeSales.propTypes = {
  trades: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.number.isRequired,
      price: PropTypes.number.isRequired,
      side: PropTypes.string.isRequired,
      timestamp: PropTypes.number.isRequired
    })
  ).isRequired
}
