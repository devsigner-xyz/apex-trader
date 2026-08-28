import assert from 'node:assert/strict'
import test from 'node:test'
import {
  aggregateDomOrderbook,
  aggregateDomSide,
  domPriceGroupings,
  formatDomGrouping
} from '../src/services/domPresentation.js'

test('exposes only useful BTCUSDT Spot grouping increments', () => {
  assert.deepEqual(domPriceGroupings, [0.1, 0.5, 1, 5])
})

test('groups asks upward and bids downward without crossing the source spread', () => {
  const orderbook = {
    asks: [
      { amount: 1, price: 100.01 },
      { amount: 2, price: 100.04 },
      { amount: 3, price: 100.05 },
      { amount: 4, price: 100.06 }
    ],
    bids: [
      { amount: 5, price: 99.99 },
      { amount: 6, price: 99.96 },
      { amount: 7, price: 99.95 },
      { amount: 8, price: 99.94 }
    ],
    groupsApplied: 12
  }

  assert.deepEqual(aggregateDomOrderbook(orderbook, 0.05), {
    asks: [
      { amount: 6, price: 100.05 },
      { amount: 4, price: 100.1 }
    ],
    bids: [
      { amount: 18, price: 99.95 },
      { amount: 8, price: 99.9 }
    ],
    groupsApplied: 12
  })
})

test('keeps grouped levels sorted and ignores invalid or empty source rows', () => {
  assert.deepEqual(
    aggregateDomSide(
      [
        { amount: 2, price: 101.24 },
        { amount: 0, price: 101.2 },
        { amount: 3, price: 101.01 },
        { amount: Number.NaN, price: 101.3 }
      ],
      'ask',
      0.5
    ),
    [{ amount: 5, price: 101.5 }]
  )
  assert.throws(() => aggregateDomSide([], 'wrong', 0.1), /ask or bid/)
  assert.throws(() => aggregateDomSide([], 'bid', 0), /positive finite/)
})

test('formats DOM grouping increments consistently for the settings UI', () => {
  assert.equal(formatDomGrouping(0.01), '0.01')
  assert.equal(formatDomGrouping(0.1), '0.10')
  assert.equal(formatDomGrouping(1), '1.00')
})
