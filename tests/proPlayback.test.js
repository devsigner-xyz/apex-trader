import assert from 'node:assert/strict'
import test from 'node:test'
import { gzipSync } from 'node:zlib'
import {
  aggregateProfessionalBars,
  deriveProfessionalView,
  deriveVolumeProfile,
  formatCandleCloseCountdown,
  loadLiquidityChunk,
  loadPlaybackChunk,
  loadProfessionalSession,
  reconstructBook
} from '../src/services/proPlayback.js'

const runtimeManifest = {
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

test('runtime manifest resolves the compressed session and versioned chunk assets', async () => {
  const requested = []
  const session = {
    bars: [],
    schema: 'apextrader.tardis-session/v2',
    sessionStart: 0
  }
  const fetchImpl = async (url) => {
    requested.push(url)
    if (url.endsWith('manifest-v3.json')) return Response.json(runtimeManifest)
    if (url.endsWith('session.json.gz')) return gzipResponse(session)
    if (url.endsWith('book-095.json.gz'))
      return gzipResponse({ checkpoint: { asks: [], bids: [] }, groups: [] })
    if (url.endsWith('liquidity-095.json.gz'))
      return gzipResponse({
        amountScale: 100,
        chunkStart: 0,
        priceCount: 2,
        priceMin: 99,
        priceStep: 1,
        sampleCount: 1,
        sampleDurationMs: 5000,
        schema: 'apextrader.liquidity-tile/v1',
        values: Buffer.from(Uint8Array.from([100, 0, 200, 0])).toString('base64')
      })
    if (url.endsWith('trades-095.json.gz')) return gzipResponse({ trades: [] })
    return new Response(null, { status: 404 })
  }

  assert.deepEqual(await loadProfessionalSession(fetchImpl), session)
  assert.deepEqual(await loadPlaybackChunk(95, fetchImpl), {
    book: { checkpoint: { asks: [], bids: [] }, groups: [] },
    index: 95,
    trades: { trades: [] }
  })
  const liquidity = await loadLiquidityChunk(95, fetchImpl)
  assert.equal(liquidity.normalizationMaxAmount, 25)
  assert.deepEqual([...liquidity.values], [100, 200])
  assert.deepEqual(requested, [
    '/data/tardis/manifest-v3.json',
    '/data/tardis/datasets/v3-test/session.json.gz',
    '/data/tardis/manifest-v3.json',
    '/data/tardis/datasets/v3-test/chunks/book-095.json.gz',
    '/data/tardis/datasets/v3-test/chunks/trades-095.json.gz',
    '/data/tardis/manifest-v3.json',
    '/data/tardis/datasets/v3-test/liquidity/liquidity-095.json.gz'
  ])
})

test('a cached pre-heatmap manifest still loads the core replay safely', async () => {
  const legacyManifest = {
    ...runtimeManifest,
    assets: {
      bookChunkTemplate: runtimeManifest.assets.bookChunkTemplate,
      session: runtimeManifest.assets.session,
      tradeChunkTemplate: runtimeManifest.assets.tradeChunkTemplate
    }
  }
  const fetchImpl = async (url) => {
    if (url.endsWith('manifest-v3.json')) return Response.json(legacyManifest)
    if (url.endsWith('session.json.gz'))
      return gzipResponse({ bars: [], schema: 'apextrader.tardis-session/v2' })
    return new Response(null, { status: 404 })
  }
  assert.deepEqual(await loadProfessionalSession(fetchImpl), {
    bars: [],
    schema: 'apextrader.tardis-session/v2'
  })
  await assert.rejects(() => loadLiquidityChunk(0, fetchImpl), /does not include liquidity tiles/)
})

test('browser L2 reconstruction applies only groups at or before the shared clock', () => {
  const chunk = {
    checkpoint: { asks: [[101, 2]], bids: [[100, 3]] },
    groups: [
      [
        1_000_000,
        0,
        [
          [1, 100, 0],
          [1, 99, 4]
        ]
      ],
      [
        2_000_000,
        0,
        [
          [0, 101, 0],
          [0, 102, 5]
        ]
      ]
    ]
  }
  assert.deepEqual(reconstructBook(chunk, 1500), {
    asks: [{ amount: 2, price: 101 }],
    bids: [{ amount: 4, price: 99 }],
    groupsApplied: 1
  })
})

test('active OHLC and footprint do not look ahead beyond playback time', () => {
  const session = {
    barDurationMs: 300_000,
    bars: [
      {
        close: 100,
        cvd: 0,
        delta: 0,
        high: 100,
        levels: [],
        low: 100,
        open: 100,
        poc: 100,
        timestamp: 0,
        vah: 100,
        val: 100,
        volume: 0,
        vwap: 100
      }
    ],
    sessionStart: 0,
    tickSize: 0.01
  }
  const chunk = {
    book: { checkpoint: { asks: [[101, 1]], bids: [[99, 1]] }, groups: [] },
    trades: {
      trades: [
        [1_000_000, 1_000_000, 100, 2, 1],
        [2_000_000, 2_000_000, 105, 3, 0]
      ]
    }
  }
  const view = deriveProfessionalView(session, chunk, 1500)
  assert.equal(view.current.close, 100)
  assert.equal(view.current.high, 100)
  assert.equal(view.current.volume, 2)
  assert.equal(view.trades.length, 1)
})

test('higher timeframes aggregate real OHLC, volume, delta and footprint levels', () => {
  const bars = [
    {
      close: 102,
      cvd: 2,
      delta: 2,
      high: 103,
      levels: [
        { ask: 2, bid: 1, price: 100 },
        { ask: 4, bid: 2, price: 101 }
      ],
      low: 99,
      open: 100,
      poc: 101,
      timestamp: 0,
      vah: 101,
      val: 100,
      volume: 9,
      vwap: 101
    },
    {
      close: 104,
      cvd: 5,
      delta: 3,
      high: 105,
      levels: [
        { ask: 3, bid: 1, price: 101 },
        { ask: 2, bid: 4, price: 102 }
      ],
      low: 101,
      open: 102,
      poc: 102,
      timestamp: 300_000,
      vah: 102,
      val: 101,
      volume: 10,
      vwap: 102.5
    }
  ]

  const [bar] = aggregateProfessionalBars(bars, 15)
  assert.equal(bar.open, 100)
  assert.equal(bar.high, 105)
  assert.equal(bar.low, 99)
  assert.equal(bar.close, 104)
  assert.equal(bar.volume, 19)
  assert.equal(bar.delta, 5)
  assert.equal(bar.cvd, 5)
  assert.equal(bar.vwap, 102.5)
  assert.deepEqual(bar.levels, [
    { ask: 2, bid: 1, price: 100 },
    { ask: 7, bid: 3, price: 101 },
    { ask: 2, bid: 4, price: 102 }
  ])
  assert.equal(bar.poc, 101)
  assert.equal(bar.val, 101)
  assert.equal(bar.vah, 102)
  assert.deepEqual(deriveVolumeProfile([bar]), deriveVolumeProfile(bars))
})

test('volume profile derives POC and 70% value area only from the supplied visible bars', () => {
  const bars = [
    {
      levels: [
        { ask: 1, bid: 1, price: 100 },
        { ask: 4, bid: 4, price: 101 }
      ]
    },
    {
      levels: [
        { ask: 2, bid: 1, price: 101 },
        { ask: 4, bid: 3, price: 102 },
        { ask: 0.5, bid: 0.5, price: 103 }
      ]
    }
  ]

  assert.deepEqual(deriveVolumeProfile(bars), {
    levels: [
      { ask: 1, bid: 1, price: 100 },
      { ask: 6, bid: 5, price: 101 },
      { ask: 4, bid: 3, price: 102 },
      { ask: 0.5, bid: 0.5, price: 103 }
    ],
    poc: 101,
    vah: 102,
    val: 101
  })
  assert.deepEqual(deriveVolumeProfile(bars.slice(0, 1)), {
    levels: bars[0].levels,
    poc: 101,
    vah: 101,
    val: 101
  })
  assert.deepEqual(deriveVolumeProfile(bars.slice(1)), {
    levels: bars[1].levels,
    poc: 102,
    vah: 102,
    val: 101
  })
  assert.deepEqual(deriveVolumeProfile([]), { levels: [], poc: null, vah: null, val: null })
})

test('unsupported timeframes fail instead of silently approximating market data', () => {
  assert.throws(() => aggregateProfessionalBars([], 7), /multiple/)
})

test('candle close countdown follows the selected timeframe boundary', () => {
  const timestamp = Date.UTC(2019, 11, 1, 4, 2, 18, 250)
  assert.equal(formatCandleCloseCountdown(timestamp, 5), '02:42')
  assert.equal(formatCandleCloseCountdown(timestamp, 15), '12:42')
  assert.equal(formatCandleCloseCountdown(Date.UTC(2019, 11, 1, 4, 5), 5), '05:00')
  assert.throws(() => formatCandleCloseCountdown(Number.NaN, 5), /finite/)
  assert.throws(() => formatCandleCloseCountdown(timestamp, 0), /positive integer/)
})
