#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { createGunzip, gzipSync } from 'node:zlib'
import { createInterface } from 'node:readline'
import { pipeline } from 'node:stream/promises'
import { applyBookGroup, createBookState, sortedBook, valueArea } from './tardis-core.mjs'

const DAY_MS = 86_400_000
const DEFAULTS = {
  barMinutes: 5,
  chunkMinutes: 15,
  date: '2019-12-01',
  download: false,
  exchange: 'binance',
  inputDir: '.cache/tardis',
  outputDir: 'public/data/tardis',
  symbol: 'BTCUSDT',
  tickSize: 0.01
}
const BASE_URL = 'https://datasets.tardis.dev/v1'

function args(argv) {
  const options = { ...DEFAULTS }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--download') {
      options.download = true
      continue
    }
    const key = arg.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    if (!(key in options)) throw new Error(`Unknown option: ${arg}`)
    options[key] = argv[++index]
  }
  options.barMinutes = Number(options.barMinutes)
  options.chunkMinutes = Number(options.chunkMinutes)
  options.tickSize = Number(options.tickSize)
  if (![options.barMinutes, options.chunkMinutes].every(Number.isInteger))
    throw new TypeError('Bar and chunk minutes must be integers.')
  if (options.barMinutes <= 0 || options.chunkMinutes <= 0 || options.tickSize <= 0)
    throw new TypeError('Durations and tick size must be positive.')
  if (options.chunkMinutes % options.barMinutes !== 0)
    throw new TypeError('Chunk duration must be divisible by bar duration.')
  return options
}

function bounds(date) {
  const [year, month, day] = date.split('-').map(Number)
  const start = Date.UTC(year, month - 1, day)
  return { end: start + DAY_MS, start }
}

function urlFor(options, dataset) {
  const [year, month, day] = options.date.split('-')
  return `${BASE_URL}/${options.exchange}/${dataset}/${year}/${month}/${day}/${options.symbol}.csv.gz`
}

async function download(url, destination) {
  await mkdir(path.dirname(destination), { recursive: true })
  const response = await new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'user-agent': 'apextrader-tardis-ingest/2.0' } }, resolve)
    request.setTimeout(60_000, () => request.destroy(new Error(`Timed out downloading ${url}`)))
    request.on('error', reject)
  })
  if ([301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
    response.resume()
    return download(new URL(response.headers.location, url).toString(), destination)
  }
  if (response.statusCode !== 200) throw new Error(`Download failed (${response.statusCode}) for ${url}`)
  await pipeline(response, (await import('node:fs')).createWriteStream(destination))
}

async function hashFile(file) {
  const hash = createHash('sha256')
  await pipeline(createReadStream(file), hash)
  return hash.digest('hex')
}

async function lines(file, visit) {
  const input = createInterface({ crlfDelay: Infinity, input: createReadStream(file).pipe(createGunzip()) })
  for await (const line of input) if (line) await visit(line)
}

function parse(line, columns, label) {
  const fields = line.split(',')
  if (fields.length !== columns.length) throw new Error(`${label} has ${fields.length} columns.`)
  return Object.fromEntries(columns.map((column, index) => [column, fields[index]]))
}

function round(value, precision = 8) {
  return Number(value.toFixed(precision))
}

function barFactory(start, duration) {
  return Array.from({ length: DAY_MS / duration }, (_, index) => ({
    close: null,
    delta: 0,
    high: null,
    levels: new Map(),
    low: null,
    open: null,
    timestamp: start + index * duration,
    volume: 0,
    vwapNumerator: 0
  }))
}

function addTrade(bar, trade, tickSize) {
  const price = round(Math.round(trade.price / tickSize) * tickSize, 2)
  const volumeSide = trade.side === 'buy' ? 'ask' : 'bid'
  const level = bar.levels.get(price) ?? { ask: 0, bid: 0 }
  level[volumeSide] += trade.amount
  bar.levels.set(price, level)
  bar.open ??= trade.price
  bar.high = Math.max(bar.high ?? trade.price, trade.price)
  bar.low = Math.min(bar.low ?? trade.price, trade.price)
  bar.close = trade.price
  bar.volume += trade.amount
  bar.delta += trade.side === 'buy' ? trade.amount : -trade.amount
  bar.vwapNumerator += trade.price * trade.amount
}

