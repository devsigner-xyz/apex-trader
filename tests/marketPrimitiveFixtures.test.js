import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createMarketPrimitiveSnapshot,
  marketPrimitivePhaseCount,
  normalizeMarketPrimitivePhase
} from '../src/components/landing/marketPrimitiveFixtures.js'

test('normalizes animation phases without introducing random state', () => {
  assert.equal(marketPrimitivePhaseCount, 4)
  assert.equal(normalizeMarketPrimitivePhase(0), 0)
  assert.equal(normalizeMarketPrimitivePhase(5), 1)
  assert.equal(normalizeMarketPrimitivePhase(-1), 3)
  assert.equal(normalizeMarketPrimitivePhase(Number.NaN), 0)
})

test('keeps every isolated market primitive intentionally compact', () => {
  for (let phase = 0; phase < marketPrimitivePhaseCount; phase += 1) {
    const snapshot = createMarketPrimitiveSnapshot(phase)
    assert.equal(snapshot.phase, phase)
    assert.equal(snapshot.candles.length, 5)
    assert.equal(snapshot.footprintBar.levels.length, 9)
    assert.equal(snapshot.stepProfileBar.levels.length, 9)
    assert.equal(snapshot.profile.length, 9)
    assert.equal(snapshot.orderbook.asks.length, 3)
    assert.equal(snapshot.orderbook.bids.length, 3)
    assert.equal(snapshot.trades.length, 3)
  }
})

test('updates only the current candle while completed candle history remains stable', () => {
  const first = createMarketPrimitiveSnapshot(0)
  const second = createMarketPrimitiveSnapshot(1)

  assert.deepEqual(first.candles.slice(0, 4), second.candles.slice(0, 4))
  assert.notEqual(first.candles.at(-1).close, second.candles.at(-1).close)
  assert.notDeepEqual(first.footprintBar.levels, second.footprintBar.levels)
  assert.notDeepEqual(first.profile, second.profile)
  assert.notDeepEqual(first.trades, second.trades)
})
