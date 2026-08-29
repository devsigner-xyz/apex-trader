import assert from 'node:assert/strict'
import test from 'node:test'
import { deriveFootprintBar } from '../src/services/footprintPresentation.js'

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
    format: 'compact',
    imbalanceRatio: 2,
    minimumVolume: 0,
    mode: 'bidAsk',
    scale: 'linear',
    stackedImbalanceSize: 2,
    tickSize: 5
  }
  const bar = deriveFootprintBar(rawBar, settings)

  assert.equal(bar.total, 75)
  assert.equal(bar.delta, 43)
  assert.equal(bar.pocPrice, 105)
  assert.equal(bar.levels.find((level) => level.price === 105).askImbalance, true)
  assert.equal(bar.levels.find((level) => level.price === 105).isStackedAskImbalance, true)
  assert.equal(bar.levels.find((level) => level.price === 110).isStackedAskImbalance, true)
})

test('reaggregates tick size and filters low-volume rows before visible metrics', () => {
  const settings = {
    format: 'compact',
    imbalanceRatio: 3,
    minimumVolume: 20,
    mode: 'bidAsk',
    scale: 'linear',
    stackedImbalanceSize: 3,
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
