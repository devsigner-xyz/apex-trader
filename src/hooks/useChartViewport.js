import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clamp,
  derivePannedOffset,
  deriveZoomedViewport,
  isChartOffsetAtLatest,
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
  const wheelState = useRef({ delta: 0, frame: null, kind: 'zoom' })
  const viewportWindow = selectVisibleWindow(bars, visibleCount, rightOffset)
  const { maximumOffset, safeOffset } = viewportWindow
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
    const normalizedOffset = isChartOffsetAtLatest(safeOffset) ? 0 : safeOffset
    if (rightOffset !== normalizedOffset) setRightOffset(normalizedOffset)
    const nextFollowLatest = isChartOffsetAtLatest(normalizedOffset)
    if (followLatest !== nextFollowLatest) setFollowLatest(nextFollowLatest)
  }, [followLatest, rightOffset, safeOffset])

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
      const drag = dragState.current
      if (drag && drag.frame !== null) cancelAnimationFrame(drag.frame)
    },
    []
  )

  const applyOffset = (nextOffset) => {
    const normalizedOffset = isChartOffsetAtLatest(nextOffset) ? 0 : nextOffset
    setRightOffset(normalizedOffset)
    setFollowLatest(isChartOffsetAtLatest(normalizedOffset))
  }

  const applyDragPosition = (drag) => {
    const current = viewportState.current
    const nextOffset = derivePannedOffset({
      maximumOffset: current.maximumOffset,
      pixelDelta: drag.startX - drag.latestX,
      plotWidth: drag.plotWidth,
      rightOffset: drag.offset,
      visibleCount: current.visibleCount
    })
    if (nextOffset !== drag.appliedOffset) {
      drag.appliedOffset = nextOffset
      applyOffset(nextOffset)
    }
  }

  const handlePointerDown = (event) => {
    if (event.button !== 0) return
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    const bounds = event.currentTarget.getBoundingClientRect()
    dragState.current = {
      frame: null,
      appliedOffset: safeOffset,
      latestX: event.clientX,
      offset: safeOffset,
      plotWidth: bounds.width * plotRatio,
      startX: event.clientX
    }
    setDragging(true)
  }

  const handlePointerMove = (event) => {
    const drag = dragState.current
    if (!drag) return
    if ((event.buttons & 1) === 0) {
      stopDragging(event)
      return
    }
    drag.latestX = event.clientX
    const bounds = event.currentTarget.getBoundingClientRect()
    drag.plotWidth = bounds.width * plotRatio
    if (drag.frame !== null) return
    drag.frame = requestAnimationFrame(() => {
      const pendingDrag = dragState.current
      if (!pendingDrag) return
      pendingDrag.frame = null
      applyDragPosition(pendingDrag)
    })
  }

  const stopDragging = (event) => {
    const drag = dragState.current
    if (drag && drag.frame !== null) {
      cancelAnimationFrame(drag.frame)
      drag.frame = null
      applyDragPosition(drag)
    }
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
    if (accumulator.frame !== null) return
    accumulator.frame = requestAnimationFrame(() => {
      const { delta, kind: action } = wheelState.current
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
          applyOffset(nextOffset)
        }
        return
      }

      const next = deriveZoomedViewport({
        anchorRatio: 1,
        barCount: current.barCount,
        delta,
        maximumVisibleCount: limits.maximum,
        minimumVisibleCount: limits.minimum,
        rightOffset: current.rightOffset,
        visibleCount: current.visibleCount
      })
      if (next.visibleCount === current.visibleCount) return
      setVisibleCount(next.visibleCount)
      applyOffset(next.rightOffset)
    })
  }

  const handleKeyDown = (event) => {
    let nextOffset
    if (event.key === 'ArrowLeft') nextOffset = clamp(safeOffset + 1, 0, maximumOffset)
    else if (event.key === 'ArrowRight') nextOffset = clamp(safeOffset - 1, 0, maximumOffset)
    else if (event.key === '0') resetViewport()
    else return

    if (nextOffset !== undefined && nextOffset !== safeOffset) {
      applyOffset(nextOffset)
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
    endIndex: viewportWindow.endIndex,
    isAtLatest: isChartOffsetAtLatest(safeOffset),
    logicalEnd: viewportWindow.logicalEnd,
    logicalStart: viewportWindow.logicalStart,
    maximumOffset,
    phase: viewportWindow.phase,
    renderBars: viewportWindow.renderBars,
    resetViewport,
    safeOffset,
    startIndex: viewportWindow.startIndex,
    stopDragging,
    visible: viewportWindow.visible,
    visibleCount
  }
}
