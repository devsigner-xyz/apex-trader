#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { gunzipSync, gzipSync } from 'node:zlib'

const DEFAULTS = {
  amountScale: 100,
  chunkMinutes: 15,
  inputDir: 'public/data/tardis',
  pricePadding: 250,
  priceStep: 1,
  sampleSeconds: 5
}

function argumentsFrom(argv) {
  const options = { ...DEFAULTS }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    const key = argument
      .replace(/^--/, '')
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    if (!(key in options)) throw new Error(`Unknown option: ${argument}`)
    options[key] = Number(argv[++index]) || argv[index]
  }
  for (const key of ['amountScale', 'chunkMinutes', 'pricePadding', 'priceStep', 'sampleSeconds'])
    if (!Number.isFinite(options[key]) || options[key] <= 0)
      throw new TypeError(`${key} must be positive.`)
  return options
}

function readCompressedJson(file) {
  return readFile(file).then((bytes) => JSON.parse(gunzipSync(bytes)))
}

async function writeCompressedJson(file, value) {
  const bytes = gzipSync(`${JSON.stringify(value)}\n`, { level: 9 })
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, bytes)
  return {
    bytes: bytes.length,
    filename: file,
    sha256: createHash('sha256').update(bytes).digest('hex')
  }
}

function updateLevel({ bins, book, priceCount, priceMin, priceStep }, price, amount) {
  const previous = book.get(price) ?? 0
  if (amount === 0) book.delete(price)
  else book.set(price, amount)
  const bin = Math.floor((price - priceMin) / priceStep)
  if (bin >= 0 && bin < priceCount) bins[bin] += amount - previous
}

function initializeState(checkpoint, geometry) {
  const state = {
    asks: new Map(),
    bids: new Map(),
    bins: new Float64Array(geometry.priceCount),
    ...geometry
  }
  for (const [price, amount] of checkpoint?.asks ?? [])
    updateLevel({ ...state, book: state.asks }, price, amount)
  for (const [price, amount] of checkpoint?.bids ?? [])
    updateLevel({ ...state, book: state.bids }, price, amount)
  return state
}

function resetState(state) {
  state.asks.clear()
  state.bids.clear()
  state.bins.fill(0)
}

function applyGroup(state, [, reset, updates]) {
  if (reset) resetState(state)
  for (const [side, price, amount] of updates)
    updateLevel({ ...state, book: side ? state.bids : state.asks }, price, amount)
}

