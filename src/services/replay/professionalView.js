const PROFESSIONAL_DEMO_START_OFFSET_MS = (16 * 60 + 30) * 60 * 1000

export function professionalDemoStart(session) {
  const sessionStart = Number(session?.sessionStart)
  const playbackStart = Number(session?.playbackStart ?? sessionStart)
  const sessionEndExclusive = Number(session?.sessionEndExclusive)
  if (
    !Number.isFinite(sessionStart) ||
    !Number.isFinite(playbackStart) ||
    !Number.isFinite(sessionEndExclusive) ||
    sessionEndExclusive <= sessionStart
  )
    throw new TypeError('Professional playback session bounds must be finite and ordered.')

  return Math.min(
    Math.max(sessionStart + PROFESSIONAL_DEMO_START_OFFSET_MS, playbackStart),
    sessionEndExclusive - 1
  )
}

export function advanceProfessionalPlaybackTime(timestamp, elapsedMs, session) {
  if (!Number.isFinite(timestamp) || !Number.isFinite(elapsedMs))
    throw new TypeError('Professional playback time and elapsed time must be finite.')
  const start = professionalDemoStart(session)
  const duration = session.sessionEndExclusive - start
  const offset = (timestamp - start + elapsedMs) % duration
  return start + (offset < 0 ? offset + duration : offset)
}

function sorted(book, descending) {
  return [...book.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => (descending ? b[0] - a[0] : a[0] - b[0]))
    .slice(0, 42)
    .map(([price, amount]) => ({ amount, price }))
}

export function reconstructBook(chunk, timestamp) {
  const bids = new Map(chunk.checkpoint?.bids ?? [])
  const asks = new Map(chunk.checkpoint?.asks ?? [])
  let groupsApplied = 0
  for (const [timestampUs, reset, updates] of chunk.groups) {
    if (timestampUs > timestamp * 1000) break
    if (reset) {
      bids.clear()
      asks.clear()
    }
    for (const [side, price, amount] of updates) {
      const book = side ? bids : asks
      if (amount === 0) book.delete(price)
      else book.set(price, amount)
    }
    groupsApplied += 1
  }
  return { asks: sorted(asks, false), bids: sorted(bids, true), groupsApplied }
}

export function tradesThrough(chunk, timestamp, limit = 80) {
  return chunk.trades
    .filter((trade) => trade[0] <= timestamp * 1000)
    .slice(-limit)
    .reverse()
    .map(([timestampUs, localTimestampUs, price, amount, side]) => ({
      amount,
      localTimestampUs,
      price,
      side: side ? 'buy' : 'sell',
      timestamp: Math.floor(timestampUs / 1000)
    }))
}

export function profileThrough(bars, endIndex) {
  return deriveVolumeProfile(bars.slice(0, endIndex + 1)).levels
}

export function deriveVolumeProfile(bars) {
  if (!Array.isArray(bars)) throw new TypeError('Volume profile bars must be an array.')
  const levels = new Map()
  for (const bar of bars) {
    for (const level of bar.levels ?? []) {
      const current = levels.get(level.price) ?? { ask: 0, bid: 0, price: level.price }
      current.ask += level.ask
      current.bid += level.bid
      levels.set(level.price, current)
    }
  }
  const sortedLevels = [...levels.values()].sort((a, b) => a.price - b.price)
  if (sortedLevels.length === 0) return { levels: sortedLevels, poc: null, vah: null, val: null }

  const pocIndex = sortedLevels.reduce(
    (best, level, index) =>
      level.ask + level.bid > sortedLevels[best].ask + sortedLevels[best].bid ? index : best,
    0
  )
  const { vah, val } = valueArea(sortedLevels, pocIndex)
  return { levels: sortedLevels, poc: sortedLevels[pocIndex].price, vah, val }
}

function valueArea(levels, pocIndex) {
  const totalVolume = levels.reduce((sum, level) => sum + level.ask + level.bid, 0)
  const targetVolume = totalVolume * 0.7
  let includedVolume = levels[pocIndex].ask + levels[pocIndex].bid
  let lowIndex = pocIndex
  let highIndex = pocIndex

  while (includedVolume < targetVolume && (lowIndex > 0 || highIndex < levels.length - 1)) {
    const lowerVolume = lowIndex > 0 ? levels[lowIndex - 1].ask + levels[lowIndex - 1].bid : -1
    const higherVolume =
      highIndex < levels.length - 1 ? levels[highIndex + 1].ask + levels[highIndex + 1].bid : -1
    if (higherVolume >= lowerVolume) {
      highIndex += 1
      includedVolume += higherVolume
    } else {
      lowIndex -= 1
      includedVolume += lowerVolume
    }
  }

  return { vah: levels[highIndex].price, val: levels[lowIndex].price }
}

