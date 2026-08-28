import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addTradeToBar,
  applyBookMessage,
  createBars,
  createBookState,
  finishBars,
  normalizeBookMessage,
  parseTradeHeader,
  parseTradeLine,
  sortedBook,
  valueArea
} from '../scripts/bybit-core.mjs'

function message({ asks = [], bids = [], seq = 10, type = 'delta', updateId = 2 } = {}) {
  return normalizeBookMessage({
    cts: 1000,
    data: {
      a: type === 'snapshot' ? Array.from({ length: 200 }, (_, i) => [`${101 + i}`, '1']) : asks,
      b: type === 'snapshot' ? Array.from({ length: 200 }, (_, i) => [`${300 - i}`, '1']) : bids,
      s: 'BTCUSDT',
      seq,
      u: updateId
    },
    topic: 'orderbook.200.BTCUSDT',
    ts: 1001,
    type
  })
}

test('parses the documented daily trade schema and the malformed monthly header safely', () => {
  const daily = parseTradeHeader('id,timestamp,price,volume,side,rpi')
  assert.deepEqual(parseTradeLine('1,1785456000346,64780.2,0.00016,buy,0', daily), {
    amount: 0.00016,
    id: 1,
    price: 64780.2,
    rpi: 0,
    side: 'buy',
    timestamp: 1785456000346
  })
  const monthly = parseTradeHeader('id,timestamp,price,volume,side')
  assert.equal(parseTradeLine('1,1782864000554,58631,0.00016,buy,0', monthly).rpi, 0)
})

test('reconstructs snapshot and deltas, including zero-amount deletions', () => {
  const state = createBookState()
  applyBookMessage(state, message({ seq: 10, type: 'snapshot', updateId: 100 }))
  applyBookMessage(
    state,
    message({
      asks: [['101', '0']],
      bids: [
        ['101', '0'],
        ['300.5', '2']
      ],
      seq: 11,
      updateId: 101
    })
  )
  const book = sortedBook(state)
  assert.equal(book.asks.some(([price]) => price === 101), false)
  assert.deepEqual(book.bids[0], [300.5, 2])
})

test('rejects update gaps instead of inventing depth', () => {
  const state = createBookState()
  applyBookMessage(state, message({ seq: 10, type: 'snapshot', updateId: 100 }))
  assert.throws(
    () => applyBookMessage(state, message({ seq: 12, updateId: 102 })),
    /update gap/
  )
})

test('computes POC and the contiguous 70 percent value area deterministically', () => {
  assert.deepEqual(
    valueArea([
      { ask: 1, bid: 1, price: 99 },
      { ask: 4, bid: 6, price: 100 },
      { ask: 2, bid: 2, price: 101 }
    ]),
    { poc: 100, vah: 101, val: 100 }
  )
})

test('aggregates aggressor trades into OHLCV, footprint, delta and CVD', () => {
  const bars = createBars(0, 2, 300_000)
  addTradeToBar(bars[0], { amount: 2, price: 100.04, side: 'buy' }, 0.1)
  addTradeToBar(bars[0], { amount: 1, price: 99.96, side: 'sell' }, 0.1)
  addTradeToBar(bars[1], { amount: 3, price: 101, side: 'sell' }, 0.1)
  const result = finishBars(bars)
  assert.deepEqual(result[0].levels, [{ ask: 2, bid: 1, price: 100 }])
  assert.equal(result[0].delta, 1)
  assert.equal(result[0].cvd, 1)
  assert.equal(result[1].cvd, -2)
  assert.equal(result[1].poc, 101)
})
