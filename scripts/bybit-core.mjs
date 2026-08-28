const EXPECTED_TOPIC = 'orderbook.200.BTCUSDT'

export const BYBIT_MARKET = Object.freeze({
  baseAsset: 'BTC',
  exchange: 'bybit',
  marketType: 'spot',
  quoteAsset: 'USDT',
  symbol: 'BTCUSDT'
})

export const SESSION_START = Date.parse('2026-07-31T00:00:00.000Z')
export const SESSION_END_EXCLUSIVE = Date.parse('2026-08-01T00:00:00.000Z')

export function round(value, precision = 8) {
  return Number(value.toFixed(precision))
}

export function parseTradeHeader(line) {
  const columns = line.trim().split(',')
  const accepted = [
    ['id', 'timestamp', 'price', 'volume', 'side'],
    ['id', 'timestamp', 'price', 'volume', 'side', 'rpi']
  ]
  if (!accepted.some((candidate) => candidate.join(',') === columns.join(','))) {
    throw new Error(`Unexpected Bybit Spot trades schema: ${line}`)
  }
  return columns
}

export function parseTradeLine(line, declaredColumns) {
  const fields = line.trim().split(',')
  // Bybit's 2026-07 monthly Spot file declares five columns but contains a sixth RPI field.
  if (fields.length !== declaredColumns.length && !(declaredColumns.length === 5 && fields.length === 6)) {
    throw new Error(
      `Bybit Spot trade row has ${fields.length} columns; header declares ${declaredColumns.length}.`
    )
  }
  const [idValue, timestampValue, priceValue, volumeValue, sideValue, rpiValue = '0'] = fields
  const id = Number(idValue)
  const timestamp = Number(timestampValue)
  const price = Number(priceValue)
  const amount = Number(volumeValue)
  const rpi = Number(rpiValue)
  const side = sideValue.toLowerCase()
  if (
    !Number.isSafeInteger(id) ||
    !Number.isSafeInteger(timestamp) ||
    !Number.isFinite(price) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !['buy', 'sell'].includes(side) ||
    ![0, 1].includes(rpi)
  ) {
    throw new Error(`Invalid Bybit Spot trade row: ${line}`)
  }
  return { amount, id, price, rpi, side, timestamp }
}

export function createBookState() {
  return {
    asks: new Map(),
    bids: new Map(),
    lastSeq: null,
    lastUpdateId: null,
    ready: false
  }
}

function normalizedLevels(levels, label) {
  if (!Array.isArray(levels)) throw new Error(`${label} must be an array.`)
  return levels.map((level, index) => {
    if (!Array.isArray(level) || level.length !== 2) {
      throw new Error(`${label}[${index}] must be [price, amount].`)
    }
    const price = Number(level[0])
    const amount = Number(level[1])
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(amount) || amount < 0) {
      throw new Error(`${label}[${index}] contains an invalid level.`)
    }
    return [price, amount]
  })
}

export function normalizeBookMessage(raw) {
  if (!raw || raw.topic !== EXPECTED_TOPIC || !['snapshot', 'delta'].includes(raw.type)) {
    throw new Error('Unexpected Bybit Spot order-book envelope.')
  }
  const { data } = raw
  if (data?.s !== BYBIT_MARKET.symbol) throw new Error('Unexpected Bybit order-book symbol.')
  const timestamp = Number(raw.ts)
  const creationTimestamp = Number(raw.cts)
  const updateId = Number(data.u)
  const seq = Number(data.seq)
  if (
    !Number.isSafeInteger(timestamp) ||
    !Number.isSafeInteger(creationTimestamp) ||
    !Number.isSafeInteger(updateId) ||
    !Number.isSafeInteger(seq)
  ) {
    throw new Error('Bybit order-book timestamps and sequences must be safe integers.')
  }
  const bids = normalizedLevels(data.b, 'data.b')
  const asks = normalizedLevels(data.a, 'data.a')
  if (raw.type === 'snapshot' && (bids.length !== 200 || asks.length !== 200)) {
    throw new Error('Bybit ob200 snapshot must contain exactly 200 bids and 200 asks.')
  }
  return { asks, bids, creationTimestamp, seq, timestamp, type: raw.type, updateId }
}

function applyLevels(book, levels) {
  for (const [price, amount] of levels) {
    if (amount === 0) book.delete(price)
    else book.set(price, amount)
  }
}

