const SESSION_URL = 'data/tardis/session-v2.json'
const CHUNK_MS = 15 * 60 * 1000
const playbackChunkCache = new Map()

function assetUrl(path) {
  const base = import.meta.env?.BASE_URL ?? '/'
  return `${base.replace(/\/$/, '')}/${path}`
}

export function chunkIndexFor(timestamp, sessionStart) {
  return Math.max(0, Math.min(95, Math.floor((timestamp - sessionStart) / CHUNK_MS)))
}

async function fetchJson(url, fetchImpl = fetch) {
  const response = await fetchImpl(assetUrl(url))
  if (!response.ok) throw new Error(`Unable to load historical asset (${response.status})`)
  return response.json()
}

async function fetchGzipJson(url, fetchImpl = fetch) {
  const response = await fetchImpl(assetUrl(url))
  if (!response.ok) throw new Error(`Unable to load historical chunk (${response.status})`)
  // Vite and correctly configured CDNs transparently decode Content-Encoding.
  if (response.headers.get('content-encoding') === 'gzip') return response.json()
  if (typeof globalThis.DecompressionStream === 'undefined')
    throw new Error('This browser does not support gzip streaming.')
  const stream = response.body.pipeThrough(new globalThis.DecompressionStream('gzip'))
  return JSON.parse(await new Response(stream).text())
}

export async function loadProfessionalSession(fetchImpl = fetch) {
  const session = await fetchJson(SESSION_URL, fetchImpl)
  if (session.schema !== 'apextrader.tardis-session/v2')
    throw new Error('Unexpected session schema.')
  return session
}

async function fetchPlaybackChunk(index, fetchImpl) {
  const suffix = String(index).padStart(3, '0')
  const [book, trades] = await Promise.all([
    fetchGzipJson(`data/tardis/chunks/book-${suffix}.json.gz`, fetchImpl),
    fetchGzipJson(`data/tardis/chunks/trades-${suffix}.json.gz`, fetchImpl)
  ])
  return { book, index, trades }
}

export function loadPlaybackChunk(index, fetchImpl = fetch) {
  if (fetchImpl !== globalThis.fetch) return fetchPlaybackChunk(index, fetchImpl)
  if (!playbackChunkCache.has(index)) {
    const request = fetchPlaybackChunk(index, fetchImpl).catch((error) => {
      playbackChunkCache.delete(index)
      throw error
    })
    playbackChunkCache.set(index, request)
  }
  return playbackChunkCache.get(index)
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
  const levels = new Map()
  for (let index = 0; index <= endIndex; index += 1) {
    for (const level of bars[index].levels) {
      const current = levels.get(level.price) ?? { ask: 0, bid: 0, price: level.price }
      current.ask += level.ask
      current.bid += level.bid
      levels.set(level.price, current)
    }
  }
  return [...levels.values()].sort((a, b) => a.price - b.price)
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
  const levelsByPrice = new Map()
  for (const bar of group) {
    for (const level of bar.levels) {
      const current = levelsByPrice.get(level.price) ?? { ask: 0, bid: 0, price: level.price }
      current.ask += level.ask
      current.bid += level.bid
      levelsByPrice.set(level.price, current)
    }
  }
  const levels = [...levelsByPrice.values()].sort((a, b) => a.price - b.price)
  const pocIndex = levels.reduce(
    (best, level, index) =>
      level.ask + level.bid > levels[best].ask + levels[best].bid ? index : best,
    0
  )
  const { vah, val } = valueArea(levels, pocIndex)
  const latest = group.at(-1)

  return {
    ...latest,
    close: latest.close,
    cvd: latest.cvd,
    delta: group.reduce((sum, bar) => sum + bar.delta, 0),
    high: Math.max(...group.map((bar) => bar.high)),
    levels,
    low: Math.min(...group.map((bar) => bar.low)),
    open: group[0].open,
    poc: levels[pocIndex].price,
    timestamp,
    vah,
    val,
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
  const poc = sortedLevels.reduce(
    (best, level) => (!best || level.ask + level.bid > best.ask + best.bid ? level : best),
    null
  )?.price
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
    poc,
    vah: high,
    val: low,
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

export { CHUNK_MS }