function mergeBars(group, timestamp) {
  const profile = deriveVolumeProfile(group)
  const latest = group.at(-1)

  return {
    ...latest,
    close: latest.close,
    cvd: latest.cvd,
    delta: group.reduce((sum, bar) => sum + bar.delta, 0),
    high: Math.max(...group.map((bar) => bar.high)),
    levels: profile.levels,
    low: Math.min(...group.map((bar) => bar.low)),
    open: group[0].open,
    poc: profile.poc ?? latest.close,
    timestamp,
    vah: profile.vah ?? latest.close,
    val: profile.val ?? latest.close,
    volume: group.reduce((sum, bar) => sum + bar.volume, 0),
    vwap: latest.vwap
  }
}

export function aggregateProfessionalBars(bars, timeframeMinutes, sourceMinutes = 5) {
  if (!Number.isInteger(timeframeMinutes) || timeframeMinutes < sourceMinutes)
    throw new Error('Timeframe must be an integer at least as large as the source interval.')
  if (timeframeMinutes % sourceMinutes !== 0)
    throw new Error('Timeframe must be a multiple of the source interval.')
  if (timeframeMinutes === sourceMinutes) return bars

  const intervalMs = timeframeMinutes * 60 * 1000
  const groups = new Map()
  for (const bar of bars) {
    const timestamp = Math.floor(bar.timestamp / intervalMs) * intervalMs
    const group = groups.get(timestamp) ?? []
    group.push(bar)
    groups.set(timestamp, group)
  }
  return [...groups.entries()].map(([timestamp, group]) => mergeBars(group, timestamp))
}

export function formatCandleCloseCountdown(timestamp, timeframeMinutes) {
  if (!Number.isFinite(timestamp)) throw new TypeError('Timestamp must be finite.')
  if (!Number.isInteger(timeframeMinutes) || timeframeMinutes <= 0)
    throw new TypeError('Timeframe must be a positive integer.')

  const intervalMs = timeframeMinutes * 60 * 1000
  const elapsedMs = ((timestamp % intervalMs) + intervalMs) % intervalMs
  const remainingMs = elapsedMs === 0 ? intervalMs : intervalMs - elapsedMs
  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function partialBar(base, previous, rawTrades, timestamp, tickSize, priorVolume) {
  const executions = rawTrades.filter((trade) => {
    const time = Math.floor(trade[0] / 1000)
    return time >= base.timestamp && time <= timestamp
  })
  if (!executions.length) {
    const close = previous?.close ?? base.open
    return {
      ...base,
      close,
      delta: 0,
      high: close,
      levels: [],
      low: close,
      open: close,
      poc: close,
      vah: close,
      val: close,
      volume: 0
    }
  }
  const levels = new Map()
  let high = -Infinity
  let low = Infinity
  let volume = 0
  let delta = 0
  let numerator = 0
  for (const [, , price, amount, side] of executions) {
    const key = Number((Math.round(price / tickSize) * tickSize).toFixed(2))
    const level = levels.get(key) ?? { ask: 0, bid: 0, price: key }
    level[side ? 'ask' : 'bid'] += amount
    levels.set(key, level)
    high = Math.max(high, price)
    low = Math.min(low, price)
    volume += amount
    delta += side ? amount : -amount
    numerator += price * amount
  }
  const sortedLevels = [...levels.values()].sort((a, b) => a.price - b.price)
  const pocIndex = sortedLevels.reduce(
    (best, level, index) =>
      level.ask + level.bid > sortedLevels[best].ask + sortedLevels[best].bid ? index : best,
    0
  )
  const { vah, val } = valueArea(sortedLevels, pocIndex)
  const priorNumerator = previous ? previous.vwap * priorVolume : 0
  return {
    ...base,
    close: executions.at(-1)[2],
    cvd: (previous?.cvd ?? 0) + delta,
    delta,
    high,
    levels: sortedLevels,
    low,
    open: executions[0][2],
    poc: sortedLevels[pocIndex].price,
    vah,
    val,
    volume,
    vwap: (priorNumerator + numerator) / (priorVolume + volume)
  }
}

export function deriveProfessionalView(session, chunk, timestamp) {
  const index = Math.max(
    0,
    Math.min(
      session.bars.length - 1,
      Math.floor((timestamp - session.sessionStart) / session.barDurationMs)
    )
  )
  const completeBars = session.bars.slice(0, index)
  const priorVolume = completeBars.reduce((sum, bar) => sum + bar.volume, 0)
  const current = partialBar(
    session.bars[index],
    completeBars.at(-1),
    chunk.trades.trades,
    timestamp,
    session.tickSize,
    priorVolume
  )
  const bars = [...completeBars, current]
  const open = bars[0].open
  return {
    bars,
    change: (current.close / open - 1) * 100,
    current,
    index,
    orderbook: reconstructBook(chunk.book, timestamp),
    profile: profileThrough(bars, index),
    timestamp,
    trades: tradesThrough(chunk.trades, timestamp)
  }
}
