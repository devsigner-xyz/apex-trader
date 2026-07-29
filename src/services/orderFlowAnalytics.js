export const cvdResetModes = ['session', 'window', 'manual']
export const timeAndSalesGroupings = ['none', 'price', 'second']

function barTimestampFor(timestamp, barDurationMs) {
  return Math.floor(timestamp / barDurationMs) * barDurationMs
}

function finiteAtLeast(value, fallback, minimum) {
  const number = Number(value)
  return Number.isFinite(number) && number >= minimum ? number : fallback
}

function rounded(value) {
  return Number(value.toFixed(8))
}

function normalizeCvdSettings(settings = {}) {
  return {
    manualResetTimestamp: Number.isFinite(settings.manualResetTimestamp)
      ? settings.manualResetTimestamp
      : null,
    reset: cvdResetModes.includes(settings.reset) ? settings.reset : 'session',
    windowBars: Math.max(1, Math.floor(finiteAtLeast(settings.windowBars, 8, 1)))
  }
}

export function deriveCvdSeries(bars, settings) {
  const { manualResetTimestamp, reset, windowBars } = normalizeCvdSettings(settings)
  const sortedBars = [...bars].sort((left, right) => left.timestamp - right.timestamp)
  const startIndex =
    reset === 'window'
      ? Math.max(0, sortedBars.length - windowBars)
      : reset === 'manual' && manualResetTimestamp !== null
      ? Math.max(
          0,
          sortedBars.findIndex((bar) => bar.timestamp >= manualResetTimestamp)
        )
      : 0
  const visibleBars = sortedBars.slice(startIndex)
  let value = 0

  return visibleBars.map((bar) => {
    value = rounded(value + bar.delta)
    return { delta: bar.delta, timestamp: bar.timestamp, value }
  })
}

function normalizeTimeAndSalesFilters(filters = {}) {
  const side = ['all', 'buy', 'sell'].includes(filters.side) ? filters.side : 'all'
  return {
    grouping: timeAndSalesGroupings.includes(filters.grouping) ? filters.grouping : 'none',
    maximumPrice: finiteAtLeast(filters.maximumPrice, Number.POSITIVE_INFINITY, 0),
    minimumPrice: finiteAtLeast(filters.minimumPrice, 0, 0),
    minimumSize: finiteAtLeast(filters.minimumSize, 0, 0),
    side
  }
}

function matchesFilters(trade, filters) {
  return (
    trade.amount >= filters.minimumSize &&
    trade.price >= filters.minimumPrice &&
    trade.price <= filters.maximumPrice &&
    (filters.side === 'all' || trade.side === filters.side)
  )
}

function groupKey(trade, grouping, index) {
  if (grouping === 'price') return `${trade.price}:${trade.side}`
  if (grouping === 'second')
    return `${Math.floor(trade.timestamp / 1000)}:${trade.price}:${trade.side}`
  return `${trade.timestamp}:${trade.price}:${trade.amount}:${trade.side}:${index}`
}

export function deriveTimeAndSalesRows(executedTrades, filters) {
  const normalizedFilters = normalizeTimeAndSalesFilters(filters)
  const groups = new Map()

  for (const [index, trade] of executedTrades.entries()) {
    if (!matchesFilters(trade, normalizedFilters)) continue
    const key = groupKey(trade, normalizedFilters.grouping, index)
    const current = groups.get(key) ?? {
      amount: 0,
      count: 0,
      executions: [],
      id: key,
      price: trade.price,
      side: trade.side,
      timestamp: trade.timestamp
    }
    current.amount += trade.amount
    current.count += 1
    current.executions.push(trade)
    current.timestamp = Math.max(current.timestamp, trade.timestamp)
    groups.set(key, current)
  }

  return [...groups.values()].sort((left, right) => right.timestamp - left.timestamp)
}

export function isExecutionSelectionMatch(trade, selection, barDurationMs, tickSize) {
  if (!selection) return false
  const selectedPrice = selection.footprintPrice ?? selection.price
  const tradePrice = Number.isFinite(tickSize)
    ? Math.round(trade.price / tickSize) * tickSize
    : trade.price
  return (
    tradePrice === selectedPrice &&
    (selection.side === undefined || trade.side === selection.side) &&
    (selection.barTimestamp === undefined ||
      barTimestampFor(trade.timestamp, barDurationMs) === selection.barTimestamp)
  )
}

export function getBarTimestampForExecution(timestamp, barDurationMs) {
  return barTimestampFor(timestamp, barDurationMs)
}
