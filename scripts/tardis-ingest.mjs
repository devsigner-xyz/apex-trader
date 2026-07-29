#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { createGunzip } from 'node:zlib'
import { createInterface } from 'node:readline'
import { pipeline } from 'node:stream/promises'

const DEFAULT_DATE = '2019-12-01'
const DEFAULT_SYMBOL = 'BTCUSDT'
const DEFAULT_EXCHANGE = 'binance'
const DEFAULT_BAR_MINUTES = 5
const DEFAULT_TICK_SIZE = 5
const TARDIS_BASE_URL = 'https://datasets.tardis.dev/v1'

function parseArguments(argv) {
  const options = {
    barMinutes: DEFAULT_BAR_MINUTES,
    date: DEFAULT_DATE,
    download: false,
    exchange: DEFAULT_EXCHANGE,
    inputDir: '.cache/tardis',
    outputDir: 'public/data/tardis',
    symbol: DEFAULT_SYMBOL,
    tickSize: DEFAULT_TICK_SIZE
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--download') {
      options.download = true
      continue
    }
    if (argument === '--help') {
      console.log(`Usage: node scripts/tardis-ingest.mjs [options]

Options:
  --download                 Download source .csv.gz files before processing.
  --input-dir <directory>    Raw source cache (default: .cache/tardis).
  --output-dir <directory>   Derived browser assets (default: public/data/tardis).
  --date <YYYY-MM-DD>        UTC trading date (default: ${DEFAULT_DATE}).
  --symbol <symbol>          Market symbol (default: ${DEFAULT_SYMBOL}).
  --exchange <exchange>      Tardis exchange path (default: ${DEFAULT_EXCHANGE}).
  --bar-minutes <number>     Derived candle/footprint duration (default: ${DEFAULT_BAR_MINUTES}).
  --tick-size <number>       Price aggregation increment (default: ${DEFAULT_TICK_SIZE}).`)
      process.exit(0)
    }

    const key = argument.replace(/^--/, '').replace(/-([a-z])/g, (_, character) => character.toUpperCase())
    if (!(key in options)) throw new Error(`Unknown option: ${argument}`)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${argument}`)
    options[key] = value
    index += 1
  }

  options.barMinutes = Number(options.barMinutes)
  options.tickSize = Number(options.tickSize)
  if (!Number.isInteger(options.barMinutes) || options.barMinutes <= 0) {
    throw new TypeError('--bar-minutes must be a positive integer.')
  }
  if (!Number.isFinite(options.tickSize) || options.tickSize <= 0) {
    throw new TypeError('--tick-size must be a positive finite number.')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    throw new TypeError('--date must use YYYY-MM-DD.')
  }

  return options
}

function sourceUrl({ date, exchange, symbol }, dataset) {
  const [year, month, day] = date.split('-')
  return `${TARDIS_BASE_URL}/${exchange}/${dataset}/${year}/${month}/${day}/${symbol}.csv.gz`
}

function sourceFilename(dataset) {
  return dataset === 'trades' ? 'trades.csv.gz' : 'incremental_book_L2.csv.gz'
}

async function download(url, destination) {
  await mkdir(path.dirname(destination), { recursive: true })
  const response = await new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'user-agent': 'apextrader-tardis-ingest/1.0' } }, resolve)
    request.setTimeout(60_000, () => request.destroy(new Error(`Timed out downloading ${url}`)))
    request.on('error', reject)
  })

  if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
    response.resume()
    return download(new URL(response.headers.location, url).toString(), destination)
  }
  if (response.statusCode !== 200) {
    response.resume()
    throw new Error(`Tardis download failed (${response.statusCode}) for ${url}`)
  }

  await pipeline(response, createWriteStream(destination))
  return {
    bytes: Number(response.headers['content-length']) || (await stat(destination)).size,
    tardisMd5: String(response.headers['x-md5'] ?? '').replaceAll('"', '') || null
  }
}

async function sha256(filePath) {
  const hash = createHash('sha256')
  await pipeline(createReadStream(filePath), hash)
  return hash.digest('hex')
}

async function readGzipLines(filePath, onLine) {
  const lines = createInterface({
    crlfDelay: Infinity,
    input: createReadStream(filePath).pipe(createGunzip())
  })
  for await (const line of lines) {
    if (line) onLine(line)
  }
}

function parseCsv(line, expectedColumns, label) {
  const fields = line.split(',')
  if (fields.length !== expectedColumns.length) {
    throw new Error(`${label} row has ${fields.length} columns; expected ${expectedColumns.length}.`)
  }
  return Object.fromEntries(expectedColumns.map((column, index) => [column, fields[index]]))
}

function rounded(value, precision = 8) {
  return Number(value.toFixed(precision))
}

function getSessionBounds(date) {
  const [year, month, day] = date.split('-').map(Number)
  const start = Date.UTC(year, month - 1, day)
  return { end: start + 24 * 60 * 60 * 1000, start }
}

function priceKey(price, tickSize) {
  return rounded(Math.round(price / tickSize) * tickSize)
}

function createBars(sessionStart, barDurationMs) {
  const barCount = (24 * 60 * 60 * 1000) / barDurationMs
  if (!Number.isInteger(barCount)) {
    throw new TypeError('The bar duration must divide one UTC day exactly.')
  }
  return Array.from({ length: barCount }, (_, index) => ({
    cvd: 0,
    delta: 0,
    high: null,
    levels: new Map(),
    low: null,
    open: null,
    tape: [],
    timestamp: sessionStart + index * barDurationMs,
    volume: 0
  }))
}

function addTradeToBar(bar, trade, tickSize) {
  const sideVolumeKey = trade.side === 'buy' ? 'ask' : 'bid'
  const key = priceKey(trade.price, tickSize)
  const level = bar.levels.get(key) ?? { ask: 0, bid: 0 }
  level[sideVolumeKey] += trade.amount
  bar.levels.set(key, level)
  bar.open ??= trade.price
  bar.high = Math.max(bar.high ?? trade.price, trade.price)
  bar.low = Math.min(bar.low ?? trade.price, trade.price)
  bar.close = trade.price
  bar.volume += trade.amount
  bar.delta += trade.side === 'buy' ? trade.amount : -trade.amount
  bar.tape.push(trade)
  if (bar.tape.length > 40) bar.tape.shift()
}

function finalizeBars(bars, initialClose) {
  let close = initialClose
  let cvd = 0

  return bars.map((bar) => {
    const candleClose = bar.close ?? close
    if (!Number.isFinite(candleClose)) {
      throw new Error('The Tardis trade source contained no valid trade before the first candle.')
    }
    close = candleClose
    cvd += bar.delta
    const levels = [...bar.levels.entries()]
      .map(([price, values]) => [price, rounded(values.bid), rounded(values.ask)])
      .sort((left, right) => left[0] - right[0])

    return {
      close: rounded(candleClose),
      cvd: rounded(cvd),
      delta: rounded(bar.delta),
      high: rounded(bar.high ?? candleClose),
      levels,
      low: rounded(bar.low ?? candleClose),
      open: rounded(bar.open ?? candleClose),
      tape: bar.tape.map((trade) => [trade.timestamp, rounded(trade.price), rounded(trade.amount), trade.side]),
      timestamp: bar.timestamp,
      volume: rounded(bar.volume)
    }
  })
}

function createBookSnapshot(bids, asks, timestamp) {
  const rowsFor = (book, sort) =>
    [...book.entries()]
      .filter(([, amount]) => amount > 0)
      .sort(sort)
      .slice(0, 20)
      .map(([price, amount]) => [rounded(price), rounded(amount)])

  return {
    asks: rowsFor(asks, (left, right) => left[0] - right[0]),
    bids: rowsFor(bids, (left, right) => right[0] - left[0]),
    timestamp
  }
}

async function aggregateTrades(filePath, settings, session) {
  const columns = ['exchange', 'symbol', 'timestamp', 'local_timestamp', 'id', 'side', 'price', 'amount']
  const bars = createBars(session.start, settings.barDurationMs)
  let header = null
  let firstTimestamp = null
  let lastTimestamp = null
  let previousTimestamp = -Infinity
  let tradeCount = 0

  await readGzipLines(filePath, (line) => {
    if (!header) {
      header = line
      if (header !== columns.join(',')) throw new Error(`Unexpected trades schema: ${header}`)
      return
    }
    const row = parseCsv(line, columns, 'Trade')
    const timestamp = Math.floor(Number(row.timestamp) / 1000)
    const price = Number(row.price)
    const amount = Number(row.amount)
    if (
      row.exchange !== settings.exchange ||
      row.symbol !== settings.symbol ||
      !Number.isFinite(timestamp) ||
      !Number.isFinite(price) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !['buy', 'sell'].includes(row.side)
    ) {
      throw new Error(`Invalid trade row ${row.id}.`)
    }
    if (timestamp < previousTimestamp) throw new Error('Trade timestamps are not monotonically ordered.')
    previousTimestamp = timestamp
    if (timestamp < session.start || timestamp >= session.end) {
      throw new Error(`Trade ${row.id} lies outside the requested UTC session.`)
    }
    const barIndex = Math.floor((timestamp - session.start) / settings.barDurationMs)
    addTradeToBar(bars[barIndex], { amount, price, side: row.side, timestamp }, settings.tickSize)
    firstTimestamp ??= timestamp
    lastTimestamp = timestamp
    tradeCount += 1
  })

  if (!header || tradeCount === 0) throw new Error('The Tardis trade source contained no data rows.')
  return { bars: finalizeBars(bars, bars.find((bar) => bar.close)?.close), firstTimestamp, lastTimestamp, tradeCount }
}

async function aggregateBook(filePath, settings, session, barDurationMs) {
  const columns = ['exchange', 'symbol', 'timestamp', 'local_timestamp', 'is_snapshot', 'side', 'price', 'amount']
  const barCount = (session.end - session.start) / barDurationMs
  const asks = new Map()
  const bids = new Map()
  const snapshots = []
  let header = null
  let previousTimestamp = -Infinity
  let latestSnapshotTimestamp = null
  let initialSnapshotCaptured = false
  let firstTimestamp = null
  let lastTimestamp = null
  let nextBoundaryIndex = 1
  let rowCount = 0

  await readGzipLines(filePath, (line) => {
    if (!header) {
      header = line
      if (header !== columns.join(',')) throw new Error(`Unexpected incremental_book_L2 schema: ${header}`)
      return
    }
    const row = parseCsv(line, columns, 'Book')
    const timestamp = Math.floor(Number(row.local_timestamp) / 1000)
    const price = Number(row.price)
    const amount = Number(row.amount)
    if (
      row.exchange !== settings.exchange ||
      row.symbol !== settings.symbol ||
      !Number.isFinite(timestamp) ||
      !Number.isFinite(price) ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !['ask', 'bid'].includes(row.side)
    ) {
      throw new Error(`Invalid order-book row at ${row.timestamp}.`)
    }
    if (timestamp < previousTimestamp) {
      throw new Error('Order-book local timestamps are not monotonically ordered.')
    }
    previousTimestamp = timestamp
    if (timestamp < session.start || timestamp >= session.end) {
      throw new Error('Order-book local update lies outside the requested UTC session.')
    }

    // Tardis emits an initial full snapshot in many rows that share a timestamp.
    // Persist it only once the next update proves all of those rows are applied.
    if (
      !initialSnapshotCaptured &&
      latestSnapshotTimestamp !== null &&
      timestamp > latestSnapshotTimestamp
    ) {
      snapshots.push(createBookSnapshot(bids, asks, latestSnapshotTimestamp))
      initialSnapshotCaptured = true
    }

    const barIndex = Math.floor((timestamp - session.start) / barDurationMs)
    while (nextBoundaryIndex <= barIndex) {
      snapshots.push(createBookSnapshot(bids, asks, session.start + nextBoundaryIndex * barDurationMs - 1))
      nextBoundaryIndex += 1
    }

    if (row.is_snapshot === 'true' && latestSnapshotTimestamp !== timestamp) {
      bids.clear()
      asks.clear()
      latestSnapshotTimestamp = timestamp
    }
    const book = row.side === 'bid' ? bids : asks
    if (amount === 0) book.delete(price)
    else book.set(price, amount)

    firstTimestamp ??= timestamp
    lastTimestamp = timestamp
    rowCount += 1
  })

  while (nextBoundaryIndex <= barCount) {
    snapshots.push(createBookSnapshot(bids, asks, session.start + nextBoundaryIndex * barDurationMs - 1))
    nextBoundaryIndex += 1
  }
  if (!header || rowCount === 0) throw new Error('The Tardis order-book source contained no data rows.')
  if (snapshots.some((snapshot) => !snapshot.bids.length || !snapshot.asks.length)) {
    throw new Error('A derived DOM snapshot is missing bid or ask liquidity.')
  }
  return { firstTimestamp, lastTimestamp, rowCount, snapshots }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const barDurationMs = options.barMinutes * 60 * 1000
  const session = getSessionBounds(options.date)
  const settings = { ...options, barDurationMs }
  const sources = [
    { dataset: 'trades', filename: sourceFilename('trades') },
    { dataset: 'incremental_book_L2', filename: sourceFilename('incremental_book_L2') }
  ]

  if (options.download) {
    for (const source of sources) {
      const url = sourceUrl(options, source.dataset)
      const destination = path.join(options.inputDir, source.filename)
      const downloadInfo = await download(url, destination)
      source.download = downloadInfo
      console.log(`Downloaded ${source.dataset}: ${downloadInfo.bytes} bytes`)
    }
  }

  for (const source of sources) {
    source.path = path.join(options.inputDir, source.filename)
    await stat(source.path)
    source.sha256 = await sha256(source.path)
    source.bytes = (await stat(source.path)).size
    source.url = sourceUrl(options, source.dataset)
  }

  const tradeResult = await aggregateTrades(sources[0].path, settings, session)
  const bookResult = await aggregateBook(sources[1].path, settings, session, barDurationMs)
  const payload = {
    barDurationMs,
    bars: tradeResult.bars,
    date: options.date,
    domSnapshots: bookResult.snapshots,
    exchange: options.exchange,
    schema: 'apextrader.tardis-session/v1',
    sessionEndExclusive: session.end,
    sessionStart: session.start,
    symbol: options.symbol,
    tickSize: options.tickSize
  }

  await mkdir(options.outputDir, { recursive: true })
  const assetFilename = `${options.exchange}-${options.symbol.toLowerCase()}-${options.date}.json`
  const assetPath = path.join(options.outputDir, assetFilename)
  const assetText = `${JSON.stringify(payload)}\n`
  await writeFile(assetPath, assetText)
  const assetSha256 = createHash('sha256').update(assetText).digest('hex')
  const manifest = {
    asset: {
      filename: assetFilename,
      sha256: assetSha256,
      bytes: Buffer.byteLength(assetText),
      schema: payload.schema
    },
    generatedFrom: sources.map((source) => ({
      bytes: source.bytes,
      dataset: source.dataset,
      sha256: source.sha256,
      tardisMd5: source.download?.tardisMd5 ?? null,
      url: source.url
    })),
    normalization: {
      barDurationMs,
      dom: `top 20 bid/ask levels sampled at each ${options.barMinutes}-minute boundary from incremental_book_L2 using local_timestamp ordering`,
      priceAggregationTick: options.tickSize,
      trades: 'UTC timestamp microseconds normalized to milliseconds; side preserved as aggressor'
    },
    session: {
      date: options.date,
      exchange: options.exchange,
      firstBookTimestamp: bookResult.firstTimestamp,
      firstTradeTimestamp: tradeResult.firstTimestamp,
      lastBookTimestamp: bookResult.lastTimestamp,
      lastTradeTimestamp: tradeResult.lastTimestamp,
      symbol: options.symbol
    },
    sourceSchema: {
      incremental_book_L2: 'exchange,symbol,timestamp,local_timestamp,is_snapshot,side,price,amount',
      trades: 'exchange,symbol,timestamp,local_timestamp,id,side,price,amount'
    },
    statistics: {
      bookRows: bookResult.rowCount,
      candles: payload.bars.length,
      domSnapshots: payload.domSnapshots.length,
      trades: tradeResult.tradeCount
    }
  }
  await writeFile(path.join(options.outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Wrote ${assetPath} (${manifest.asset.bytes} bytes)`)
  console.log(`Trades: ${tradeResult.tradeCount}; book rows: ${bookResult.rowCount}; bars: ${payload.bars.length}`)
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
