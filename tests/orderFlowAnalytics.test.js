import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deriveCvdSeries,
  deriveTimeAndSalesRows,
  isExecutionSelectionMatch
} from '../src/services/orderFlowAnalytics.js'

const START = Date.UTC(2019, 11, 1, 9, 0)
const BAR_MS = 5 * 60 * 1000

const bars = [
  { timestamp: START, delta: 4 },
  { timestamp: START + BAR_MS, delta: -3 },
  { timestamp: START + BAR_MS * 2, delta: 8 }
]

const trades = [
  { timestamp: START + 2_200, price: 7_210, amount: 2, side: 'buy' },
  { timestamp: START + 2_700, price: 7_210, amount: 3, side: 'buy' },
  { timestamp: START + 3_100, price: 7_205, amount: 5, side: 'sell' },
  { timestamp: START + BAR_MS + 100, price: 7_215, amount: 4, side: 'buy' }
]

test('derives CVD from bar deltas with session, window and manual reset anchors', () => {
  assert.deepEqual(
    deriveCvdSeries(bars, { reset: 'session' }).map(({ delta, value }) => ({ delta, value })),
    [
      { delta: 4, value: 4 },
      { delta: -3, value: 1 },
      { delta: 8, value: 9 }
    ]
  )
  assert.deepEqual(
    deriveCvdSeries(bars, { reset: 'window', windowBars: 2 }).map(({ delta, value }) => ({
      delta,
      value
    })),
    [
      { delta: -3, value: -3 },
      { delta: 8, value: 5 }
    ]
  )
  assert.deepEqual(
    deriveCvdSeries(bars, { manualResetTimestamp: START + BAR_MS, reset: 'manual' }).map(
      ({ delta, value }) => ({ delta, value })
    ),
    [
      { delta: -3, value: -3 },
      { delta: 8, value: 5 }
    ]
  )
})

test('filters and groups Time & Sales rows without changing the execution source fields', () => {
  const priceGrouped = deriveTimeAndSalesRows(trades, {
    grouping: 'price',
    maximumPrice: 7_210,
    minimumPrice: 7_200,
    minimumSize: 2,
    side: 'buy'
  })

  assert.equal(priceGrouped.length, 1)
  assert.deepEqual(
    {
      amount: priceGrouped[0].amount,
      count: priceGrouped[0].count,
      price: priceGrouped[0].price,
      side: priceGrouped[0].side
    },
    { amount: 5, count: 2, price: 7_210, side: 'buy' }
  )

  const secondGrouped = deriveTimeAndSalesRows(trades, { grouping: 'second' })
  assert.equal(secondGrouped.length, 3)
  assert.equal(secondGrouped[1].amount, 5)
  assert.equal(secondGrouped[1].side, 'sell')
})

test('matches tape, footprint and price selection by its source execution coordinates', () => {
  const selection = { barTimestamp: START, price: 7_210, side: 'buy' }
  assert.equal(isExecutionSelectionMatch(trades[0], selection, BAR_MS), true)
  assert.equal(isExecutionSelectionMatch(trades[2], selection, BAR_MS), false)
  assert.equal(
    isExecutionSelectionMatch(
      { timestamp: START + BAR_MS, price: 7_210, amount: 1, side: 'buy' },
      selection,
      BAR_MS
    ),
    false
  )
})
