#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createGunzip, gzipSync } from 'node:zlib'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import {
  addTradeToBar,
  applyBookMessage,
  BYBIT_MARKET,
  createBars,
  createBookState,
  finishBars,
  normalizeBookMessage,
  parseTradeHeader,
  parseTradeLine,
  round,
  SESSION_END_EXCLUSIVE,
  SESSION_START,
  sortedBook
} from './bybit-core.mjs'

const DAY_MS = 86_400_000
const CHUNK_DURATION_MS = 15 * 60_000
const CHUNK_COUNT = DAY_MS / CHUNK_DURATION_MS
const SESSION_BAR_DURATION_MS = 5 * 60_000
const TICK_SIZE = 0.1
const PLAYBACK_START = 1_785_456_002_317
const MAX_COMPILED_BYTES = 100 * 1024 * 1024
const TARGET_COMPILED_BYTES = 75 * 1024 * 1024
const DEFAULTS = {
  amountScale: 100,
  download: false,
  outputRoot: '.cache/bybit/compiled',
  pricePadding: 250,
  priceStep: 1,
  rawDir: '.cache/bybit/raw',
  sampleSeconds: 5
}
const SOURCES = Object.freeze({
  book: {
    filename: '2026-07-31_BTCUSDT_ob200.data.zip',
    url: 'https://quote-saver.bycsi.com/orderbook/spot/BTCUSDT/2026-07-31_BTCUSDT_ob200.data.zip'
  },
  dailyTrades: {
    filename: 'BTCUSDT_2026-07-31.csv.gz',
    url: 'https://public.bybit.com/spot/BTCUSDT/BTCUSDT_2026-07-31.csv.gz'
  },
  dailyKlines: {
    filename: 'klines-1d-180.json',
    url: `https://api.bybit.com/v5/market/kline?category=spot&symbol=BTCUSDT&interval=D&end=${SESSION_START - 1}&limit=180`
  },
  monthlyTrades: {
    filename: 'BTCUSDT-2026-07.csv.gz',
    url: 'https://public.bybit.com/spot/BTCUSDT/BTCUSDT-2026-07.csv.gz'
  }
})
const HISTORY = Object.freeze([
  { assetId: 'history-5', count: 288, intervalMinutes: 5 },
  { assetId: 'history-15', count: 288, intervalMinutes: 15 },
  { assetId: 'history-30', count: 336, intervalMinutes: 30 },
  { assetId: 'history-60', count: 336, intervalMinutes: 60 },
  { assetId: 'history-240', count: 180, intervalMinutes: 240 }
])

function optionsFrom(argv) {
  const options = { ...DEFAULTS }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--download') {
      options.download = true
      continue
    }
    const key = argument
      .replace(/^--/, '')
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    if (!(key in options)) throw new Error(`Unknown option: ${argument}`)
    options[key] = argv[++index]
  }
  for (const key of ['amountScale', 'pricePadding', 'priceStep', 'sampleSeconds']) {
    options[key] = Number(options[key])
    if (!Number.isFinite(options[key]) || options[key] <= 0) {
      throw new TypeError(`${key} must be positive.`)
    }
  }
  if ((CHUNK_DURATION_MS / 1000) % options.sampleSeconds !== 0) {
    throw new TypeError('15-minute chunks must be divisible by sampleSeconds.')
  }
  return options
}

async function exists(file) {
  try {
    return (await stat(file)).size > 0
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

async function download(url, destination) {
  if (await exists(destination)) return
  const response = await fetch(url, { headers: { 'user-agent': 'apextrader-bybit-ingest/4.0' } })
  if (!response.ok || !response.body) throw new Error(`Download failed (${response.status}) for ${url}`)
  await mkdir(path.dirname(destination), { recursive: true })
  const temporary = `${destination}.partial`
  await pipeline(Readable.fromWeb(response.body), (await import('node:fs')).createWriteStream(temporary))
  await rename(temporary, destination)
}

async function sha256File(file) {
  const hash = createHash('sha256')
  await pipeline(createReadStream(file), hash)
  return hash.digest('hex')
}

async function sourceMetadata(options) {
  const sources = {}
  for (const [id, source] of Object.entries(SOURCES)) {
    const file = path.join(options.rawDir, source.filename)
    if (options.download) await download(source.url, file)
    if (!(await exists(file))) throw new Error(`Missing source ${file}; run with --download.`)
    sources[id] = {
      bytes: (await stat(file)).size,
      file,
      sha256: await sha256File(file),
      url: source.url
    }
  }
  return sources
}

async function forEachGzipLine(file, visitor) {
  const input = createInterface({
    crlfDelay: Infinity,
    input: createReadStream(file).pipe(createGunzip())
  })
  let index = 0
  for await (const line of input) {
    if (line) await visitor(line, index)
    index += 1
  }
}

async function writeGzipJson(file, value) {
  const bytes = gzipSync(`${JSON.stringify(value)}\n`, { level: 9 })
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, bytes)
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }
}

