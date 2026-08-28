import assert from 'node:assert/strict'
import test from 'node:test'
import { applyBookGroup, createBookState, sortedBook, valueArea } from '../scripts/tardis-core.mjs'

test('L2 reconstruction ignores deltas before the first snapshot', () => {
  const state = createBookState()
  const result = applyBookGroup(state, [
    { amount: 2, isSnapshot: false, price: 100, side: 'bid' }
  ])
  assert.deepEqual(result, { applied: false, reset: false })
  assert.deepEqual(sortedBook(state), { asks: [], bids: [] })
})

test('L2 reconstruction applies a timestamp group atomically and deletes zero quantities', () => {
  const state = createBookState()
  applyBookGroup(state, [
    { amount: 2, isSnapshot: true, price: 100, side: 'bid' },
    { amount: 3, isSnapshot: true, price: 101, side: 'ask' }
  ])
  applyBookGroup(state, [
    { amount: 0, isSnapshot: false, price: 100, side: 'bid' },
    { amount: 4, isSnapshot: false, price: 99, side: 'bid' },
    { amount: 1, isSnapshot: false, price: 102, side: 'ask' }
  ])
  assert.deepEqual(sortedBook(state), {
    asks: [[101, 3], [102, 1]],
    bids: [[99, 4]]
  })
})

test('a later snapshot resets both sides and sorting remains deterministic', () => {
  const state = createBookState()
  applyBookGroup(state, [
    { amount: 2, isSnapshot: true, price: 100, side: 'bid' },
    { amount: 3, isSnapshot: true, price: 101, side: 'ask' }
  ])
  const result = applyBookGroup(state, [
    { amount: 7, isSnapshot: true, price: 98, side: 'bid' },
    { amount: 8, isSnapshot: true, price: 103, side: 'ask' }
  ])
  assert.deepEqual(result, { applied: true, reset: true })
  assert.deepEqual(sortedBook(state), { asks: [[103, 8]], bids: [[98, 7]] })
})

test('value area expands from POC until it covers the configured volume fraction', () => {
  assert.deepEqual(
    valueArea([
      { ask: 1, bid: 1, price: 99 },
      { ask: 4, bid: 6, price: 100 },
      { ask: 2, bid: 2, price: 101 }
    ]),
    { poc: 100, vah: 101, val: 100 }
  )
})
