import assert from 'node:assert/strict'
import test from 'node:test'
import { createFixedChartSlots } from '../src/services/chartTransforms.js'

test('keeps chart item spacing fixed when fewer items than slots are available', () => {
  const shortLayout = createFixedChartSlots(3, 12, 40, 960)
  const fullLayout = createFixedChartSlots(12, 12, 40, 960)

  assert.equal(shortLayout.step, 80)
  assert.deepEqual(shortLayout.positions, [80, 160, 240])
  assert.deepEqual(shortLayout.positions, fullLayout.positions.slice(0, 3))
  assert.equal(fullLayout.positions.at(-1), 960)
})
