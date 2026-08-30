import assert from 'node:assert/strict'
import test from 'node:test'
import { gzipSync } from 'node:zlib'
import {
  CHUNK_MS,
  chunkIndexFor,
  loadLiquidityChunk,
  loadPlaybackChunk
} from '../src/services/replay/playbackChunks.js'

const manifest = {
  assets: {
    bookChunkTemplate: 'datasets/v3-test/chunks/book-{index}.json.gz',
    liquidityChunkTemplate: 'datasets/v3-test/liquidity/liquidity-{index}.json.gz',
    session: 'datasets/v3-test/session.json.gz',
    tradeChunkTemplate: 'datasets/v3-test/chunks/trades-{index}.json.gz'
  },
  cache: { chunkLimit: 16 },
  datasetVersion: 'v3-test',
  liquidity: { normalizationMaxAmount: 25 },
  schema: 'apextrader.tardis-runtime-manifest/v3'
}

function gzipResponse(value) {
  return new Response(gzipSync(`${JSON.stringify(value)}\n`), {
    headers: { 'content-type': 'application/gzip' }
  })
}

test('playback chunk indexing clamps the shared historical session directly', () => {
  assert.equal(CHUNK_MS, 900_000)
  assert.equal(chunkIndexFor(-1, 0), 0)
  assert.equal(chunkIndexFor(CHUNK_MS * 4 + 1, 0), 4)
  assert.equal(chunkIndexFor(CHUNK_MS * 200, 0), 95)
})

test('the chunk repository directly loads book, trades and optional liquidity', async () => {
  const requested = []
  const fetchImpl = async (url) => {
    requested.push(url)
    if (url.endsWith('manifest-v3.json')) return Response.json(manifest)
    if (url.endsWith('book-012.json.gz'))
      return gzipResponse({ checkpoint: { asks: [], bids: [] }, groups: [] })
    if (url.endsWith('trades-012.json.gz')) return gzipResponse({ trades: [] })
    if (url.endsWith('liquidity-012.json.gz'))
      return gzipResponse({
        amountScale: 100,
        chunkStart: 0,
        priceCount: 1,
        priceMin: 99,
        priceStep: 1,
        sampleCount: 1,
        sampleDurationMs: 5000,
        schema: 'apextrader.liquidity-tile/v1',
        values: Buffer.from(Uint8Array.from([100, 0])).toString('base64')
      })
    return new Response(null, { status: 404 })
  }

  assert.deepEqual(await loadPlaybackChunk(12, fetchImpl), {
    book: { checkpoint: { asks: [], bids: [] }, groups: [] },
    index: 12,
    trades: { trades: [] }
  })
  const liquidity = await loadLiquidityChunk(12, fetchImpl)
  assert.equal(liquidity.normalizationMaxAmount, 25)
  assert.deepEqual([...liquidity.values], [100])
  assert.deepEqual(requested, [
    '/data/tardis/manifest-v3.json',
    '/data/tardis/datasets/v3-test/chunks/book-012.json.gz',
    '/data/tardis/datasets/v3-test/chunks/trades-012.json.gz',
    '/data/tardis/manifest-v3.json',
    '/data/tardis/datasets/v3-test/liquidity/liquidity-012.json.gz'
  ])
})

test('the chunk repository deduplicates global requests and evicts a rejected promise', async () => {
  const previousFetch = globalThis.fetch
  const delays = []
  let bookRequests = 0
  let tradeRequests = 0
  const fetchImpl = async (url) => {
    if (url.endsWith('manifest-v3.json')) return Response.json(manifest)
    if (url.endsWith('book-093.json.gz')) {
      bookRequests += 1
      if (bookRequests <= 3) return new Response(null, { status: 503 })
      return gzipResponse({ checkpoint: { asks: [], bids: [] }, groups: [] })
    }
    if (url.endsWith('trades-093.json.gz')) {
      tradeRequests += 1
      return gzipResponse({ trades: [] })
    }
    return new Response(null, { status: 404 })
  }
  globalThis.fetch = fetchImpl
  try {
    const retryOptions = { sleep: async (delay) => delays.push(delay) }
    const first = loadPlaybackChunk(93, fetchImpl, retryOptions)
    assert.equal(loadPlaybackChunk(93, fetchImpl, retryOptions), first)
    await assert.rejects(first, /Unable to load historical chunk \(503\)/)
    assert.equal(bookRequests, 3)
    assert.deepEqual(delays, [100, 200])

    const recovered = await loadPlaybackChunk(93, fetchImpl, retryOptions)
    assert.deepEqual(recovered, {
      book: { checkpoint: { asks: [], bids: [] }, groups: [] },
      index: 93,
      trades: { trades: [] }
    })
    assert.equal(bookRequests, 4)
    assert.equal(tradeRequests, 2)
    assert.equal(await loadPlaybackChunk(93, fetchImpl, retryOptions), recovered)
    assert.equal(bookRequests, 4)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('the optional liquidity repository evicts a failed global request before recovery', async () => {
  const previousFetch = globalThis.fetch
  const delays = []
  let liquidityRequests = 0
  const fetchImpl = async (url) => {
    if (url.endsWith('manifest-v3.json')) return Response.json(manifest)
    if (url.endsWith('liquidity-092.json.gz')) {
      liquidityRequests += 1
      if (liquidityRequests <= 3) return new Response(null, { status: 503 })
      return gzipResponse({
        amountScale: 100,
        chunkStart: 0,
        priceCount: 1,
        priceMin: 99,
        priceStep: 1,
        sampleCount: 1,
        sampleDurationMs: 5000,
        schema: 'apextrader.liquidity-tile/v1',
        values: Buffer.from(Uint8Array.from([100, 0])).toString('base64')
      })
    }
    return new Response(null, { status: 404 })
  }
  globalThis.fetch = fetchImpl
  try {
    const retryOptions = { sleep: async (delay) => delays.push(delay) }
    await assert.rejects(
      () => loadLiquidityChunk(92, fetchImpl, retryOptions),
      /Unable to load historical chunk \(503\)/
    )
    assert.equal(liquidityRequests, 3)
    assert.deepEqual(delays, [100, 200])

    const recovered = await loadLiquidityChunk(92, fetchImpl, retryOptions)
    assert.deepEqual([...recovered.values], [100])
    assert.equal(liquidityRequests, 4)
    assert.equal(await loadLiquidityChunk(92, fetchImpl, retryOptions), recovered)
  } finally {
    globalThis.fetch = previousFetch
  }
})