function assetEntry(key, result, contentEncoding = 'gzip') {
  return {
    bytes: result.bytes,
    contentEncoding,
    contentType: 'application/json',
    key: key.split(path.sep).join(path.posix.sep),
    sha256: result.sha256
  }
}

function addTradeToRange(range, trade) {
  if (trade.timestamp < range.start || trade.timestamp >= SESSION_START) return
  const index = Math.floor((trade.timestamp - range.start) / range.durationMs)
  addTradeToBar(range.bars[index], trade, TICK_SIZE)
}

async function ingestHistoricalTrades(file) {
  const ranges = HISTORY.map((configuration) => {
    const durationMs = configuration.intervalMinutes * 60_000
    const start = SESSION_START - configuration.count * durationMs
    return { ...configuration, bars: createBars(start, configuration.count, durationMs), durationMs, start }
  })
  let columns
  let count = 0
  let firstTimestamp = null
  let lastId = null
  let lastTimestamp = null
  await forEachGzipLine(file, (line, lineIndex) => {
    if (lineIndex === 0) {
      columns = parseTradeHeader(line)
      return
    }
    const trade = parseTradeLine(line, columns)
    if (lastId !== null && trade.id !== lastId + 1) {
      throw new Error(`Monthly Bybit trade id gap: expected ${lastId + 1}, got ${trade.id}.`)
    }
    if (lastTimestamp !== null && trade.timestamp < lastTimestamp) {
      throw new Error('Monthly Bybit trades are not chronological.')
    }
    for (const range of ranges) addTradeToRange(range, trade)
    firstTimestamp ??= trade.timestamp
    lastTimestamp = trade.timestamp
    lastId = trade.id
    count += 1
  })
  return {
    count,
    firstTimestamp,
    lastTimestamp,
    ranges: ranges.map((range) => ({ ...range, bars: finishBars(range.bars) }))
  }
}

async function ingestSessionTrades(file) {
  const bars = createBars(SESSION_START, DAY_MS / SESSION_BAR_DURATION_MS, SESSION_BAR_DURATION_MS)
  const chunks = Array.from({ length: CHUNK_COUNT }, () => [])
  let columns
  let count = 0
  let firstTimestamp = null
  let lastId = null
  let lastTimestamp = null
  await forEachGzipLine(file, (line, lineIndex) => {
    if (lineIndex === 0) {
      columns = parseTradeHeader(line)
      return
    }
    const trade = parseTradeLine(line, columns)
    if (trade.timestamp < SESSION_START || trade.timestamp >= SESSION_END_EXCLUSIVE) {
      throw new Error(`Daily Bybit trade outside the replay session: ${trade.timestamp}.`)
    }
    if (lastId !== null && trade.id !== lastId + 1) {
      throw new Error(`Daily Bybit trade id gap: expected ${lastId + 1}, got ${trade.id}.`)
    }
    if (lastTimestamp !== null && trade.timestamp < lastTimestamp) {
      throw new Error('Daily Bybit trades are not chronological.')
    }
    addTradeToBar(
      bars[Math.floor((trade.timestamp - SESSION_START) / SESSION_BAR_DURATION_MS)],
      trade,
      TICK_SIZE
    )
    const chunkIndex = Math.floor((trade.timestamp - SESSION_START) / CHUNK_DURATION_MS)
    chunks[chunkIndex].push([
      trade.timestamp * 1000,
      null,
      trade.price,
      trade.amount,
      trade.side === 'buy' ? 1 : 0,
      trade.rpi
    ])
    firstTimestamp ??= trade.timestamp
    lastTimestamp = trade.timestamp
    lastId = trade.id
    count += 1
  })
  return { bars: finishBars(bars), chunks, count, firstTimestamp, lastTimestamp }
}

