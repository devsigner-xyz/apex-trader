import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clamp,
  derivePannedOffset,
  deriveZoomedViewport,
  normalizeWheelDelta,
  selectVisibleWindow
} from '../services/professionalChartGeometry.js'

export function useChartViewport({
  bars,
  defaultVisibleCount,
  limits,
  mode,
  plotRatio = 1,
  timeframe
}) {
  const [rightOffset, setRightOffset] = useState(0)
  const [visibleCount, setVisibleCount] = useState(defaultVisibleCount)
  const [followLatest, setFollowLatest] = useState(true)
  const [dragging, setDragging] = useState(false)
  const dragState = useRef(null)
  const previousBarCount = useRef(bars.length)
  const wheelState = useRef({ anchorRatio: 0.5, delta: 0, frame: null, kind: 'zoom' })
  const { maximumOffset, safeOffset, visible } = selectVisibleWindow(
    bars,
    visibleCount,
    rightOffset
  )
  const viewportState = useRef(null)
  viewportState.current = {
    barCount: bars.length,
    maximumOffset,
    rightOffset: safeOffset,
    visibleCount
  }

  const resetViewport = useCallback(() => {
    setVisibleCount(defaultVisibleCount)
    setRightOffset(0)
    setFollowLatest(true)
  }, [defaultVisibleCount])

  useEffect(() => {
    resetViewport()
  }, [mode, resetViewport, timeframe])

  useEffect(() => {
    if (rightOffset !== safeOffset) setRightOffset(safeOffset)
  }, [rightOffset, safeOffset])

  useEffect(() => {
    const addedBars = bars.length - previousBarCount.current
    if (addedBars > 0) {
      if (followLatest) setRightOffset(0)
      else setRightOffset((current) => current + addedBars)
    }
    previousBarCount.current = bars.length
  }, [bars.length, followLatest])

  useEffect(
    () => () => {
      if (wheelState.current.frame !== null) cancelAnimationFrame(wheelState.current.frame)
    },
    []
  )

  const handlePointerDown = (event) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = { offset: safeOffset, startX: event.clientX }
    setDragging(true)
  }

  const handlePointerMove = (event) => {
    if (!dragState.current) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const plotWidth = bounds.width * plotRatio
    const nextOffset = derivePannedOffset({
      maximumOffset,
      pixelDelta: dragState.current.startX - event.clientX,
      plotWidth,
      rightOffset: dragState.current.offset,
      visibleCount
    })
    if (nextOffset !== safeOffset) setFollowLatest(false)
    setRightOffset(nextOffset)
  }

  const stopDragging = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    dragState.current = null
    setDragging(false)
  }

  const handleWheel = (event) => {
    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const plotWidth = bounds.width * plotRatio
    const normalized = normalizeWheelDelta(event, plotWidth)
    const horizontal = event.shiftKey || Math.abs(normalized.x) > Math.abs(normalized.y)
    const kind = horizontal ? 'pan' : 'zoom'
    const accumulator = wheelState.current

    if (accumulator.kind !== kind) accumulator.delta = 0
    accumulator.kind = kind
    accumulator.delta += horizontal ? (event.shiftKey ? normalized.y : normalized.x) : normalized.y
    accumulator.anchorRatio = clamp((event.clientX - bounds.left) / Math.max(plotWidth, 1), 0, 1)

    if (accumulator.frame !== null) return
    accumulator.frame = requestAnimationFrame(() => {
      const { anchorRatio, delta, kind: action } = wheelState.current
      wheelState.current.delta = 0
      wheelState.current.frame = null
      const current = viewportState.current

      if (action === 'pan') {
        const nextOffset = derivePannedOffset({
          maximumOffset: current.maximumOffset,
          pixelDelta: delta,
          plotWidth,
          rightOffset: current.rightOffset,
          visibleCount: current.visibleCount
        })
        if (nextOffset !== current.rightOffset) {
          setRightOffset(nextOffset)
          setFollowLatest(false)
        }
        return
      }

      const next = deriveZoomedViewport({
        anchorRatio,
        barCount: current.barCount,
        delta,
        maximumVisibleCount: limits.maximum,
        minimumVisibleCount: limits.minimum,
        rightOffset: current.rightOffset,
        visibleCount: current.visibleCount
      })
      if (next.visibleCount === current.visibleCount) return
      setVisibleCount(next.visibleCount)
      setRightOffset(next.rightOffset)
      if (next.rightOffset > 0) setFollowLatest(false)
    })
  }

  const handleKeyDown = (event) => {
    let nextOffset
    if (event.key === 'ArrowLeft') nextOffset = clamp(safeOffset + 1, 0, maximumOffset)
    else if (event.key === 'ArrowRight') nextOffset = clamp(safeOffset - 1, 0, maximumOffset)
    else if (event.key === '0') resetViewport()
    else return

    if (nextOffset !== undefined && nextOffset !== safeOffset) {
      setRightOffset(nextOffset)
      setFollowLatest(false)
    }
    event.preventDefault()
  }

  return {
    dragging,
    followLatest,
    handleKeyDown,
    handlePointerDown,
    handlePointerMove,
    handleWheel,
    isAtLatest: safeOffset === 0,
    maximumOffset,
    resetViewport,
    safeOffset,
    stopDragging,
    visible,
    visibleCount
  }
}
