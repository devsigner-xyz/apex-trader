import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceProfessionalPlaybackTime,
  aggregateProfessionalBars,
  deriveProfessionalView,
  deriveVolumeProfile,
  formatCandleCloseCountdown,
  professionalDemoStart,
  profileThrough,
  reconstructBook,
  tradesThrough
} from '../src/services/replay/professionalView.js'

function bar(overrides = {}) {
  return {
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
    vwap: 100,
    ...overrides
  }
}

test('professional replay timing validates bounds, clamps the demo start and wraps both ways', () => {
  const day = 24 * 60 * 60 * 1000
  const demoStart = (16 * 60 + 30) * 60 * 1000

  assert.equal(professionalDemoStart({ sessionEndExclusive: day, sessionStart: 0 }), demoStart)
  assert.equal(
    professionalDemoStart({
      playbackStart: demoStart + 1_000,
      sessionEndExclusive: day,
      sessionStart: 0
    }),
    demoStart + 1_000
  )
  assert.equal(professionalDemoStart({ sessionEndExclusive: 10_000, sessionStart: 0 }), 9_999)
  assert.equal(
    advanceProfessionalPlaybackTime(day - 10, 25, {
      sessionEndExclusive: day,
      sessionStart: 0
    }),
    demoStart + 15
  )
  assert.equal(
    advanceProfessionalPlaybackTime(demoStart, -1, {
      sessionEndExclusive: day,
      sessionStart: 0
    }),
    day - 1
  )

  for (const session of [
    null,
    { sessionEndExclusive: day, sessionStart: Number.NaN },
    { playbackStart: Number.NaN, sessionEndExclusive: day, sessionStart: 0 },
    { sessionEndExclusive: Number.NaN, sessionStart: 0 },
    { sessionEndExclusive: 0, sessionStart: 0 }
  ])
    assert.throws(() => professionalDemoStart(session), /bounds must be finite and ordered/)
  assert.throws(
    () =>
      advanceProfessionalPlaybackTime(Number.NaN, 1, { sessionEndExclusive: day, sessionStart: 0 }),
    /must be finite/
  )
  assert.throws(
    () =>
      advanceProfessionalPlaybackTime(demoStart, Number.NaN, {
        sessionEndExclusive: day,
        sessionStart: 0
      }),
    /must be finite/
  )
})

test('direct order-flow derivation preserves reset, sorting, cutoff, side and limit contracts', () => {
  const book = reconstructBook(
    {
      checkpoint: {
        asks: [
          [103, 0],
          [101, 2]
        ],
        bids: [[100, 3]]
      },
      groups: [
        [
          1_000_000,
          1,
          [
            [1, 99, 4],
            [1, 98, 1],
            [0, 102, 5],
            [0, 103, 2],
            [1, 100, 0]
          ]
        ],
        [2_000_000, 0, [[0, 104, 1]]]
      ]
    },
    1500
  )
  assert.deepEqual(book, {
    asks: [
      { amount: 5, price: 102 },
      { amount: 2, price: 103 }
    ],
    bids: [
      { amount: 4, price: 99 },
      { amount: 1, price: 98 }
    ],
    groupsApplied: 1
  })
  assert.deepEqual(reconstructBook({ groups: [] }, 0), {
    asks: [],
    bids: [],
    groupsApplied: 0
  })

  const trades = {
    trades: [
      [1_000_000, 1_000_100, 100, 2, 1],
      [1_200_000, 1_200_100, 99, 1, 0],
      [2_000_000, 2_000_100, 101, 3, 1]
    ]
  }
  assert.deepEqual(tradesThrough(trades, 1500, 1), [
    {
      amount: 1,
      localTimestampUs: 1_200_100,
      price: 99,
      side: 'sell',
      timestamp: 1200
    }
  ])
  assert.equal(tradesThrough(trades, 1500).at(-1).side, 'buy')
})

test('direct volume-profile derivation covers empty levels, merging, ties and both expansion edges', () => {
  assert.throws(() => deriveVolumeProfile(null), /must be an array/)
  assert.deepEqual(deriveVolumeProfile([{}]), { levels: [], poc: null, vah: null, val: null })

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
  assert.deepEqual(
    deriveVolumeProfile([
      {
        levels: [
          { ask: 4, bid: 0, price: 99 },
          { ask: 5, bid: 0, price: 100 },
          { ask: 1, bid: 0, price: 101 }
        ]
      }
    ]),
    {
      levels: [
        { ask: 4, bid: 0, price: 99 },
        { ask: 5, bid: 0, price: 100 },
        { ask: 1, bid: 0, price: 101 }
      ],
      poc: 100,
      vah: 100,
      val: 99
    }
  )
  assert.deepEqual(
    deriveVolumeProfile([
      {
        levels: [
          { ask: 1, bid: 0, price: 99 },
          { ask: 5, bid: 0, price: 100 },
          { ask: 4, bid: 0, price: 101 }
        ]
      }
    ]),
    {
      levels: [
        { ask: 1, bid: 0, price: 99 },
        { ask: 5, bid: 0, price: 100 },
        { ask: 4, bid: 0, price: 101 }
      ],
      poc: 100,
      vah: 101,
      val: 100
    }
  )
  assert.equal(
    deriveVolumeProfile([
      {
        levels: [
          { ask: 5, bid: 0, price: 100 },
          { ask: 5, bid: 0, price: 101 }
        ]
      }
    ]).poc,
    100
  )
  assert.deepEqual(
    deriveVolumeProfile([
      {
        levels: [
          { ask: 4, bid: 0, price: 99 },
          { ask: 5, bid: 0, price: 100 }
        ]
      }
    ]),
    {
      levels: [
        { ask: 4, bid: 0, price: 99 },
        { ask: 5, bid: 0, price: 100 }
      ],
      poc: 100,
      vah: 100,
      val: 99
    }
  )
  assert.deepEqual(profileThrough(bars, 0), bars[0].levels)
})