export function applyBookMessage(state, message) {
  if (message.type === 'delta' && !state.ready) {
    return { applied: false, gap: false, reset: false }
  }
  if (
    state.lastSeq !== null &&
    (message.seq < state.lastSeq || (message.type === 'delta' && message.seq === state.lastSeq))
  ) {
    throw new Error(`Bybit order-book seq is not strictly increasing (${message.seq}).`)
  }
  const gap =
    message.type === 'delta' &&
    state.lastUpdateId !== null &&
    message.updateId !== state.lastUpdateId + 1
  if (gap) {
    throw new Error(
      `Bybit order-book update gap: expected ${state.lastUpdateId + 1}, got ${message.updateId}.`
    )
  }
  const reset = message.type === 'snapshot'
  if (reset) {
    state.asks.clear()
    state.bids.clear()
    state.ready = true
  }
  applyLevels(state.bids, message.bids)
  applyLevels(state.asks, message.asks)
  state.lastSeq = message.seq
  state.lastUpdateId = message.updateId
  return { applied: true, gap: false, reset }
}

export function sortedBook(state, depth = 200) {
  const sorted = (book, direction) =>
    [...book.entries()]
      .filter(([, amount]) => amount > 0)
      .sort((left, right) => direction * (left[0] - right[0]))
      .slice(0, depth)
  return { asks: sorted(state.asks, 1), bids: sorted(state.bids, -1) }
}

export function valueArea(levels, fraction = 0.7) {
  if (!levels.length) return { poc: null, vah: null, val: null }
  const ordered = [...levels].sort((left, right) => left.price - right.price)
  const volume = (level) => level.bid + level.ask
  const pocIndex = ordered.reduce(
    (best, level, index) => (volume(level) > volume(ordered[best]) ? index : best),
    0
  )
  const target = ordered.reduce((sum, level) => sum + volume(level), 0) * fraction
  let low = pocIndex
  let high = pocIndex
  let covered = volume(ordered[pocIndex])
  while (covered < target && (low > 0 || high < ordered.length - 1)) {
    const lower = low > 0 ? volume(ordered[low - 1]) : -1
    const upper = high < ordered.length - 1 ? volume(ordered[high + 1]) : -1
    if (upper > lower) {
      high += 1
      covered += upper
    } else {
      low -= 1
      covered += lower
    }
  }
  return { poc: ordered[pocIndex].price, vah: ordered[high].price, val: ordered[low].price }
}

export function createBars(start, count, durationMs) {
  return Array.from({ length: count }, (_, index) => ({
    close: null,
    delta: 0,
    high: null,
    levels: new Map(),
    low: null,
    open: null,
    timestamp: start + index * durationMs,
    volume: 0,
    vwapNumerator: 0
  }))
}

export function addTradeToBar(bar, trade, tickSize = 0.1) {
  if (!bar) return
  const priceLevel = round(Math.round(trade.price / tickSize) * tickSize, 8)
  const level = bar.levels.get(priceLevel) ?? { ask: 0, bid: 0 }
  level[trade.side === 'buy' ? 'ask' : 'bid'] += trade.amount
  bar.levels.set(priceLevel, level)
  bar.open ??= trade.price
  bar.high = Math.max(bar.high ?? trade.price, trade.price)
  bar.low = Math.min(bar.low ?? trade.price, trade.price)
  bar.close = trade.price
  bar.volume += trade.amount
  bar.delta += trade.side === 'buy' ? trade.amount : -trade.amount
  bar.vwapNumerator += trade.price * trade.amount
}

export function finishBars(bars) {
  let close = bars.find((bar) => bar.close !== null)?.close ?? null
  let cvd = 0
  let cumulativeVolume = 0
  let cumulativeVwapNumerator = 0
  return bars.map((bar, index) => {
    if (bar.close === null && close === null) {
      throw new Error(`Cannot forward-fill bar ${index} without an earlier trade.`)
    }
    close = bar.close ?? close
    cvd += bar.delta
    cumulativeVolume += bar.volume
    cumulativeVwapNumerator += bar.vwapNumerator
    const levels = [...bar.levels.entries()]
      .map(([price, level]) => ({ ask: round(level.ask), bid: round(level.bid), price }))
      .sort((left, right) => left.price - right.price)
    return {
      close: round(close),
      cvd: round(cvd),
      delta: round(bar.delta),
      high: round(bar.high ?? close),
      levels,
      low: round(bar.low ?? close),
      open: round(bar.open ?? close),
      timestamp: bar.timestamp,
      volume: round(bar.volume),
      vwap: round(cumulativeVwapNumerator / cumulativeVolume),
      ...valueArea(levels)
    }
  })
}
