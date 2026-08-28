import {
  fetchPersistentAsset,
  historicalCacheName,
  recordPersistentChunk,
  removeStaleHistoricalCaches
} from './historicalAssetCache.js'
import { normalizeLiquidityTile } from './liquidityHeatmap.js'

const RUNTIME_MANIFEST_URL = 'data/tardis/manifest-v3.json'
const EXPECTED_MANIFEST_SCHEMA = 'apextrader.tardis-runtime-manifest/v3'
const CHUNK_MS = 15 * 60 * 1000
const playbackChunkCache = new Map()
const liquidityChunkCache = new Map()
let runtimeManifestPromise = null

function assetUrl(path) {
  const base = import.meta.env?.BASE_URL ?? '/'
  return `${base.replace(/\/$/, '')}/${path}`
}

export function chunkIndexFor(timestamp, sessionStart) {
  return Math.max(0, Math.min(95, Math.floor((timestamp - sessionStart) / CHUNK_MS)))
}

async function fetchJson(url, fetchImpl = fetch, init) {
  const response = await fetchImpl(assetUrl(url), init)
  if (!response.ok) throw new Error(`Unable to load historical asset (${response.status})`)
  return response.json()
}

async function fetchGzipJson(url, fetchImpl = fetch, cacheName) {
  const response = await fetchPersistentAsset(assetUrl(url), { cacheName, fetchImpl })
  if (!response.ok) throw new Error(`Unable to load historical chunk (${response.status})`)
  // Vite and correctly configured CDNs transparently decode Content-Encoding.
  if (response.headers.get('content-encoding') === 'gzip') return response.json()
  if (typeof globalThis.DecompressionStream === 'undefined')
    throw new Error('This browser does not support gzip streaming.')
  const stream = response.body.pipeThrough(new globalThis.DecompressionStream('gzip'))
  return JSON.parse(await new Response(stream).text())
}

function validateRuntimeManifest(manifest) {
  if (
    manifest?.schema !== EXPECTED_MANIFEST_SCHEMA ||
    !manifest.datasetVersion ||
    !manifest.assets?.session ||
    !manifest.assets?.bookChunkTemplate ||
    !manifest.assets?.tradeChunkTemplate
  )
    throw new Error('Unexpected historical runtime manifest.')
  return manifest
}

async function fetchRuntimeManifest(fetchImpl) {
  const manifest = validateRuntimeManifest(await fetchJson(RUNTIME_MANIFEST_URL, fetchImpl))
  if (fetchImpl === globalThis.fetch)
    await removeStaleHistoricalCaches(historicalCacheName(manifest.datasetVersion))
  return manifest
}

export function loadRuntimeManifest(fetchImpl = fetch) {
  if (fetchImpl !== globalThis.fetch) return fetchRuntimeManifest(fetchImpl)
  if (!runtimeManifestPromise)
    runtimeManifestPromise = fetchRuntimeManifest(fetchImpl).catch((error) => {
      runtimeManifestPromise = null
      throw error
    })
  return runtimeManifestPromise
}

function runtimeAssetPath(filename) {
  return `data/tardis/${filename}`
}

function chunkAssetPaths(manifest, index) {
  const suffix = String(index).padStart(3, '0')
  const paths = {
    book: runtimeAssetPath(manifest.assets.bookChunkTemplate.replace('{index}', suffix)),
    trades: runtimeAssetPath(manifest.assets.tradeChunkTemplate.replace('{index}', suffix))
  }
  if (manifest.assets.liquidityChunkTemplate)
    paths.liquidity = runtimeAssetPath(
      manifest.assets.liquidityChunkTemplate.replace('{index}', suffix)
    )
  return paths
}

export async function loadProfessionalSession(fetchImpl = fetch) {
  const manifest = await loadRuntimeManifest(fetchImpl)
  const session = await fetchGzipJson(
    runtimeAssetPath(manifest.assets.session),
    fetchImpl,
    historicalCacheName(manifest.datasetVersion)
  )
  if (session.schema !== 'apextrader.tardis-session/v2')
    throw new Error('Unexpected session schema.')
  return session
}

async function fetchPlaybackChunk(index, fetchImpl) {
  const manifest = await loadRuntimeManifest(fetchImpl)
  const paths = chunkAssetPaths(manifest, index)
  const cacheName = historicalCacheName(manifest.datasetVersion)
  const [book, trades] = await Promise.all([
    fetchGzipJson(paths.book, fetchImpl, cacheName),
    fetchGzipJson(paths.trades, fetchImpl, cacheName)
  ])
  if (fetchImpl === globalThis.fetch)
    await recordPersistentChunk(
      {
        cacheName,
        index,
        urls: (nextIndex) => Object.values(chunkAssetPaths(manifest, nextIndex)).map(assetUrl)
      },
      { limit: manifest.cache?.chunkLimit }
    )
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

async function fetchLiquidityChunk(index, fetchImpl) {
  const manifest = await loadRuntimeManifest(fetchImpl)
  if (!manifest.assets?.liquidityChunkTemplate)
    throw new Error('The historical dataset does not include liquidity tiles.')
  const paths = chunkAssetPaths(manifest, index)
  const cacheName = historicalCacheName(manifest.datasetVersion)
  const raw = await fetchGzipJson(paths.liquidity, fetchImpl, cacheName)
  if (fetchImpl === globalThis.fetch)
    await recordPersistentChunk(
      {
        cacheName,
        index,
        urls: (nextIndex) => Object.values(chunkAssetPaths(manifest, nextIndex)).map(assetUrl)
      },
      { limit: manifest.cache?.chunkLimit }
    )
  return normalizeLiquidityTile(raw, manifest.liquidity?.normalizationMaxAmount)
}

export function loadLiquidityChunk(index, fetchImpl = fetch) {
  if (fetchImpl !== globalThis.fetch) return fetchLiquidityChunk(index, fetchImpl)
  if (!liquidityChunkCache.has(index)) {
    const request = fetchLiquidityChunk(index, fetchImpl).catch((error) => {
      liquidityChunkCache.delete(index)
      throw error
    })
    liquidityChunkCache.set(index, request)
  }
  return liquidityChunkCache.get(index)
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

export { CHUNK_MS }