async function unzipLines(file, visitor) {
  const unzip = spawn('unzip', ['-p', file], { stdio: ['ignore', 'pipe', 'inherit'] })
  const input = createInterface({ crlfDelay: Infinity, input: unzip.stdout })
  let index = 0
  for await (const line of input) {
    if (line) await visitor(line, index)
    index += 1
  }
  const exitCode = await new Promise((resolve) => unzip.on('close', resolve))
  if (exitCode !== 0) throw new Error(`unzip failed CRC/stream validation with code ${exitCode}.`)
}

async function ingestBook(file, datasetDir, datasetVersion, assets) {
  const state = createBookState()
  const chunkMetadata = []
  let activeChunkIndex = -1
  let checkpoint = null
  let groups = []
  let count = 0
  let deltas = 0
  let firstTimestamp = null
  let lastTimestamp = null
  let snapshots = 0

  const flushUntil = async (exclusiveIndex) => {
    while (activeChunkIndex >= 0 && activeChunkIndex < exclusiveIndex) {
      const suffix = String(activeChunkIndex).padStart(3, '0')
      const key = path.join(datasetVersion, 'book', `book-${suffix}.json.gz`)
      const result = await writeGzipJson(path.join(datasetDir, 'book', `book-${suffix}.json.gz`), {
        checkpoint,
        chunkStartUs: (SESSION_START + activeChunkIndex * CHUNK_DURATION_MS) * 1000,
        groups,
        schema: 'apextrader.book-chunk/v4'
      })
      assets[`book-${suffix}`] = assetEntry(key, result)
      chunkMetadata.push({ bytes: result.bytes, groups: groups.length, sha256: result.sha256 })
      activeChunkIndex += 1
      checkpoint = sortedBook(state)
      groups = []
    }
  }

  await unzipLines(file, async (line) => {
    const message = normalizeBookMessage(JSON.parse(line))
    if (message.timestamp >= SESSION_END_EXCLUSIVE) return
    if (message.timestamp < SESSION_START) throw new Error('Order-book message predates session.')
    const chunkIndex = Math.floor((message.timestamp - SESSION_START) / CHUNK_DURATION_MS)
    if (activeChunkIndex === -1) {
      activeChunkIndex = 0
      checkpoint = null
    }
    if (chunkIndex > activeChunkIndex) await flushUntil(chunkIndex)
    const result = applyBookMessage(state, message)
    if (!result.applied) throw new Error('Order-book delta was seen before a valid snapshot.')
    const updates = [
      ...message.bids.map(([price, amount]) => [1, price, amount]),
      ...message.asks.map(([price, amount]) => [0, price, amount])
    ]
    groups.push([message.timestamp * 1000, result.reset ? 1 : 0, updates])
    if (state.bids.size !== 200 || state.asks.size !== 200) {
      throw new Error(`Bybit ob200 reconstruction lost depth at ${message.timestamp}.`)
    }
    firstTimestamp ??= message.timestamp
    lastTimestamp = message.timestamp
    snapshots += result.reset ? 1 : 0
    deltas += result.reset ? 0 : 1
    count += 1
  })
  if (firstTimestamp !== PLAYBACK_START) {
    throw new Error(`Expected first snapshot at ${PLAYBACK_START}; got ${firstTimestamp}.`)
  }
  await flushUntil(CHUNK_COUNT)
  if (chunkMetadata.length !== CHUNK_COUNT) throw new Error('Expected 96 book chunks.')
  return { chunks: chunkMetadata, count, deltas, firstTimestamp, lastTimestamp, snapshots }
}

function parseDailyKlines(raw) {
  if (
    raw?.retCode !== 0 ||
    raw?.result?.category !== 'spot' ||
    raw?.result?.symbol !== BYBIT_MARKET.symbol ||
    !Array.isArray(raw?.result?.list) ||
    raw.result.list.length !== 180
  ) {
    throw new Error('Unexpected Bybit V5 Spot daily kline response.')
  }
  const bars = [...raw.result.list]
    .reverse()
    .map(([timestamp, open, high, low, close, volume, turnover]) => ({
      close: Number(close),
      cvd: null,
      delta: null,
      high: Number(high),
      levels: [],
      low: Number(low),
      open: Number(open),
      poc: null,
      timestamp: Number(timestamp),
      turnover: Number(turnover),
      vah: null,
      val: null,
      volume: Number(volume),
      vwap: round(Number(turnover) / Number(volume))
    }))
  if (bars.at(-1).timestamp !== SESSION_START - DAY_MS) {
    throw new Error('Daily Spot history does not end on the day before replay.')
  }
  for (let index = 1; index < bars.length; index += 1) {
    if (bars[index].timestamp - bars[index - 1].timestamp !== DAY_MS) {
      throw new Error('Daily Spot history has a calendar gap.')
    }
  }
  return bars
}

