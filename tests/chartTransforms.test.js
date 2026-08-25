import assert from 'node:assert/strict'
import test from 'node:test'
import {
  chartTypes,
  createFixedChartSlots,
  createHeikinAshiData,
  createLineData,
  createSmaData,
  createVolumeData
} from '../src/services/chartTransforms.js'

const candles = [
  [0, 100, 108, 99, 104],
  [300_000, 104, 110, 101, 102],
  [600_000, 102, 112, 100, 110]
]

test('keeps chart item spacing fixed when fewer items than slots are available', () => {
  const shortLayout = createFixedChartSlots(3, 12, 40, 960)
  const fullLayout = createFixedChartSlots(12, 12, 40, 960)

  assert.equal(shortLayout.step, 80)
  assert.deepEqual(shortLayout.positions, [80, 160, 240])
  assert.deepEqual(shortLayout.positions, fullLayout.positions.slice(0, 3))
  assert.equal(fullLayout.positions.at(-1), 960)
})

test('converts historical OHLCV bars to Lightweight Charts time-based series', () => {
  assert.deepEqual(chartTypes, ['candlestick', 'line', 'heikinAshi'])
  assert.deepEqual(createLineData(candles), [
    { time: 0, value: 104 },
    { time: 300, value: 102 },
    { time: 600, value: 110 }
  ])
  assert.deepEqual(createVolumeData([
    { direction: 'up', timestamp: 0, volume: 8 },
    { direction: 'down', timestamp: 300_000, volume: 11 }
  ], { down: '#a00', up: '#fff' }), [
    { color: '#fff', time: 0, value: 8 },
    { color: '#a00', time: 300, value: 11 }
  ])
})

test('derives Heikin Ashi and SMA values without fabricating additional market bars', () => {
  assert.deepEqual(createHeikinAshiData(candles), [
    { close: 102.75, high: 108, low: 99, open: 102, time: 0 },
    { close: 104.25, high: 110, low: 101, open: 102.375, time: 300 },
    { close: 106, high: 112, low: 100, open: 103.3125, time: 600 }
  ])
  assert.deepEqual(createSmaData(candles, 2), [
    { time: 300, value: 103 },
    { time: 600, value: 106 }
  ])
})
