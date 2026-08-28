import assert from 'node:assert/strict'
import test from 'node:test'

import {
  requestedLiquidityChunkIndexes,
  resolveLiquidityWindow
} from '../src/components/professional/chart/liquidityViewport.js'

const minute = 60_000
const sessionStart = 1_000_000
const liquidityEnd = sessionStart + 24 * 60 * minute

test('pre-roll viewports do not request liquidity tiles', () => {
  const window = resolveLiquidityWindow({
    liquidityEnd,
    liquidityStart: sessionStart,
    replayTimestamp: sessionStart + 4 * 60 * minute,
    viewportEnd: sessionStart - minute,
    viewportStart: sessionStart - 60 * minute
  })
  assert.equal(window, null)
  assert.deepEqual(requestedLiquidityChunkIndexes(window, sessionStart), [])
})

test('liquidity window is clipped to explicit L2 and replay boundaries', () => {
  const window = resolveLiquidityWindow({
    liquidityEnd,
    liquidityStart: sessionStart,
    replayTimestamp: sessionStart + 31 * minute,
    viewportEnd: sessionStart + 60 * minute,
    viewportStart: sessionStart - 60 * minute
  })
  assert.deepEqual(window, {
    end: sessionStart + 31 * minute,
    start: sessionStart
  })
  assert.deepEqual(requestedLiquidityChunkIndexes(window, sessionStart), [0, 1, 2])
})

test('viewports after the replay cutoff do not request future liquidity', () => {
  const window = resolveLiquidityWindow({
    liquidityEnd,
    liquidityStart: sessionStart,
    replayTimestamp: sessionStart + 30 * minute,
    viewportEnd: sessionStart + 120 * minute,
    viewportStart: sessionStart + 60 * minute
  })
  assert.equal(window, null)
})

test('missing L2 boundaries degrade to an empty liquidity window', () => {
  assert.equal(
    resolveLiquidityWindow({
      liquidityEnd: undefined,
      liquidityStart: sessionStart,
      replayTimestamp: sessionStart + 30 * minute,
      viewportEnd: sessionStart + 60 * minute,
      viewportStart: sessionStart
    }),
    null
  )
})
