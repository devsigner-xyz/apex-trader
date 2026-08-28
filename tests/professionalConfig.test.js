import assert from 'node:assert/strict'
import test from 'node:test'

import {
  candleTimeframes,
  footprintTimeframes,
  stepProfileTimeframes,
  timeframesForMode
} from '../src/components/professional/config.js'

test('professional modes expose only timeframes backed by their data contract', () => {
  assert.deepEqual(
    candleTimeframes.map(({ minutes }) => minutes),
    [5, 15, 30, 60, 240, 1440]
  )
  assert.deepEqual(
    stepProfileTimeframes.map(({ minutes }) => minutes),
    [5, 15, 30, 60, 240]
  )
  assert.deepEqual(
    footprintTimeframes.map(({ minutes }) => minutes),
    [60, 240]
  )
  assert.equal(timeframesForMode('candles'), candleTimeframes)
  assert.equal(timeframesForMode('footprint'), footprintTimeframes)
  assert.equal(timeframesForMode('step-profile'), stepProfileTimeframes)
})