function finishBars(bars) {
  let close = bars.find((bar) => bar.close)?.close
  let cvd = 0
  let sessionVolume = 0
  let sessionVwapNumerator = 0
  return bars.map((bar) => {
    close = bar.close ?? close
    cvd += bar.delta
    sessionVolume += bar.volume
    sessionVwapNumerator += bar.vwapNumerator
    const levels = [...bar.levels.entries()]
      .map(([price, level]) => ({ ask: round(level.ask), bid: round(level.bid), price }))
      .sort((a, b) => a.price - b.price)
    return {
      close: round(close), cvd: round(cvd), delta: round(bar.delta),
      high: round(bar.high ?? close), levels, low: round(bar.low ?? close),
      open: round(bar.open ?? close), timestamp: bar.timestamp, volume: round(bar.volume),
      vwap: round(sessionVwapNumerator / sessionVolume), ...valueArea(levels)
    }
  })
}

async function writeCompressedJson(file, value) {
  const bytes = gzipSync(`${JSON.stringify(value)}\n`, { level: 9 })
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, bytes)
  return { bytes: bytes.length, filename: file, sha256: createHash('sha256').update(bytes).digest('hex') }
}

async function ingestTrades(file, options, session) {
  const columns = ['exchange', 'symbol', 'timestamp', 'local_timestamp', 'id', 'side', 'price', 'amount']
  const duration = options.barMinutes * 60_000
  const chunkDurationUs = options.chunkMinutes * 60_000_000
  const startUs = session.start * 1000
  const bars = barFactory(session.start, duration)
  const chunks = []
  let chunkIndex = -1
  let chunkTrades = []
  let count = 0
  let firstTimestampUs = null
  let lastTimestampUs = null
  let header = true

  const flush = async () => {
    if (chunkIndex < 0) return
    const name = `chunks/trades-${String(chunkIndex).padStart(3, '0')}.json.gz`
    const result = await writeCompressedJson(path.join(options.outputDir, name), {
      chunkStartUs: startUs + chunkIndex * chunkDurationUs,
      schema: 'apextrader.trades-chunk/v2', trades: chunkTrades
    })
    chunks.push({ bytes: result.bytes, filename: name, sha256: result.sha256, trades: chunkTrades.length })
  }

  await lines(file, async (line) => {
    if (header) {
      header = false
      if (line !== columns.join(',')) throw new Error(`Unexpected trades schema: ${line}`)
      return
    }
    const row = parse(line, columns, 'Trade row')
    const timestampUs = Number(row.timestamp)
    const localTimestampUs = Number(row.local_timestamp)
    const price = Number(row.price)
    const amount = Number(row.amount)
    const index = Math.floor((timestampUs - startUs) / chunkDurationUs)
    if (index !== chunkIndex) {
      await flush()
      chunkIndex = index
      chunkTrades = []
    }
    const timestamp = Math.floor(timestampUs / 1000)
    addTrade(bars[Math.floor((timestamp - session.start) / duration)], { amount, price, side: row.side }, options.tickSize)
    chunkTrades.push([timestampUs, localTimestampUs, price, amount, row.side === 'buy' ? 1 : 0])
    firstTimestampUs ??= timestampUs
    lastTimestampUs = timestampUs
    count += 1
  })
  await flush()
  return { bars: finishBars(bars), chunks, count, firstTimestampUs, lastTimestampUs }
}

