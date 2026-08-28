import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { gunzipSync } from 'node:zlib'

const root = path.resolve('.cache/bybit/compiled')
const manifestPath = path.join(root, 'manifest-v4.json')

async function loadManifest(t) {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') {
      t.skip('Run node scripts/bybit-ingest.mjs to generate the local dataset.')
      return null
    }
    throw error
  }
}

async function assetJson(manifest, assetId) {
  const asset = manifest.assets[assetId]
  const bytes = await readFile(path.join(root, asset.key))
  return JSON.parse(gunzipSync(bytes))
}

test('compiled v4 manifest is a complete, immutable Spot allowlist', async (t) => {
  const manifest = await loadManifest(t)
  if (!manifest) return
  assert.equal(manifest.schema, 'apextrader.market-dataset-manifest/v4')
  assert.deepEqual(manifest.market, {
    baseAsset: 'BTC',
    exchange: 'bybit',
    marketType: 'spot',
    quoteAsset: 'USDT',
    symbol: 'BTCUSDT'
  })
  assert.equal(manifest.sessionStart, Date.parse('2026-07-31T00:00:00Z'))
  assert.equal(manifest.playbackStart, 1_785_456_002_317)
  assert.equal(manifest.sessionEndExclusive, Date.parse('2026-08-01T00:00:00Z'))
  assert.equal(manifest.liquidityStart, manifest.playbackStart)
  assert.equal(manifest.liquidityEnd, manifest.sessionEndExclusive)
  assert.equal(Object.keys(manifest.assets).length, 296)
  assert.ok(manifest.statistics.compiledBytes <= 100 * 1024 * 1024)

  let compiledBytes = 0
  for (const [assetId, asset] of Object.entries(manifest.assets)) {
    assert.match(assetId, /^(session|provenance|history-(5|15|30|60|240|1440)|(book|trades|liquidity)-\d{3})$/)
    const absolute = path.resolve(root, asset.key)
    assert.ok(absolute.startsWith(`${root}${path.sep}`), `${assetId} escaped the compiled root`)
    assert.ok(asset.key.startsWith(`${manifest.datasetVersion}/`))
    assert.equal(asset.contentType, 'application/json')
    assert.equal(asset.contentEncoding, 'gzip')
    const bytes = await readFile(absolute)
    assert.equal((await stat(absolute)).size, asset.bytes)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
    compiledBytes += bytes.length
  }
  assert.equal(compiledBytes, manifest.statistics.compiledBytes)
})

test('history windows, replay chunks and liquidity preserve their exact contracts', async (t) => {
  const manifest = await loadManifest(t)
  if (!manifest) return
  const expectedHistory = new Map([
    [5, 288],
    [15, 288],
    [30, 336],
    [60, 336],
    [240, 180],
    [1440, 180]
  ])
  for (const [timeframeMinutes, expectedCount] of expectedHistory) {
    const history = await assetJson(manifest, `history-${timeframeMinutes}`)
    assert.equal(history.schema, 'apextrader.market-history/v4')
    assert.equal(history.timeframeMinutes, timeframeMinutes)
    assert.equal(history.bars.length, expectedCount)
    assert.equal(history.endExclusive, manifest.sessionStart)
    assert.equal(history.bars.at(-1).timestamp, manifest.sessionStart - timeframeMinutes * 60_000)
  }

  const session = await assetJson(manifest, 'session')
  assert.equal(session.schema, 'apextrader.market-session/v4')
  assert.equal(session.bars.length, 288)
  assert.equal(session.playbackStart, manifest.playbackStart)

  const firstBook = await assetJson(manifest, 'book-000')
  const lastBook = await assetJson(manifest, 'book-095')
  assert.equal(firstBook.schema, 'apextrader.book-chunk/v4')
  assert.equal(firstBook.checkpoint, null)
  assert.equal(firstBook.groups[0][0] / 1000, manifest.playbackStart)
  assert.equal(firstBook.groups[0][1], 1)
  assert.equal(lastBook.checkpoint.bids.length, 200)
  assert.equal(lastBook.checkpoint.asks.length, 200)
  assert.ok(lastBook.groups.at(-1)[0] / 1000 < manifest.sessionEndExclusive)

  const firstTrades = await assetJson(manifest, 'trades-000')
  assert.equal(firstTrades.schema, 'apextrader.trades-chunk/v4')
  assert.ok(firstTrades.trades[0][0] / 1000 >= manifest.sessionStart)

  const firstLiquidity = await assetJson(manifest, 'liquidity-000')
  const lastLiquidity = await assetJson(manifest, 'liquidity-095')
  assert.equal(firstLiquidity.schema, 'apextrader.liquidity-tile/v1')
  assert.equal(firstLiquidity.sampleDurationMs, 5000)
  assert.equal(firstLiquidity.priceCount, manifest.liquidity.priceCount)
  assert.equal(lastLiquidity.chunkStart + 15 * 60_000, manifest.liquidityEnd)
})