function initializeLiquidityState(checkpoint, geometry) {
  const state = { asks: new Map(), bids: new Map(), bins: new Float64Array(geometry.priceCount), ...geometry }
  const update = (book, price, amount) => {
    const previous = book.get(price) ?? 0
    if (amount === 0) book.delete(price)
    else book.set(price, amount)
    const bin = Math.floor((price - state.priceMin) / state.priceStep)
    if (bin >= 0 && bin < state.priceCount) state.bins[bin] += amount - previous
  }
  state.update = update
  for (const [price, amount] of checkpoint?.asks ?? []) update(state.asks, price, amount)
  for (const [price, amount] of checkpoint?.bids ?? []) update(state.bids, price, amount)
  return state
}

function applyLiquidityGroup(state, [, reset, updates]) {
  if (reset) {
    state.asks.clear()
    state.bids.clear()
    state.bins.fill(0)
  }
  for (const [side, price, amount] of updates) {
    state.update(side ? state.bids : state.asks, price, amount)
  }
}

function encodeUint16(values) {
  const bytes = Buffer.allocUnsafe(values.length * 2)
  for (let index = 0; index < values.length; index += 1) bytes.writeUInt16LE(values[index], index * 2)
  return bytes.toString('base64')
}

function percentile(histogram, fraction) {
  const total = histogram.reduce((sum, count) => sum + count, 0)
  const target = Math.ceil(total * fraction)
  let cumulative = 0
  for (let value = 1; value < histogram.length; value += 1) {
    cumulative += histogram[value]
    if (cumulative >= target) return value
  }
  return histogram.length - 1
}

async function generateLiquidity(options, datasetDir, datasetVersion, assets, sessionBars) {
  const priceMin =
    Math.floor((Math.min(...sessionBars.map((bar) => bar.low)) - options.pricePadding) / options.priceStep) *
    options.priceStep
  const priceMax =
    Math.ceil((Math.max(...sessionBars.map((bar) => bar.high)) + options.pricePadding) / options.priceStep) *
    options.priceStep
  const priceCount = Math.ceil((priceMax - priceMin) / options.priceStep)
  const sampleDurationMs = options.sampleSeconds * 1000
  const sampleCount = CHUNK_DURATION_MS / sampleDurationMs
  const histogram = new Uint32Array(65_536)
  let totalBytes = 0
  let nonZeroCells = 0
  for (let index = 0; index < CHUNK_COUNT; index += 1) {
    const suffix = String(index).padStart(3, '0')
    const bookBytes = await readFile(path.join(datasetDir, 'book', `book-${suffix}.json.gz`))
    const chunk = JSON.parse((await import('node:zlib')).gunzipSync(bookBytes))
    const state = initializeLiquidityState(chunk.checkpoint, { priceCount, priceMin, priceStep: options.priceStep })
    const values = new Uint16Array(sampleCount * priceCount)
    let groupIndex = 0
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const sampleEndUs =
        (SESSION_START + index * CHUNK_DURATION_MS + (sampleIndex + 1) * sampleDurationMs) * 1000 - 1
      while (groupIndex < chunk.groups.length && chunk.groups[groupIndex][0] <= sampleEndUs) {
        applyLiquidityGroup(state, chunk.groups[groupIndex])
        groupIndex += 1
      }
      const offset = sampleIndex * priceCount
      for (let priceIndex = 0; priceIndex < priceCount; priceIndex += 1) {
        const quantized = Math.min(
          Math.max(Math.round(state.bins[priceIndex] * options.amountScale), 0),
          65_535
        )
        values[offset + priceIndex] = quantized
        if (quantized > 0) {
          histogram[quantized] += 1
          nonZeroCells += 1
        }
      }
    }
    const key = path.join(datasetVersion, 'liquidity', `liquidity-${suffix}.json.gz`)
    const result = await writeGzipJson(
      path.join(datasetDir, 'liquidity', `liquidity-${suffix}.json.gz`),
      {
        amountScale: options.amountScale,
        chunkStart: SESSION_START + index * CHUNK_DURATION_MS,
        priceCount,
        priceMin,
        priceStep: options.priceStep,
        sampleCount,
        sampleDurationMs,
        schema: 'apextrader.liquidity-tile/v1',
        values: encodeUint16(values)
      }
    )
    assets[`liquidity-${suffix}`] = assetEntry(key, result)
    totalBytes += result.bytes
  }
  return {
    amountScale: options.amountScale,
    bytes: totalBytes,
    normalization: 'log1p using the 99.5th percentile of non-zero sampled bins',
    normalizationMaxAmount: percentile(histogram, 0.995) / options.amountScale,
    nonZeroCells,
    priceCount,
    priceMin,
    priceStep: options.priceStep,
    sampleDurationMs
  }
}