test('direct bar aggregation preserves identity, validation, buckets and profile fallbacks', () => {
  const original = [bar()]
  assert.equal(aggregateProfessionalBars(original, 5), original)
  assert.throws(() => aggregateProfessionalBars([], 4), /at least as large/)
  assert.throws(() => aggregateProfessionalBars([], 7.5), /integer/)
  assert.throws(() => aggregateProfessionalBars([], 7), /multiple/)

  const aggregated = aggregateProfessionalBars(
    [
      bar({ delta: 1, high: 102, low: 99, open: 100, timestamp: 0, volume: 2 }),
      bar({ close: 103, cvd: 2, delta: 1, high: 104, low: 100, timestamp: 300_000, volume: 3 }),
      bar({ close: 105, cvd: 4, high: 106, low: 102, timestamp: 900_000, volume: 4 })
    ],
    15
  )
  assert.equal(aggregated.length, 2)
  assert.deepEqual(
    aggregated.map(({ close, delta, high, low, open, poc, timestamp, vah, val, volume }) => ({
      close,
      delta,
      high,
      low,
      open,
      poc,
      timestamp,
      vah,
      val,
      volume
    })),
    [
      {
        close: 103,
        delta: 2,
        high: 104,
        low: 99,
        open: 100,
        poc: 103,
        timestamp: 0,
        vah: 103,
        val: 103,
        volume: 5
      },
      {
        close: 105,
        delta: 0,
        high: 106,
        low: 102,
        open: 100,
        poc: 105,
        timestamp: 900_000,
        vah: 105,
        val: 105,
        volume: 4
      }
    ]
  )
})

test('direct countdown derivation covers exact, fractional and negative timeframe boundaries', () => {
  const timestamp = Date.UTC(2019, 11, 1, 4, 2, 18, 250)
  assert.equal(formatCandleCloseCountdown(timestamp, 5), '02:42')
  assert.equal(formatCandleCloseCountdown(Date.UTC(2019, 11, 1, 4, 5), 5), '05:00')
  assert.equal(formatCandleCloseCountdown(-1, 5), '00:01')
  assert.throws(() => formatCandleCloseCountdown(Number.NaN, 5), /finite/)
  assert.throws(() => formatCandleCloseCountdown(timestamp, 1.5), /positive integer/)
  assert.throws(() => formatCandleCloseCountdown(timestamp, 0), /positive integer/)
})

test('direct professional view derivation handles empty and active partial bars without look-ahead', () => {
  const session = {
    barDurationMs: 300_000,
    bars: [
      bar({ timestamp: 0, volume: 4, vwap: 100 }),
      bar({ close: 101, open: 101, timestamp: 300_000, vwap: 101 })
    ],
    sessionStart: 0,
    tickSize: 0.01
  }
  const emptyChunk = {
    book: { checkpoint: { asks: [], bids: [] }, groups: [] },
    trades: { trades: [] }
  }
  const first = deriveProfessionalView(session, emptyChunk, 1_000)
  assert.equal(first.current.close, 100)
  assert.equal(first.current.volume, 0)
  assert.equal(first.change, 0)

  const activeFirst = deriveProfessionalView(
    session,
    {
      book: { groups: [] },
      trades: {
        trades: [
          [100_000, 100_100, 100, 1, 1],
          [200_000, 200_100, 101, 2, 1]
        ]
      }
    },
    1_000
  )
  assert.equal(activeFirst.current.poc, 101)
  assert.equal(activeFirst.current.cvd, 3)

  const second = deriveProfessionalView(session, emptyChunk, 301_000)
  assert.equal(second.current.close, 100)
  assert.equal(second.current.open, 100)
  assert.equal(second.current.volume, 0)

  const active = deriveProfessionalView(
    session,
    {
      book: { checkpoint: { asks: [[102, 1]], bids: [[99, 1]] }, groups: [] },
      trades: {
        trades: [
          [300_100_000, 300_100_100, 101.004, 2, 1],
          [300_200_000, 300_200_100, 101.004, 1, 0],
          [300_300_000, 300_300_100, 102, 3, 1],
          [302_000_000, 302_000_100, 120, 10, 1]
        ]
      }
    },
    301_000
  )
  assert.equal(active.current.open, 101.004)
  assert.equal(active.current.close, 102)
  assert.equal(active.current.high, 102)
  assert.equal(active.current.low, 101.004)
  assert.equal(active.current.volume, 6)
  assert.equal(active.current.delta, 4)
  assert.equal(active.current.cvd, 4)
  assert.equal(active.current.levels.length, 2)
  assert.equal(active.trades.length, 3)
  assert.equal(active.index, 1)
})
