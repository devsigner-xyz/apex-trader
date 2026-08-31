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
    assert.equal(snapshot.footprintBars.length, 2)
    assert.equal(snapshot.stepProfileBars.length, 2)
    assert.equal(snapshot.footprintBars[0].levels.length, 9)
    assert.equal(snapshot.footprintBars[1].levels.length, 9)
    assert.equal(snapshot.stepProfileBars[0].levels.length, 9)
    assert.equal(snapshot.stepProfileBars[1].levels.length, 9)
    assert.equal(snapshot.profile.length, 9)
    assert.equal(snapshot.orderbook.asks.length, 3)
    assert.equal(snapshot.orderbook.bids.length, 3)
    assert.equal(snapshot.trades.length, 6)
    for (const bar of [...snapshot.footprintBars, ...snapshot.stepProfileBars]) {
      assert.equal(Number.isFinite(bar.delta), true)
      assert.equal(Number.isFinite(bar.volume), true)
    }
  }
})

test('keeps closed bars stable and updates only values that can change in an open candle', () => {
  const snapshots = Array.from({ length: marketPrimitivePhaseCount }, (_, phase) =>
    createMarketPrimitiveSnapshot(phase)
  )
  const [first, second] = snapshots

  assert.deepEqual(first.candles.slice(0, 4), second.candles.slice(0, 4))
  assert.notEqual(first.candles.at(-1).close, second.candles.at(-1).close)
  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.candles.at(-1).open),
    [21845, 21845, 21845, 21845]
  )
  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.candles.at(-1).high),
    [21854, 21854, 21854, 21854]
  )
  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.candles.at(-1).low),
    [21842, 21842, 21842, 21842]
  )
  for (const snapshot of snapshots) {
    const current = snapshot.candles.at(-1)
    assert.ok(current.high >= Math.max(current.open, current.close))
    assert.ok(current.low <= Math.min(current.open, current.close))
  }

  assert.deepEqual(first.footprintBars[0], second.footprintBars[0])
  assert.deepEqual(first.stepProfileBars[0], second.stepProfileBars[0])
  assert.notDeepEqual(first.footprintBars[1].levels, second.footprintBars[1].levels)
  assert.notDeepEqual(first.stepProfileBars[1].levels, second.stepProfileBars[1].levels)
  assert.notDeepEqual(first.profile, second.profile)
  assert.notDeepEqual(first.trades, second.trades)
})
