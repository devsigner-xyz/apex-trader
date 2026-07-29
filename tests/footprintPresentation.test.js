import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDefaultFootprintSettings,
  deriveFootprintBar,
  formatCellValue,
  getDiagonalPair,
  normalizeFootprintSettings
} from '../src/services/footprintPresentation.js'

const rawBar = {
  high: 115,
  levels: [
    { ask: 2, bid: 10, price: 100 },
    { ask: 24, bid: 3, price: 105 },
    { ask: 18, bid: 2, price: 110 },
    { ask: 15, bid: 1, price: 115 }
  ],
  low: 100,
  timestamp: 1
}

test('derives exact diagonal imbalances, stacked runs, POC, and metrics from presentation settings', () => {
  const settings = {
    ...createDefaultFootprintSettings(5),
    imbalanceRatio: 2,
    stackedImbalanceSize: 2
  }
  const bar = deriveFootprintBar(rawBar, settings)

  assert.equal(bar.total, 75)
  assert.equal(bar.delta, 43)
  assert.equal(bar.pocPrice, 105)
  assert.equal(bar.levels.find((level) => level.price === 105).askImbalance, true)
  assert.equal(bar.levels.find((level) => level.price === 105).isStackedAskImbalance, true)
  assert.equal(bar.levels.find((level) => level.price === 110).isStackedAskImbalance, true)

  const diagonal = getDiagonalPair(bar.levels[1], bar.levels, settings)
  assert.deepEqual(diagonal.ask, {
    counterpart: 10,
    counterpartPrice: 100,
    ratio: 2.4,
    side: 'ask'
  })
})

test('reaggregates tick size and filters low-volume rows before visible metrics', () => {
  const settings = {
    ...createDefaultFootprintSettings(5),
    minimumVolume: 20,
    tickSize: 10
  }
  const bar = deriveFootprintBar(rawBar, settings)

  assert.deepEqual(
    bar.levels.map(({ ask, bid, price, total }) => ({ ask, bid, price, total })),
    [
      { ask: 26, bid: 13, price: 100, total: 39 },
      { ask: 33, bid: 3, price: 110, total: 36 }
    ]
  )
  assert.equal(bar.total, 75)
  assert.equal(bar.pocPrice, 100)
})

test('normalizes persisted controls and formats each selected mode', () => {
  assert.deepEqual(normalizeFootprintSettings({ mode: 'wrong', tickSize: 1 }, 5), {
    ...createDefaultFootprintSettings(5)
  })

  const level = { ask: 12.3456, bid: 4, delta: 8.3456, total: 16.3456 }
  assert.equal(formatCellValue(level, { format: 'compact', mode: 'bidAsk' }), '4.00 × 12.3')
  assert.equal(formatCellValue(level, { format: 'precise', mode: 'delta' }), 'Δ 8.346')
  assert.equal(formatCellValue(level, { format: 'compact', mode: 'volume' }), 'V 16.3')
})
