import { chunkIndexFor } from '../../../services/proPlayback.js'

export function resolveLiquidityWindow({
  liquidityEnd,
  liquidityStart,
  replayTimestamp,
  viewportEnd,
  viewportStart
}) {
  if (
    ![
      liquidityEnd,
      liquidityStart,
      replayTimestamp,
      viewportEnd,
      viewportStart
    ].every(Number.isFinite)
  )
    return null
  const start = Math.max(viewportStart, liquidityStart)
  const end = Math.min(viewportEnd, replayTimestamp, liquidityEnd)
  return end > start ? { end, start } : null
}

export function requestedLiquidityChunkIndexes(window, sessionStart) {
  if (!window) return []
  const first = chunkIndexFor(window.start, sessionStart)
  const last = chunkIndexFor(window.end - 1, sessionStart)
  return Array.from({ length: last - first + 1 }, (_, offset) => first + offset)
}
