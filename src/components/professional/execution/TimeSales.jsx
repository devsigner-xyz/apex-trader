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

const tradeType = PropTypes.shape({
  amount: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired,
  side: PropTypes.string.isRequired,
  timestamp: PropTypes.number.isRequired
})

function TradeRow({ interactive = true, trade }) {
  const content = (
    <>
      <span>{clock(trade.timestamp, true)}</span>
      <span>{fmt(trade.price)}</span>
      <span>{fmt(trade.amount, 4)}</span>
    </>
  )
  const label = `${trade.side} trade at ${fmt(trade.price)} for ${fmt(trade.amount, 4)}`

  if (!interactive) {
    return (
      <div aria-label={label} className={`tape-row ${trade.side}`} role="listitem">
        {content}
      </div>
    )
  }

  return (
    <button aria-label={label} className={`tape-row ${trade.side}`} type="button">
      {content}
    </button>
  )
}

export function CompactTimeSales({ trades }) {
  const [filter, setFilter] = useState('all')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const tapeRef = useRef(null)
  const settingsPopoverRef = useRef(null)
  const settingsTriggerRef = useRef(null)
  const selectedFilter = tradeFilters.find(({ id }) => id === filter)
  const visibleTrades = useMemo(
    () => trades.filter((trade) => filter === 'all' || trade.side === filter).slice(0, 6),
    [filter, trades]
  )
  const { handleTriggerClick } = useSettingsPopoverFocus({
    containerRef: tapeRef,
    isOpen: settingsOpen,
    popoverRef: settingsPopoverRef,
    setIsOpen: setSettingsOpen,
    triggerRef: settingsTriggerRef
  })

  return (
    <section
      aria-label="Compact Last Trades"
      className="tape tape--compact"
      data-trade-count={visibleTrades.length}
      data-trade-filter={filter}
      ref={tapeRef}
    >
      <header>
        <span>BTC · {selectedFilter.summary}</span>
        <button
          aria-controls="compact-tape-settings-panel"
          aria-expanded={settingsOpen}
          aria-label="Compact Time and Sales settings"
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
          aria-label="Compact Time and Sales settings"
          className="tape-settings-popover"
          id="compact-tape-settings-panel"
          ref={settingsPopoverRef}
          role="dialog"
        >
          <strong>SHOW TRADES</strong>
          <div className="tape-filter-options">
            {tradeFilters.map(({ id, label }) => (
              <label key={id}>
                <input
                  checked={filter === id}
                  name="compact-time-sales-filter"
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
      <div className="tape-compact-list" role="list">
        {visibleTrades.map((trade, index) => (
          <TradeRow interactive={false} key={`${trade.timestamp}-${index}`} trade={trade} />
        ))}
      </div>
    </section>
  )
}

export default function TimeSales({ initialFilter = 'all', initialSettingsOpen = false, trades }) {
  const [filter, setFilter] = useState(initialFilter)
  const [settingsOpen, setSettingsOpen] = useState(initialSettingsOpen)
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
        <TradeRow key={`${trade.timestamp}-${index}`} trade={trade} />
      ))}
    </section>
  )
}

TimeSales.propTypes = {
  initialFilter: PropTypes.oneOf(tradeFilters.map(({ id }) => id)),
  initialSettingsOpen: PropTypes.bool,
  trades: PropTypes.arrayOf(tradeType).isRequired
}

CompactTimeSales.propTypes = {
  trades: PropTypes.arrayOf(tradeType).isRequired
}

TradeRow.propTypes = {
  interactive: PropTypes.bool,
  trade: tradeType.isRequired
}
