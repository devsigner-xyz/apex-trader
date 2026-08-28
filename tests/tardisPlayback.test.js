import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  advancePlaybackTime,
  derivePlaybackView,
  normalizeTardisSession
} from '../src/services/tardisPlayback.js'

const rawSession = JSON.parse(
  await readFile(
    new URL('../public/data/tardis/binance-btcusdt-2019-12-01.json', import.meta.url),
    'utf8'
  )
)
const session = normalizeTardisSession(rawSession)

test('normalizes the checked-in Tardis session with complete UTC coverage', () => {
  assert.equal(session.schema, 'apextrader.tardis-session/v1')
  assert.equal(new Date(session.sessionStart).toISOString(), '2019-12-01T00:00:00.000Z')
  assert.equal(new Date(session.sessionEndExclusive).toISOString(), '2019-12-02T00:00:00.000Z')
  assert.equal(session.bars.length, 288)
  assert.equal(session.domSnapshots.length, 289)
  assert.equal(session.playbackStart, session.domSnapshots[0].timestamp)
  assert.ok(session.playbackStart > session.sessionStart)

  for (const [index, bar] of session.bars.entries()) {
    assert.equal(bar.timestamp, session.sessionStart + index * session.barDurationMs)
    assert.ok(bar.volume >= 0)
    assert.ok(bar.high >= bar.low)
    assert.ok(bar.high >= bar.open && bar.high >= bar.close)
    assert.ok(bar.low <= bar.open && bar.low <= bar.close)
    assert.equal(
      bar.volume,
      Number(bar.levels.reduce((total, level) => total + level.bid + level.ask, 0).toFixed(8))
    )
    assert.ok(
      bar.tape.every(
        (trade, tradeIndex) =>
          trade.amount > 0 &&
          trade.timestamp >= bar.timestamp &&
          trade.timestamp < bar.timestamp + session.barDurationMs &&
          trade.price >= bar.low &&
          trade.price <= bar.high &&
          (tradeIndex === 0 || trade.timestamp >= bar.tape[tradeIndex - 1].timestamp)
      )
    )
    assert.ok(bar.tape.reduce((total, trade) => total + trade.amount, 0) <= bar.volume)
  }

  for (const snapshot of session.domSnapshots) {
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

test('playback wraps at the UTC session boundary and synchronizes its derived views', () => {
  const lastMoment = session.sessionEndExclusive - 1
  assert.equal(advancePlaybackTime(lastMoment, 10, session), session.playbackStart + 9)

  const view = derivePlaybackView(session, session.sessionStart + 3 * session.barDurationMs + 1)
  assert.ok(view.orderbook.timestamp <= view.currentTimestamp)
  assert.equal(view.currentBar.timestamp, session.bars[3].timestamp)
  assert.equal(view.cvd, session.bars[3].cvd)
  assert.equal(view.orderbook.bids.length, 20)
  assert.equal(view.orderbook.asks.length, 20)
  assert.ok(view.executedTrades.length > 0)
  assert.equal(view.cvdBars.at(-1).timestamp, view.currentBar.timestamp)
  assert.equal(
    Number(view.cvdBars.reduce((total, bar) => total + bar.delta, 0).toFixed(8)),
    view.cvd
  )
  assert.equal(view.candlesticks.length, 4)
  assert.equal(view.volumes.length, 4)
  assert.equal(view.profile.pocPrice, view.profile.levels.find((level) => level.isPoc).price)
  assert.equal(
    view.profile.total,
    Number(view.profile.levels.reduce((total, level) => total + level.total, 0).toFixed(8))
  )
  assert.equal(view.footprintBars.at(-1).timestamp, view.currentBar.timestamp)
})