async function ingestBook(file, options, session) {
  const columns = ['exchange', 'symbol', 'timestamp', 'local_timestamp', 'is_snapshot', 'side', 'price', 'amount']
  const state = createBookState()
  const chunkDurationUs = options.chunkMinutes * 60_000_000
  const startUs = session.start * 1000
  const chunks = []
  let groupTimestampUs = null
  let group = []
  let chunkIndex = -1
  let chunkGroups = []
  let chunkCheckpoint = null
  let count = 0
  let ignoredPreSnapshotRows = 0
  let resets = 0
  let firstTimestampUs = null
  let lastTimestampUs = null
  let header = true

  const flushChunk = async () => {
    if (chunkIndex < 0) return
    const name = `chunks/book-${String(chunkIndex).padStart(3, '0')}.json.gz`
    const result = await writeCompressedJson(path.join(options.outputDir, name), {
      checkpoint: chunkCheckpoint, chunkStartUs: startUs + chunkIndex * chunkDurationUs,
      groups: chunkGroups, schema: 'apextrader.book-chunk/v2'
    })
    chunks.push({ bytes: result.bytes, filename: name, groups: chunkGroups.length, sha256: result.sha256 })
  }

  const processGroup = async () => {
    if (!group.length) return
    const nextChunk = Math.floor((groupTimestampUs - startUs) / chunkDurationUs)
    if (nextChunk !== chunkIndex) {
      await flushChunk()
      chunkIndex = nextChunk
      chunkGroups = []
      chunkCheckpoint = state.ready ? sortedBook(state) : null
    }
    const wasReady = state.ready
    const result = applyBookGroup(state, group)
    if (!result.applied) ignoredPreSnapshotRows += group.length
    else {
      if (result.reset && wasReady) resets += 1
      chunkGroups.push([
        groupTimestampUs,
        result.reset ? 1 : 0,
        group.map((row) => [row.side === 'bid' ? 1 : 0, row.price, row.amount])
      ])
      firstTimestampUs ??= groupTimestampUs
      lastTimestampUs = groupTimestampUs
    }
  }

  await lines(file, async (line) => {
    if (header) {
      header = false
      if (line !== columns.join(',')) throw new Error(`Unexpected book schema: ${line}`)
      return
    }
    const row = parse(line, columns, 'Book row')
    const localTimestampUs = Number(row.local_timestamp)
    if (groupTimestampUs !== null && localTimestampUs !== groupTimestampUs) {
      await processGroup()
      group = []
    }
    groupTimestampUs = localTimestampUs
    group.push({ amount: Number(row.amount), isSnapshot: row.is_snapshot === 'true', price: Number(row.price), side: row.side })
    count += 1
  })
  await processGroup()
  await flushChunk()
  if (!state.ready) throw new Error('No complete L2 snapshot was found.')
  return { chunks, count, firstTimestampUs, ignoredPreSnapshotRows, lastTimestampUs, resets }
}

async function main() {
  const options = args(process.argv.slice(2))
  const session = bounds(options.date)
  const sources = [
    { dataset: 'trades', file: path.join(options.inputDir, 'trades.csv.gz') },
    { dataset: 'incremental_book_L2', file: path.join(options.inputDir, 'incremental_book_L2.csv.gz') }
  ]
  if (options.download) for (const source of sources) await download(urlFor(options, source.dataset), source.file)
  for (const source of sources) {
    source.bytes = (await stat(source.file)).size
    source.sha256 = await hashFile(source.file)
    source.url = urlFor(options, source.dataset)
  }
  await mkdir(options.outputDir, { recursive: true })
  const trades = await ingestTrades(sources[0].file, options, session)
  const book = await ingestBook(sources[1].file, options, session)
  const sessionName = 'session-v2.json'
  const sessionPayload = {
    barDurationMs: options.barMinutes * 60_000, bars: trades.bars, date: options.date,
    exchange: options.exchange, playbackStart: Math.floor(book.firstTimestampUs / 1000),
    schema: 'apextrader.tardis-session/v2', sessionEndExclusive: session.end,
    sessionStart: session.start, symbol: options.symbol, tickSize: options.tickSize
  }
  const sessionText = `${JSON.stringify(sessionPayload)}\n`
  await writeFile(path.join(options.outputDir, sessionName), sessionText)
  const sessionAsset = { bytes: Buffer.byteLength(sessionText), filename: sessionName, sha256: createHash('sha256').update(sessionText).digest('hex') }
  const manifest = {
    assets: { bookChunks: book.chunks, session: sessionAsset, tradeChunks: trades.chunks },
    generatedFrom: sources.map(({ bytes, dataset, sha256, url }) => ({ bytes, dataset, sha256, url })),
    normalization: {
      book: 'All rows grouped by exact local_timestamp; pre-snapshot deltas ignored; snapshots reset state; zero amounts delete levels; chunks contain an exact starting checkpoint.',
      chunkDurationMs: options.chunkMinutes * 60_000,
      footprintTickSize: options.tickSize,
      trades: 'Every trade retained in chunk assets; aggressor buy maps to ask and sell maps to bid.'
    },
    schema: 'apextrader.tardis-manifest/v2', session: { date: options.date, exchange: options.exchange, symbol: options.symbol },
    statistics: { bars: trades.bars.length, bookGroups: book.chunks.reduce((n, c) => n + c.groups, 0), bookRows: book.count, ignoredPreSnapshotRows: book.ignoredPreSnapshotRows, snapshotResets: book.resets, trades: trades.count }
  }
  await writeFile(path.join(options.outputDir, 'manifest-v2.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(JSON.stringify(manifest.statistics))
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1 })