async function main() {
  const options = optionsFrom(process.argv.slice(2))
  const sources = await sourceMetadata(options)
  const datasetDigest = createHash('sha256')
    .update(
      JSON.stringify({
        market: BYBIT_MARKET,
        normalizationSchema: 'apextrader.market-dataset/v4',
        replayDate: '2026-07-31',
        sources: Object.fromEntries(
          Object.entries(sources).map(([id, source]) => [id, source.sha256])
        )
      })
    )
    .digest('hex')
    .slice(0, 16)
  const datasetVersion = `v4-${datasetDigest}`
  const datasetDir = path.join(options.outputRoot, datasetVersion)
  const assets = {}
  await mkdir(datasetDir, { recursive: true })

  const history = await ingestHistoricalTrades(sources.monthlyTrades.file)
  const sessionTrades = await ingestSessionTrades(sources.dailyTrades.file)
  const book = await ingestBook(sources.book.file, datasetDir, datasetVersion, assets)

  for (const range of history.ranges) {
    const filename = `${range.intervalMinutes}.json.gz`
    const key = path.join(datasetVersion, 'history', filename)
    const result = await writeGzipJson(path.join(datasetDir, 'history', filename), {
      bars: range.bars,
      endExclusive: SESSION_START,
      timeframeMinutes: range.intervalMinutes,
      market: BYBIT_MARKET,
      schema: 'apextrader.market-history/v4',
      start: range.start
    })
    assets[range.assetId] = assetEntry(key, result)
  }

  const dailyBars = parseDailyKlines(JSON.parse(await readFile(sources.dailyKlines.file, 'utf8')))
  const dailyResult = await writeGzipJson(path.join(datasetDir, 'history', '1440.json.gz'), {
    bars: dailyBars,
    endExclusive: SESSION_START,
    timeframeMinutes: 1440,
    market: BYBIT_MARKET,
    schema: 'apextrader.market-history/v4',
    start: dailyBars[0].timestamp
  })
  assets['history-1440'] = assetEntry(
    path.join(datasetVersion, 'history', '1440.json.gz'),
    dailyResult
  )

  for (let index = 0; index < CHUNK_COUNT; index += 1) {
    const suffix = String(index).padStart(3, '0')
    const result = await writeGzipJson(
      path.join(datasetDir, 'trades', `trades-${suffix}.json.gz`),
      {
        chunkStartUs: (SESSION_START + index * CHUNK_DURATION_MS) * 1000,
        schema: 'apextrader.trades-chunk/v4',
        trades: sessionTrades.chunks[index]
      }
    )
    assets[`trades-${suffix}`] = assetEntry(
      path.join(datasetVersion, 'trades', `trades-${suffix}.json.gz`),
      result
    )
  }

  const sessionResult = await writeGzipJson(path.join(datasetDir, 'session', 'session.json.gz'), {
    barDurationMs: SESSION_BAR_DURATION_MS,
    bars: sessionTrades.bars,
    date: '2026-07-31',
    market: BYBIT_MARKET,
    playbackStart: PLAYBACK_START,
    schema: 'apextrader.market-session/v4',
    sessionEndExclusive: SESSION_END_EXCLUSIVE,
    sessionStart: SESSION_START,
    tickSize: TICK_SIZE
  })
  assets.session = assetEntry(
    path.join(datasetVersion, 'session', 'session.json.gz'),
    sessionResult
  )

  const liquidity = await generateLiquidity(
    options,
    datasetDir,
    datasetVersion,
    assets,
    sessionTrades.bars
  )
  const provenance = {
    datasetVersion,
    market: BYBIT_MARKET,
    normalization: {
      book:
        'Bybit Spot orderbook.200 snapshots reset state; continuous deltas apply zero-size deletion; every chunk contains an exact checkpoint; no synthetic depth.',
      history:
        'Pre-roll bars are aggregated from Bybit Spot public trades; aggressor buy maps to ask volume and aggressor sell maps to bid volume.',
      liquidity: `${options.sampleSeconds}s samples of reconstructed top-200 resting liquidity in ${options.priceStep} USDT bins.`,
      monthlyTrades:
        'The July source header declares five fields while every row contains a sixth RPI field; the parser validates this source anomaly explicitly.',
      trades:
        'Every daily Spot trade is retained; source millisecond timestamps are represented exactly as microseconds and local timestamp is null.'
    },
    replay: {
      liquidityEnd: SESSION_END_EXCLUSIVE,
      liquidityStart: PLAYBACK_START,
      playbackStart: PLAYBACK_START,
      sessionEndExclusive: SESSION_END_EXCLUSIVE,
      sessionStart: SESSION_START
    },
    schema: 'apextrader.market-dataset-provenance/v4',
    sources: Object.fromEntries(
      Object.entries(sources).map(([id, source]) => [id, {
        bytes: source.bytes,
        sha256: source.sha256,
        url: source.url
      }])
    ),
    statistics: {
      bookDeltas: book.deltas,
      bookMessages: book.count,
      bookSnapshots: book.snapshots,
      dailyBars: dailyBars.length,
      dailyTrades: sessionTrades.count,
      historyBars: Object.fromEntries(history.ranges.map((range) => [range.intervalMinutes, range.bars.length])),
      liquidityNonZeroCells: liquidity.nonZeroCells,
      monthlyTrades: history.count
    }
  }
  const provenanceResult = await writeGzipJson(
    path.join(datasetDir, 'provenance', 'provenance.json.gz'),
    provenance
  )
  assets.provenance = assetEntry(
    path.join(datasetVersion, 'provenance', 'provenance.json.gz'),
    provenanceResult
  )

  const totalAssetBytes = Object.values(assets).reduce((sum, asset) => sum + asset.bytes, 0)
  if (totalAssetBytes > MAX_COMPILED_BYTES) {
    throw new Error(
      `Compiled dataset is ${totalAssetBytes} bytes, above the ${MAX_COMPILED_BYTES}-byte stop limit.`
    )
  }
  const manifest = {
    assets,
    cache: { chunkLimit: 16, immutableMaxAgeSeconds: 31_536_000 },
    datasetVersion,
    liquidity: {
      amountScale: liquidity.amountScale,
      normalization: liquidity.normalization,
      normalizationMaxAmount: liquidity.normalizationMaxAmount,
      priceCount: liquidity.priceCount,
      priceMin: liquidity.priceMin,
      priceStep: liquidity.priceStep,
      sampleDurationMs: liquidity.sampleDurationMs
    },
    liquidityEnd: SESSION_END_EXCLUSIVE,
    liquidityStart: PLAYBACK_START,
    market: BYBIT_MARKET,
    playbackStart: PLAYBACK_START,
    replayDate: '2026-07-31',
    runtime: {
      chunks: {
        bookAssetIdTemplate: 'book-{index}',
        count: CHUNK_COUNT,
        durationMs: CHUNK_DURATION_MS,
        liquidityAssetIdTemplate: 'liquidity-{index}',
        tradeAssetIdTemplate: 'trades-{index}'
      },
      historyAssetIds: {
        5: 'history-5',
        15: 'history-15',
        30: 'history-30',
        60: 'history-60',
        240: 'history-240',
        1440: 'history-1440'
      },
      provenanceAssetId: 'provenance',
      sessionAssetId: 'session'
    },
    schema: 'apextrader.market-dataset-manifest/v4',
    sessionEndExclusive: SESSION_END_EXCLUSIVE,
    sessionStart: SESSION_START,
    statistics: {
      assets: Object.keys(assets).length,
      bars: sessionTrades.bars.length,
      bookChunks: CHUNK_COUNT,
      compiledBytes: totalAssetBytes,
      liquidityChunks: CHUNK_COUNT,
      tradeChunks: CHUNK_COUNT
    }
  }
  await mkdir(options.outputRoot, { recursive: true })
  await writeFile(path.join(options.outputRoot, 'manifest-v4.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(
    JSON.stringify({
      datasetVersion,
      liquidity,
      statistics: manifest.statistics,
      targetExceeded: totalAssetBytes > TARGET_COMPILED_BYTES
    })
  )
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
