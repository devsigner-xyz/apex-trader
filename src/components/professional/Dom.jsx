import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import PropTypes from 'prop-types'
import { useSettingsPopoverFocus } from '../../hooks/useSettingsPopoverFocus.js'
import {
  aggregateDomOrderbook,
  domPriceGroupings,
  formatDomGrouping
} from '../../services/domPresentation.js'
import { formatNumber as fmt } from './formatters.js'
import { trackEvent } from '../../services/analytics.js'

function DomLevelRow({ index, interactive = true, maximum, onPrice, row, side }) {
  const content = (
    <>
      <span>{fmt(row.price)}</span>
      <span>
        {index % 3 === 0 ? `${side === 'bid' ? '+' : '-'}${Math.round(row.amount * 10)}` : ''}
      </span>
      <span style={{ backgroundSize: `${Math.max(8, (row.amount / maximum) * 100)}% 90%` }}>
        {fmt(row.amount, 3)}
      </span>
      <span>{index % 5 === 0 ? Math.round(row.amount * 3) : ''}</span>
    </>
  )

  if (!interactive) {
    return (
      <div className={`dom-row ${side}`} data-price={row.price} role="listitem">
        {content}
      </div>
    )
  }

  return (
    <button
      className={`dom-row ${side}`}
      data-price={row.price}
      onClick={() => onPrice(row.price)}
      type="button"
    >
      {content}
    </button>
  )
}

function getGroupingOptions(sourceTickSize) {
  return [...new Set([sourceTickSize, ...domPriceGroupings])].filter((grouping) => {
    const multiple = grouping / sourceTickSize
    return grouping >= sourceTickSize && Math.abs(multiple - Math.round(multiple)) < 1e-8
  })
}

export function CompactDom({ currentPrice, orderbook, sourceTickSize = 0.25 }) {
  const [priceGrouping, setPriceGrouping] = useState(sourceTickSize)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const domRef = useRef(null)
  const settingsPopoverRef = useRef(null)
  const settingsTriggerRef = useRef(null)
  const groupingOptions = useMemo(() => getGroupingOptions(sourceTickSize), [sourceTickSize])
  const groupedOrderbook = useMemo(
    () => aggregateDomOrderbook(orderbook, priceGrouping),
    [orderbook, priceGrouping]
  )
  const asks = [...groupedOrderbook.asks.slice(0, 3)].reverse()
  const bids = groupedOrderbook.bids.slice(0, 3)
  const maximum = Math.max(
    ...asks.map(({ amount }) => amount),
    ...bids.map(({ amount }) => amount),
    1
  )
  const bestAsk = Number(orderbook.asks[0]?.price)
  const bestBid = Number(orderbook.bids[0]?.price)
  const spread = Number.isFinite(bestAsk) && Number.isFinite(bestBid) ? bestAsk - bestBid : 0
  const groupingMultiple = Math.round(priceGrouping / sourceTickSize)
  const { handleTriggerClick } = useSettingsPopoverFocus({
    containerRef: domRef,
    isOpen: settingsOpen,
    popoverRef: settingsPopoverRef,
    setIsOpen: setSettingsOpen,
    triggerRef: settingsTriggerRef
  })

  return (
    <section
      aria-label="Compact Depth of Market"
      className="dom dom--compact"
      data-ask-count={asks.length}
      data-bid-count={bids.length}
      data-price-grouping={priceGrouping}
      ref={domRef}
    >
      <header>
        <span>
          BTC · {formatDomGrouping(priceGrouping)} · x{groupingMultiple}
        </span>
        <button
          aria-controls="compact-dom-settings-panel"
          aria-expanded={settingsOpen}
          aria-label="Compact DOM settings"
          className="dom-settings-button"
          onClick={handleTriggerClick}
          ref={settingsTriggerRef}
          title="DOM settings"
          type="button"
        >
          <SettingsIcon aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      </header>
      {settingsOpen && (
        <aside
          aria-label="Compact DOM settings"
          className="dom-settings-popover"
          id="compact-dom-settings-panel"
          ref={settingsPopoverRef}
          role="dialog"
        >
          <strong>DOM SETTINGS</strong>
          <label>
            PRICE GROUPING
            <select
              aria-label="Compact DOM price grouping"
              onChange={(event) => setPriceGrouping(Number(event.target.value))}
              value={priceGrouping}
            >
              {groupingOptions.map((grouping) => (
                <option key={grouping} value={grouping}>
                  {formatDomGrouping(grouping)} USDT · x{Math.round(grouping / sourceTickSize)}
                </option>
              ))}
            </select>
          </label>
        </aside>
      )}
      <div className="dom-head">
        <span>PRICE</span>
        <span>Δ</span>
        <span>SIZE</span>
        <span>LAST</span>
      </div>
      <div aria-label="Three ask price levels" className="dom-compact-side" role="list">
        {asks.map((row, index) => (
          <DomLevelRow
            index={index}
            interactive={false}
            key={`compact-ask-${row.price}`}
            maximum={maximum}
            row={row}
            side="ask"
          />
        ))}
      </div>
      <div
        aria-label={`Last price ${fmt(currentPrice)}, spread ${fmt(spread)}`}
        className="dom-spread-row"
        data-price={currentPrice}
        data-spread={spread}
      >
        <span>
          <small>LAST</small>
          <strong>{fmt(currentPrice)}</strong>
        </span>
        <span>
          <small>SPREAD</small>
          <strong>{fmt(spread)}</strong>
        </span>
      </div>
      <div aria-label="Three bid price levels" className="dom-compact-side" role="list">
        {bids.map((row, index) => (
          <DomLevelRow
            index={index}
            interactive={false}
            key={`compact-bid-${row.price}`}
            maximum={maximum}
            row={row}
            side="bid"
          />
        ))}
      </div>
    </section>
  )
}

