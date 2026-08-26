import assert from 'node:assert/strict'
import test from 'node:test'

import {
  chartTimeframes,
  footprintTimeframes
} from '../src/components/professional/config.js'

test('professional timeframes stop at four hours for the one-day session', () => {
  assert.deepEqual(
    chartTimeframes.map(({ minutes }) => minutes),
    [5, 15, 30, 60, 240]
  )
  assert.deepEqual(
    footprintTimeframes.map(({ minutes }) => minutes),
    [60, 240]
  )
})
