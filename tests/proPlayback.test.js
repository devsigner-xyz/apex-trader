import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aggregateProfessionalBars,
  deriveProfessionalView,
  reconstructBook
} from '../src/services/proPlayback.js'

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
})

test('unsupported timeframes fail instead of silently approximating market data', () => {
  assert.throws(() => aggregateProfessionalBars([], 7), /multiple/)
})
