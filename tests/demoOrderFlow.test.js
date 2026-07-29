import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deriveOrderFlowFromTrades,
  demoOrderFlowScenarios,
  generateDemoBookSnapshots,
  generateDemoExecutedTrades,
  generateDemoOrderFlow
} from '../src/services/demoOrderFlow.js'

const BAR_DURATION_MS = 5 * 60 * 1000
const START_TIMESTAMP = Date.UTC(2023, 0, 1, 9, 0)

test('derives footprint, delta, CVD, tape, profile, POC, and imbalances from executed trades', () => {
  const trades = [
    { timestamp: START_TIMESTAMP + 1, price: 90, qty: 1, aggressor: 'sell' },
    { timestamp: START_TIMESTAMP + 2, price: 100, qty: 9, aggressor: 'buy' },
    { timestamp: START_TIMESTAMP + 3, price: 100, qty: 2, aggressor: 'sell' },
    { timestamp: START_TIMESTAMP + 4, price: 110, qty: 3, aggressor: 'buy' },
    { timestamp: START_TIMESTAMP + BAR_DURATION_MS + 1, price: 100, qty: 4, aggressor: 'sell' }
  ]

  const derived = deriveOrderFlowFromTrades(trades, {
    barDurationMs: BAR_DURATION_MS,
    tickSize: 10
  })
  const firstBar = derived.bars[0]
  const firstPoc = firstBar.levels.find((level) => level.isPoc)
  const levelAt100 = firstBar.levels.find((level) => level.price === 100)

  assert.equal(firstBar.total, 15)
  assert.equal(firstBar.delta, 9)
  assert.equal(firstBar.open, 90)
  assert.equal(firstBar.close, 110)
  assert.equal(firstBar.low, 90)
  assert.equal(firstBar.high, 110)
  assert.deepEqual(levelAt100, {
    price: 100,
    bid: 2,
    ask: 9,
    total: 11,
    delta: 7,
    askImbalance: true,
    bidImbalance: false,
    isPoc: true
  })
  assert.equal(firstPoc.price, 100)
  assert.equal(derived.volumeProfile.pocPrice, 100)
  assert.equal(derived.tape.at(-1).cvd, derived.delta)
  assert.equal(derived.cvd.at(-1).value, derived.delta)

  for (const bar of derived.bars) {
    assert.equal(
      bar.total,
      bar.levels.reduce((sum, level) => sum + level.total, 0)
    )
    assert.equal(
      bar.delta,
      bar.levels.reduce((sum, level) => sum + level.delta, 0)
    )
    assert.equal(bar.pocPrice, bar.levels.find((level) => level.isPoc).price)
  }
})

test('synthetic executions and book snapshots are reproducible independent sources', () => {
  const options = { scenario: 'breakout', seed: 42, barCount: 3, levelsPerBar: 8 }
  const executions = generateDemoExecutedTrades(options)
  const snapshots = generateDemoBookSnapshots({ seed: 42, snapshotCount: 2 })

  assert.deepEqual(executions, generateDemoExecutedTrades(options))
  assert.deepEqual(snapshots, generateDemoBookSnapshots({ seed: 42, snapshotCount: 2 }))
  assert.notDeepEqual(snapshots, generateDemoBookSnapshots({ seed: 43, snapshotCount: 2 }))

  for (const snapshot of snapshots) {
    assert.equal(snapshot.bids.length, 20)
    assert.equal(snapshot.asks.length, 20)
    assert.ok(
      snapshot.bids.every((row, index, rows) => index === 0 || rows[index - 1].price > row.price)
    )
    assert.ok(
      snapshot.asks.every((row, index, rows) => index === 0 || rows[index - 1].price < row.price)
    )
  }
})

test('legacy footprint generator remains deterministic and derives every displayed level from trades', () => {
  const options = { scenario: 'absorption', seed: 7, barCount: 4, levelsPerBar: 8 }
  const model = generateDemoOrderFlow(options)

  assert.deepEqual(model, generateDemoOrderFlow(options))
  assert.equal(model.bars.length, options.barCount)
  assert.ok(model.executedTrades.length > 0)
  assert.equal(model.tape.length, model.executedTrades.length)
  assert.equal(
    model.bars.reduce((sum, bar) => sum + bar.total, 0),
    model.total
  )

  for (const bar of model.bars) {
    const barTrades = model.executedTrades.filter(
      (trade) =>
        trade.timestamp >= bar.timestamp && trade.timestamp < bar.timestamp + BAR_DURATION_MS
    )
    assert.equal(
      bar.total,
      barTrades.reduce((sum, trade) => sum + trade.qty, 0)
    )
    assert.equal(
      bar.delta,
      barTrades.reduce(
        (sum, trade) => sum + (trade.aggressor === 'buy' ? trade.qty : -trade.qty),
        0
      )
    )
    assert.ok(barTrades.every((trade) => trade.price >= bar.low && trade.price <= bar.high))
  }
})

test('every demo scenario preserves footprint invariants', () => {
  for (const { id: scenario } of demoOrderFlowScenarios) {
    const model = generateDemoOrderFlow({ scenario, seed: 20260728 })

    assert.ok(model.executedTrades.every((trade) => trade.qty > 0))
    assert.equal(model.cvd.at(-1).value, model.delta)

    for (const bar of model.bars) {
      assert.equal(bar.levels.filter((level) => level.isPoc).length, 1)
      assert.equal(bar.pocPrice, bar.levels.find((level) => level.isPoc).price)
      assert.equal(
        bar.total,
        bar.levels.reduce((sum, level) => {
          assert.equal(level.total, level.bid + level.ask)
          assert.equal(level.delta, level.ask - level.bid)
          return sum + level.total
        }, 0)
      )
    }
  }
})