export default function Dom({ currentPrice, orderbook, onPrice, sourceTickSize }) {
  const [priceGrouping, setPriceGrouping] = useState(sourceTickSize)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const domRef = useRef(null)
  const settingsPopoverRef = useRef(null)
  const settingsTriggerRef = useRef(null)
  const askLevelsRef = useRef(null)
  const bidLevelsRef = useRef(null)
  const domScrollPosition = useRef({ askFromBottom: 0, bidFromTop: 0 })
  const previousDomGrouping = useRef(null)
  const groupingOptions = useMemo(() => getGroupingOptions(sourceTickSize), [sourceTickSize])
  const groupedOrderbook = useMemo(
    () => aggregateDomOrderbook(orderbook, priceGrouping),
    [orderbook, priceGrouping]
  )
  const asks = [...groupedOrderbook.asks].reverse()
  const bids = groupedOrderbook.bids
  const rows = [...asks, ...bids]
  const maximum = Math.max(...rows.map((row) => row.amount), 1)
  const bestAsk = Number(orderbook.asks[0]?.price)
  const bestBid = Number(orderbook.bids[0]?.price)
  const spread = Number.isFinite(bestAsk) && Number.isFinite(bestBid) ? bestAsk - bestBid : 0
  const groupingMultiple = Math.round(priceGrouping / sourceTickSize)
  const { handleTriggerClick } = useSettingsPopoverFocus({
    containerRef: domRef,
    isOpen: settingsOpen,
    popoverRef: settingsPopoverRef,
    setIsOpen: setSettingsOpen,
    triggerRef: settingsTriggerRef
  })
  const handlePriceGroupingChange = (event) => {
    const grouping = Number(event.target.value)
    setPriceGrouping(grouping)
    trackEvent('change_demo_setting', { area: 'dom', setting: 'price_grouping', value: grouping })
  }

  useLayoutEffect(() => {
    if (previousDomGrouping.current !== priceGrouping) {
      domScrollPosition.current = { askFromBottom: 0, bidFromTop: 0 }
      previousDomGrouping.current = priceGrouping
    }

    const asksElement = askLevelsRef.current
    const bidsElement = bidLevelsRef.current
    if (asksElement) {
      const { askFromBottom } = domScrollPosition.current
      asksElement.scrollTop = Math.max(
        0,
        asksElement.scrollHeight - asksElement.clientHeight - askFromBottom
      )
    }
    if (bidsElement) bidsElement.scrollTop = domScrollPosition.current.bidFromTop
  }, [groupedOrderbook, priceGrouping])

  return (
    <section
      aria-label="Depth of Market"
      className="dom"
      data-groups-applied={orderbook.groupsApplied}
      data-price-grouping={priceGrouping}
      ref={domRef}
    >
      <header>
        <span>
          BTC · {formatDomGrouping(priceGrouping)} · x{groupingMultiple}
        </span>
        <button
          aria-controls="dom-settings-panel"
          aria-expanded={settingsOpen}
          aria-label="DOM settings"
          className="dom-settings-button"
          onClick={handleTriggerClick}
          ref={settingsTriggerRef}
          title="DOM settings"
          type="button"
        >
          <SettingsIcon aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      </header>
      {settingsOpen && (
        <aside
          aria-label="DOM settings"
          className="dom-settings-popover"
          id="dom-settings-panel"
          ref={settingsPopoverRef}
          role="dialog"
        >
          <strong>DOM SETTINGS</strong>
          <label>
            PRICE GROUPING
            <select
              aria-label="DOM price grouping"
              onChange={handlePriceGroupingChange}
              value={priceGrouping}
            >
              {groupingOptions.map((grouping) => (
                <option key={grouping} value={grouping}>
                  {formatDomGrouping(grouping)} USDT · x{Math.round(grouping / sourceTickSize)}
                </option>
              ))}
            </select>
          </label>
        </aside>
      )}
      <div className="dom-head">
        <span>PRICE</span>
        <span>Δ</span>
        <span>SIZE</span>
        <span>LAST</span>
      </div>
      <div className="dom-ladder">
        <div
          aria-label="Ask price levels"
          className="dom-book-side dom-book-side--asks"
          data-level-count={asks.length}
          onScroll={(event) => {
            const element = event.currentTarget
            domScrollPosition.current.askFromBottom = Math.max(
              0,
              element.scrollHeight - element.clientHeight - element.scrollTop
            )
          }}
          ref={askLevelsRef}
          tabIndex={0}
        >
          {asks.map((row, index) => (
            <DomLevelRow
              index={index}
              key={`ask-${row.price}`}
              maximum={maximum}
              onPrice={onPrice}
              row={row}
              side="ask"
            />
          ))}
        </div>
        <div
          aria-label={`Last price ${fmt(currentPrice)}, spread ${fmt(spread)}`}
          className="dom-spread-row"
          data-price={currentPrice}
          data-spread={spread}
        >
          <span>
            <small>LAST</small>
            <strong>{fmt(currentPrice)}</strong>
          </span>
          <span>
            <small>SPREAD</small>
            <strong>{fmt(spread)}</strong>
          </span>
        </div>
        <div
          aria-label="Bid price levels"
          className="dom-book-side dom-book-side--bids"
          data-level-count={bids.length}
          onScroll={(event) => {
            domScrollPosition.current.bidFromTop = event.currentTarget.scrollTop
          }}
          ref={bidLevelsRef}
          tabIndex={0}
        >
          {bids.map((row, index) => (
            <DomLevelRow
              index={index}
              key={`bid-${row.price}`}
              maximum={maximum}
              onPrice={onPrice}
              row={row}
              side="bid"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

const orderbookLevelType = PropTypes.shape({
  amount: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired
})

Dom.propTypes = {
  currentPrice: PropTypes.number.isRequired,
  onPrice: PropTypes.func.isRequired,
  orderbook: PropTypes.shape({
    asks: PropTypes.arrayOf(orderbookLevelType).isRequired,
    bids: PropTypes.arrayOf(orderbookLevelType).isRequired,
    groupsApplied: PropTypes.number.isRequired
  }).isRequired,
  sourceTickSize: PropTypes.number.isRequired
}

CompactDom.propTypes = {
  currentPrice: PropTypes.number.isRequired,
  orderbook: PropTypes.shape({
    asks: PropTypes.arrayOf(orderbookLevelType).isRequired,
    bids: PropTypes.arrayOf(orderbookLevelType).isRequired,
    groupsApplied: PropTypes.number.isRequired
  }).isRequired,
  sourceTickSize: PropTypes.number
}

DomLevelRow.propTypes = {
  index: PropTypes.number.isRequired,
  interactive: PropTypes.bool,
  maximum: PropTypes.number.isRequired,
  onPrice: PropTypes.func,
  row: orderbookLevelType.isRequired,
  side: PropTypes.oneOf(['ask', 'bid']).isRequired
}
