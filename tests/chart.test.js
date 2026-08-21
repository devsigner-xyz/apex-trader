import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregateChartData } from '../src/services/chartAggregation.js'

test('aggregates five-minute candles and volumes into the selected chart timeframe', () => {
  const candlesticks = [
    [0, 100, 104, 99, 102],
    [5 * 60_000, 102, 106, 101, 105],
    [10 * 60_000, 105, 108, 103, 104],
    [15 * 60_000, 104, 109, 102, 108]
  ]
  const volumes = [
    [0, 3],
    [5 * 60_000, 5],
    [10 * 60_000, 7],
    [15 * 60_000, 11]
  ]

  assert.deepEqual(aggregateChartData(candlesticks, volumes, 15), {
    candlesticks: [
      [0, 100, 108, 99, 104],
      [15 * 60_000, 104, 109, 102, 108]
    ],
    volumePoints: [
      { direction: 'up', timestamp: 0, volume: 15 },
      { direction: 'up', timestamp: 15 * 60_000, volume: 11 }
    ]
  })
})
