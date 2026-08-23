import assert from 'node:assert/strict'
import test from 'node:test'
import { deriveProfessionalView, reconstructBook } from '../src/services/proPlayback.js'

test('browser L2 reconstruction applies only groups at or before the shared clock', () => {
  const chunk = {
    checkpoint: { asks: [[101, 2]], bids: [[100, 3]] },
    groups: [
      [1_000_000, 0, [[1, 100, 0], [1, 99, 4]]],
      [2_000_000, 0, [[0, 101, 0], [0, 102, 5]]]
    ]
  }
  assert.deepEqual(reconstructBook(chunk, 1500), {
    asks: [{ amount: 2, price: 101 }],
    bids: [{ amount: 4, price: 99 }],
    groupsApplied: 1
  })
})

test('active OHLC and footprint do not look ahead beyond playback time', () => {
  const session = {
    barDurationMs: 300_000,
    bars: [{ close: 100, cvd: 0, delta: 0, high: 100, levels: [], low: 100, open: 100, poc: 100, timestamp: 0, vah: 100, val: 100, volume: 0, vwap: 100 }],
    sessionStart: 0,
    tickSize: 0.01
  }
  const chunk = {
    book: { checkpoint: { asks: [[101, 1]], bids: [[99, 1]] }, groups: [] },
    trades: { trades: [[1_000_000, 1_000_000, 100, 2, 1], [2_000_000, 2_000_000, 105, 3, 0]] }
  }
  const view = deriveProfessionalView(session, chunk, 1500)
  assert.equal(view.current.close, 100)
  assert.equal(view.current.high, 100)
  assert.equal(view.current.volume, 2)
  assert.equal(view.trades.length, 1)
})
