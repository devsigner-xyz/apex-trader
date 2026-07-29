const EXPECTED_SCHEMA = 'apextrader.tardis-session/v1'
export const TARDIS_SESSION_PATH = 'data/tardis/binance-btcusdt-2019-12-01.json'

function rounded(value, precision = 8) {
  return Number(value.toFixed(precision))
}

function asFiniteNumber(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be a finite number.`)
  return value
}

function formatTime(timestamp) {
  return new Date(timestamp).toISOString().slice(11, 19)
}

function normalizeLevels(levels, label) {
  if (!Array.isArray(levels)) throw new TypeError(`${label} must be an array.`)
  const normalized = levels.map((level, index) => {
    if (!Array.isArray(level) || level.length !== 3) {
      throw new TypeError(`${label}[${index}] must be [price, bid, ask].`)
    }
    const [price, bid, ask] = level.map((value, fieldIndex) =>
      asFiniteNumber(value, `${label}[${index}][${fieldIndex}]`)
    )
    if (bid < 0 || ask < 0) throw new TypeError(`${label}[${index}] cannot have negative volume.`)
    return { ask, bid, price }
  })

  return normalized.sort((left, right) => left.price - right.price)
}

function enrichLevels(levels, imbalanceRatio = 3) {
  const poc = levels.reduce(
    (current, level) =>
      !current || level.bid + level.ask > current.bid + current.ask ? level : current,
    null
  )
  const enriched = levels.map((level, index) => {
    const lowerBid = levels[index - 1]?.bid ?? 0
    const upperAsk = levels[index + 1]?.ask ?? 0
    return {
      ...level,
      askImbalance: level.ask >= Math.max(1, lowerBid) * imbalanceRatio,
      bidImbalance: level.bid >= Math.max(1, upperAsk) * imbalanceRatio,
      delta: rounded(level.ask - level.bid),
      isPoc: level.price === poc?.price,
      total: rounded(level.ask + level.bid)
    }
  })

  return {
    delta: rounded(enriched.reduce((total, level) => total + level.delta, 0)),
    levels: enriched,
    pocPrice: poc?.price ?? null,
    total: rounded(enriched.reduce((total, level) => total + level.total, 0))
  }
}

function normalizeBar(rawBar, index, sessionStart, barDurationMs) {
  if (!rawBar || typeof rawBar !== 'object')
    throw new TypeError(`bars[${index}] must be an object.`)
  const expectedTimestamp = sessionStart + index * barDurationMs
  if (rawBar.timestamp !== expectedTimestamp) {
    throw new TypeError(`bars[${index}] is not aligned to the configured UTC bar duration.`)
  }
  const open = asFiniteNumber(rawBar.open, `bars[${index}].open`)
  const high = asFiniteNumber(rawBar.high, `bars[${index}].high`)
  const low = asFiniteNumber(rawBar.low, `bars[${index}].low`)
  const close = asFiniteNumber(rawBar.close, `bars[${index}].close`)
  const volume = asFiniteNumber(rawBar.volume, `bars[${index}].volume`)
  const delta = asFiniteNumber(rawBar.delta, `bars[${index}].delta`)
  const cvd = asFiniteNumber(rawBar.cvd, `bars[${index}].cvd`)
  if (low > high || open < low || open > high || close < low || close > high || volume < 0) {
    throw new TypeError(`bars[${index}] has invalid OHLCV values.`)
  }

  const levels = normalizeLevels(rawBar.levels, `bars[${index}].levels`)
  const levelVolume = rounded(levels.reduce((total, level) => total + level.bid + level.ask, 0))
  if (levelVolume !== rounded(volume))
    throw new TypeError(`bars[${index}] volume does not match its levels.`)
  const levelDelta = rounded(levels.reduce((total, level) => total + level.ask - level.bid, 0))
  if (levelDelta !== rounded(delta))
    throw new TypeError(`bars[${index}] delta does not match its levels.`)

  if (!Array.isArray(rawBar.tape)) throw new TypeError(`bars[${index}].tape must be an array.`)
  const tape = rawBar.tape.map((trade, tradeIndex) => {
    if (!Array.isArray(trade) || trade.length !== 4) {
      throw new TypeError(
        `bars[${index}].tape[${tradeIndex}] must be [timestamp, price, amount, side].`
      )
    }
    const [timestamp, price, amount, side] = trade
    if (
      !Number.isFinite(timestamp) ||
      !Number.isFinite(price) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !['buy', 'sell'].includes(side) ||
      timestamp < rawBar.timestamp ||
      timestamp >= rawBar.timestamp + barDurationMs ||
      price < low ||
      price > high
    ) {
      throw new TypeError(`bars[${index}].tape[${tradeIndex}] is invalid.`)
    }
    return { amount, price, side, timestamp }
  })

  if (
    tape.some(
      (trade, tradeIndex) => tradeIndex > 0 && trade.timestamp < tape[tradeIndex - 1].timestamp
    )
  ) {
    throw new TypeError(`bars[${index}].tape must be chronological executions.`)
  }
  if (rounded(tape.reduce((total, trade) => total + trade.amount, 0)) > rounded(volume)) {
    throw new TypeError(`bars[${index}].tape cannot exceed source execution volume.`)
  }

  return { close, cvd, delta, high, levels, low, open, tape, timestamp: rawBar.timestamp, volume }
}

function normalizeBookSnapshot(rawSnapshot, index, sessionStart, sessionEndExclusive) {
  if (!rawSnapshot || typeof rawSnapshot !== 'object') {
    throw new TypeError(`domSnapshots[${index}] must be an object.`)
  }
  const timestamp = asFiniteNumber(rawSnapshot.timestamp, `domSnapshots[${index}].timestamp`)
  if (timestamp < sessionStart || timestamp >= sessionEndExclusive) {
    throw new TypeError(`domSnapshots[${index}] lies outside the UTC session.`)
  }
  const normalizeRows = (rows, side) => {
    if (!Array.isArray(rows) || !rows.length)
      throw new TypeError(`domSnapshots[${index}].${side} is empty.`)
    return rows.map((row, rowIndex) => {
      if (!Array.isArray(row) || row.length !== 2) {
        throw new TypeError(`domSnapshots[${index}].${side}[${rowIndex}] must be [price, amount].`)
      }
      const [price, amount] = row.map((value, fieldIndex) =>
        asFiniteNumber(value, `domSnapshots[${index}].${side}[${rowIndex}][${fieldIndex}]`)
      )
      if (amount <= 0)
        throw new TypeError(
          `domSnapshots[${index}].${side}[${rowIndex}] must have positive amount.`
        )
      return { amount, price }
    })
  }

  return {
    asks: normalizeRows(rawSnapshot.asks, 'asks'),
    bids: normalizeRows(rawSnapshot.bids, 'bids'),
    timestamp
  }
}

export function normalizeTardisSession(rawSession) {
  if (!rawSession || rawSession.schema !== EXPECTED_SCHEMA) {
    throw new TypeError(`Expected ${EXPECTED_SCHEMA} data.`)
  }
  const sessionStart = asFiniteNumber(rawSession.sessionStart, 'sessionStart')
  const sessionEndExclusive = asFiniteNumber(rawSession.sessionEndExclusive, 'sessionEndExclusive')
  const barDurationMs = asFiniteNumber(rawSession.barDurationMs, 'barDurationMs')
  const tickSize = asFiniteNumber(rawSession.tickSize, 'tickSize')
  if (!Number.isInteger(barDurationMs) || barDurationMs <= 0 || tickSize <= 0) {
    throw new TypeError('Session bar duration and tick size must be positive.')
  }
  if (sessionEndExclusive - sessionStart !== 24 * 60 * 60 * 1000) {
    throw new TypeError('Tardis playback sessions must span exactly one UTC day.')
  }
  if (!Array.isArray(rawSession.bars) || !rawSession.bars.length) {
    throw new TypeError('Tardis session must include bars.')
  }

  const bars = rawSession.bars.map((bar, index) =>
    normalizeBar(bar, index, sessionStart, barDurationMs)
  )
  if (bars.length * barDurationMs !== sessionEndExclusive - sessionStart) {
    throw new TypeError('Bars do not cover the complete UTC session.')
  }
  const domSnapshots = (rawSession.domSnapshots ?? []).map((snapshot, index) =>
    normalizeBookSnapshot(snapshot, index, sessionStart, sessionEndExclusive)
  )
  if (!domSnapshots.length) throw new TypeError('Tardis session must include DOM snapshots.')
  if (
    domSnapshots.some(
      (snapshot, index) => index > 0 && snapshot.timestamp <= domSnapshots[index - 1].timestamp
    )
  ) {
    throw new TypeError('DOM snapshots must be strictly chronological.')
  }

  return {
    barDurationMs,
    bars,
    date: rawSession.date,
    domSnapshots,
    exchange: rawSession.exchange,
    schema: rawSession.schema,
    sessionEndExclusive,
    sessionStart,
    playbackStart: domSnapshots[0].timestamp,
    symbol: rawSession.symbol,
    tickSize
  }
}

function playbackIndex(session, timestamp) {
  const boundedTimestamp = Math.min(
    Math.max(timestamp, session.sessionStart),
    session.sessionEndExclusive - 1
  )
  return Math.floor((boundedTimestamp - session.sessionStart) / session.barDurationMs)
}

function profileThroughBar(bars, activeIndex) {
  const volumesByPrice = new Map()
  for (let index = 0; index <= activeIndex; index += 1) {
    for (const level of bars[index].levels) {
      const existing = volumesByPrice.get(level.price) ?? { ask: 0, bid: 0 }
      existing.ask += level.ask
      existing.bid += level.bid
      volumesByPrice.set(level.price, existing)
    }
  }
  return enrichLevels(
    [...volumesByPrice.entries()]
      .map(([price, volume]) => ({ ...volume, price }))
      .sort((left, right) => left.price - right.price)
  )
}

function currentOrderbook(domSnapshots, timestamp) {
  let selected = domSnapshots[0]
  for (const snapshot of domSnapshots) {
    if (snapshot.timestamp > timestamp) break
    selected = snapshot
  }
  return selected
}

export function derivePlaybackView(session, timestamp, footprintWindow = 8) {
  const activeIndex = playbackIndex(session, timestamp)
  const currentBar = session.bars[activeIndex]
  const startIndex = Math.max(0, activeIndex - footprintWindow + 1)
  const footprintBars = session.bars.slice(startIndex, activeIndex + 1).map((bar) => ({
    ...bar,
    ...enrichLevels(bar.levels)
  }))

  return {
    candlesticks: session.bars
      .slice(0, activeIndex + 1)
      .map((bar) => [bar.timestamp, bar.open, bar.high, bar.low, bar.close]),
    currentBar: footprintBars.at(-1),
    currentTimestamp: Math.min(
      Math.max(timestamp, session.sessionStart),
      session.sessionEndExclusive - 1
    ),
    cvd: currentBar.cvd,
    cvdBars: session.bars
      .slice(0, activeIndex + 1)
      .map((bar) => ({ delta: bar.delta, timestamp: bar.timestamp })),
    footprintBars,
    orderbook: currentOrderbook(session.domSnapshots, timestamp),
    profile: profileThroughBar(session.bars, activeIndex),
    executedTrades: [...currentBar.tape]
      .sort((left, right) => right.timestamp - left.timestamp)
      .map((trade) => ({ ...trade, time: formatTime(trade.timestamp) })),
    volumes: session.bars.slice(0, activeIndex + 1).map((bar) => [bar.timestamp, bar.volume])
  }
}

export function advancePlaybackTime(timestamp, elapsedMs, speed, session) {
  if (
    !Number.isFinite(timestamp) ||
    !Number.isFinite(elapsedMs) ||
    !Number.isFinite(speed) ||
    speed <= 0
  ) {
    throw new TypeError(
      'Playback time, elapsed time, and speed must be finite; speed must be positive.'
    )
  }
  const playbackStart = session.playbackStart ?? session.sessionStart
  const duration = session.sessionEndExclusive - playbackStart
  const offset = (timestamp - playbackStart + elapsedMs * speed) % duration
  return playbackStart + (offset < 0 ? offset + duration : offset)
}

function localAssetUrl(pathname) {
  const baseUrl = import.meta.env?.BASE_URL ?? '/'
  return `${baseUrl.replace(/\/$/, '')}/${pathname}`
}

export async function loadTardisSession(
  fetchImpl = fetch,
  url = localAssetUrl(TARDIS_SESSION_PATH)
) {
  const response = await fetchImpl(url)
  if (!response.ok) throw new Error(`Unable to load Tardis session (${response.status})`)
  return normalizeTardisSession(await response.json())
}