function encodedValues(values) {
  const bytes = new Uint8Array(values.length * 2)
  const view = new DataView(bytes.buffer)
  for (let index = 0; index < values.length; index += 1)
    view.setUint16(index * 2, values[index], true)
  return Buffer.from(bytes).toString('base64')
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

async function main() {
  const options = argumentsFrom(process.argv.slice(2))
  const manifestPath = path.join(options.inputDir, 'manifest-v3.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const datasetDir = path.dirname(path.join(options.inputDir, manifest.assets.session))
  const session = await readCompressedJson(path.join(options.inputDir, manifest.assets.session))
  const priceMin =
    Math.floor(
      (Math.min(...session.bars.map((bar) => bar.low)) - options.pricePadding) / options.priceStep
    ) * options.priceStep
  const priceMax =
    Math.ceil(
      (Math.max(...session.bars.map((bar) => bar.high)) + options.pricePadding) / options.priceStep
    ) * options.priceStep
  const priceCount = Math.ceil((priceMax - priceMin) / options.priceStep)
  const sampleDurationMs = options.sampleSeconds * 1000
  const chunkDurationMs = options.chunkMinutes * 60_000
  const sampleCount = chunkDurationMs / sampleDurationMs
  if (!Number.isInteger(sampleCount))
    throw new TypeError('Chunk duration must be divisible by liquidity sample duration.')

  const liquidityDigest = createHash('sha256')
    .update(
      JSON.stringify({
        amountScale: options.amountScale,
        datasetVersion: manifest.datasetVersion,
        priceCount,
        priceMin,
        priceStep: options.priceStep,
        sampleDurationMs
      })
    )
    .digest('hex')
    .slice(0, 16)
  const liquidityVersion = `v1-${liquidityDigest}`
  const outputRelativeDir = path.posix.join('liquidity', liquidityVersion)
  const outputDir = path.join(datasetDir, outputRelativeDir)
  await rm(outputDir, { force: true, recursive: true })
  await mkdir(outputDir, { recursive: true })

  const histogram = new Uint32Array(65_536)
  const tiles = []
  for (let index = 0; index < manifest.statistics.bookChunks; index += 1) {
    const suffix = String(index).padStart(3, '0')
    const bookPath = path.join(
      options.inputDir,
      manifest.assets.bookChunkTemplate.replace('{index}', suffix)
    )
    const chunk = await readCompressedJson(bookPath)
    const state = initializeState(chunk.checkpoint, {
      priceCount,
      priceMin,
      priceStep: options.priceStep
    })
    const values = new Uint16Array(sampleCount * priceCount)
    let groupIndex = 0
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const sampleEndUs =
        (chunk.chunkStartUs / 1000 + (sampleIndex + 1) * sampleDurationMs) * 1000 - 1
      while (groupIndex < chunk.groups.length && chunk.groups[groupIndex][0] <= sampleEndUs) {
        applyGroup(state, chunk.groups[groupIndex])
        groupIndex += 1
      }
      const offset = sampleIndex * priceCount
      for (let priceIndex = 0; priceIndex < priceCount; priceIndex += 1) {
        const quantized = Math.min(
          Math.max(Math.round(state.bins[priceIndex] * options.amountScale), 0),
          65_535
        )
        values[offset + priceIndex] = quantized
        if (quantized > 0) histogram[quantized] += 1
      }
    }
    const filename = `liquidity-${suffix}.json.gz`
    const result = await writeCompressedJson(path.join(outputDir, filename), {
      amountScale: options.amountScale,
      chunkStart: chunk.chunkStartUs / 1000,
      priceCount,
      priceMin,
      priceStep: options.priceStep,
      sampleCount,
      sampleDurationMs,
      schema: 'apextrader.liquidity-tile/v1',
      values: encodedValues(values)
    })
    tiles.push({
      bytes: result.bytes,
      filename: path.posix.join(path.dirname(manifest.assets.session), outputRelativeDir, filename),
      samples: sampleCount,
      sha256: result.sha256
    })
  }

  const normalizationMaxRaw = percentile(histogram, 0.995)
  const normalizationMaxAmount = normalizationMaxRaw / options.amountScale
  const template = path.posix.join(
    path.dirname(manifest.assets.session),
    outputRelativeDir,
    'liquidity-{index}.json.gz'
  )
  manifest.assets.liquidityChunkTemplate = template
  manifest.liquidity = {
    amountScale: options.amountScale,
    normalization: 'log1p using the 99.5th percentile of non-zero sampled bins',
    normalizationMaxAmount,
    priceCount,
    priceMin,
    priceStep: options.priceStep,
    sampleDurationMs,
    version: liquidityVersion
  }
  manifest.statistics.liquidityChunks = tiles.length
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const provenancePath = path.join(options.inputDir, manifest.assets.provenance)
  const provenance = JSON.parse(await readFile(provenancePath, 'utf8'))
  provenance.assets.liquidityChunks = tiles
  provenance.normalization.liquidity = `Aggregate resting bid and ask amount sampled every ${
    options.sampleSeconds
  } seconds into ${options.priceStep} USDT bins; uint16 values use ${
    options.amountScale
  } units per BTC and clip at ${65_535 / options.amountScale} BTC.`
  provenance.statistics.liquidityCells = tiles.length * sampleCount * priceCount
  provenance.statistics.liquidityNonZeroCells = histogram.reduce(
    (sum, count, value) => sum + (value > 0 ? count : 0),
    0
  )
  provenance.statistics.liquidityTiles = tiles.length
  provenance.liquidity = manifest.liquidity
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`)

  console.log(
    JSON.stringify({
      bytes: tiles.reduce((sum, tile) => sum + tile.bytes, 0),
      liquidityVersion,
      normalizationMaxAmount,
      priceCount,
      priceMax,
      priceMin,
      tiles: tiles.length
    })
  )
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
