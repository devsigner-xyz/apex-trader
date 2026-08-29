import assert from 'node:assert/strict'
import test from 'node:test'

import {
  chartFutureSpaceRatio,
  chartTimeframes,
  defaultChartTimeframe,
  footprintTimeframes
} from '../src/components/professional/config.js'

test('professional chart defaults to thirty minutes and stops at one hour', () => {
  assert.equal(chartFutureSpaceRatio, 0.3)
  assert.equal(defaultChartTimeframe, 30)
  assert.deepEqual(
    chartTimeframes.map(({ minutes }) => minutes),
    [5, 15, 30, 60]
  )
  assert.deepEqual(
    footprintTimeframes.map(({ minutes }) => minutes),
    [60]
  )
})
