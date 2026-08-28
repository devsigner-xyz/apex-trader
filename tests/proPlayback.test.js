import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aggregateProfessionalBars,
  deriveProfessionalView,
  deriveVolumeProfile,
  formatCandleCloseCountdown,
  loadHistoricalBars,
  loadLiquidityChunk,
  loadPlaybackChunk,
  loadProfessionalSession,
  reconstructBook
} from '../src/services/proPlayback.js'

const runtimeManifest = {
  assets: {
    'book-095': { href: '/api/market-data/assets/book-095' },
    'history-60': { href: '/api/market-data/assets/history-60' },
    'liquidity-095': { href: '/api/market-data/assets/liquidity-095' },
    session: { href: '/api/market-data/assets/session' },
    'trades-095': { href: '/api/market-data/assets/trades-095' }
  },
  cache: { chunkLimit: 16 },
  datasetVersion: 'v4-test',
  liquidityEnd: 86_400_000,
  liquidityStart: 2_317,
  liquidity: { normalizationMaxAmount: 25 },
  market: { exchange: 'bybit', marketType: 'spot', symbol: 'BTCUSDT' },
  playbackStart: 2_317,
  runtime: {
    historyAssetIds: { 60: 'history-60' },
    sessionAssetId: 'session'
  },
  schema: 'apextrader.market-dataset-manifest/v4',
  sessionEndExclusive: 86_400_000,
  sessionStart: 0
}

function gzipResponse(value) {
  return new Response(`${JSON.stringify(value)}\n`, {
    headers: { 'content-encoding': 'gzip', 'content-type': 'application/json' }
  })
}

test('runtime manifest resolves the compressed session and versioned chunk assets', async () => {
  const requested = []
  const session = {
    bars: [],
    market: { exchange: 'bybit', marketType: 'spot', symbol: 'BTCUSDT' },
    schema: 'apextrader.market-session/v4',
    sessionEndExclusive: 86_400_000,
    sessionStart: 0
  }
  const fetchImpl = async (url) => {
    requested.push(url)
    if (url === '/api/market-data/manifest') return Response.json(runtimeManifest)
    if (url.endsWith('/session')) return gzipResponse(session)
    if (url.endsWith('/history-60'))
      return gzipResponse({
        bars: [{ timestamp: 0 }],
        market: { exchange: 'bybit', marketType: 'spot', symbol: 'BTCUSDT' },
        schema: 'apextrader.market-history/v4',
        timeframeMinutes: 60
      })
    if (url.endsWith('/book-095'))
      return gzipResponse({
        checkpoint: { asks: [], bids: [] },
        groups: [],
        schema: 'apextrader.book-chunk/v4'
      })
    if (url.endsWith('/liquidity-095'))
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
    if (url.endsWith('/trades-095'))
      return gzipResponse({ schema: 'apextrader.trades-chunk/v4', trades: [] })
    return new Response(null, { status: 404 })
  }

  assert.deepEqual(await loadProfessionalSession(fetchImpl), {
    ...session,
    liquidityEnd: 86_400_000,
    liquidityStart: 2_317,
    playbackStart: 2_317
  })
  assert.deepEqual(await loadHistoricalBars(60, fetchImpl), [{ timestamp: 0 }])
  assert.deepEqual(await loadPlaybackChunk(95, fetchImpl), {
    book: {
      checkpoint: { asks: [], bids: [] },
      groups: [],
      schema: 'apextrader.book-chunk/v4'
    },
    index: 95,
    trades: { schema: 'apextrader.trades-chunk/v4', trades: [] }
  })
  const liquidity = await loadLiquidityChunk(95, fetchImpl)
  assert.equal(liquidity.normalizationMaxAmount, 25)
  assert.deepEqual([...liquidity.values], [100, 200])
  assert.deepEqual(requested, [
    '/api/market-data/manifest',
    '/api/market-data/assets/session',
    '/api/market-data/manifest',
    '/api/market-data/assets/history-60',
    '/api/market-data/manifest',
    '/api/market-data/assets/book-095',
    '/api/market-data/assets/trades-095',
    '/api/market-data/manifest',
    '/api/market-data/assets/liquidity-095'
  ])
})

test('a v4 manifest without the requested liquidity tile still loads core replay safely', async () => {
  const noLiquidityManifest = {
    ...runtimeManifest,
    assets: {
      'book-000': { href: '/api/market-data/assets/book-000' },
      session: runtimeManifest.assets.session,
      'trades-000': { href: '/api/market-data/assets/trades-000' }
    }
  }
  const fetchImpl = async (url) => {
    if (url === '/api/market-data/manifest') return Response.json(noLiquidityManifest)
    if (url.endsWith('/session'))
      return gzipResponse({
        bars: [],
        market: { exchange: 'bybit', marketType: 'spot', symbol: 'BTCUSDT' },
        schema: 'apextrader.market-session/v4',
        sessionEndExclusive: 86_400_000,
        sessionStart: 0
      })
    if (url.endsWith('/book-000'))
      return gzipResponse({
        checkpoint: { asks: [], bids: [] },
        groups: [],
        schema: 'apextrader.book-chunk/v4'
      })
    if (url.endsWith('/trades-000'))
      return gzipResponse({ schema: 'apextrader.trades-chunk/v4', trades: [] })
    return new Response(null, { status: 404 })
  }
  assert.deepEqual(await loadProfessionalSession(fetchImpl), {
    bars: [],
    liquidityEnd: 86_400_000,
    liquidityStart: 2_317,
    market: { exchange: 'bybit', marketType: 'spot', symbol: 'BTCUSDT' },
    playbackStart: 2_317,
    schema: 'apextrader.market-session/v4',
    sessionEndExclusive: 86_400_000,
    sessionStart: 0
  })
  assert.deepEqual(await loadPlaybackChunk(0, fetchImpl), {
    book: {
      checkpoint: { asks: [], bids: [] },
      groups: [],
      schema: 'apextrader.book-chunk/v4'
    },
    index: 0,
    trades: { schema: 'apextrader.trades-chunk/v4', trades: [] }
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
