import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clamp,
  derivePriceScaleFactor,
  deriveScaledPriceDomain
} from '../services/professionalChartGeometry.js'

export function usePriceAxisScale({ automaticDomain, mode, timeframe }) {
  const [scaleFactor, setScaleFactor] = useState(1)
  const [resizing, setResizing] = useState(false)
  const dragState = useRef(null)
  const domain = deriveScaledPriceDomain(automaticDomain, scaleFactor)

  const resetPriceScale = useCallback(() => {
    dragState.current = null
    setResizing(false)
    setScaleFactor(1)
  }, [])

  useEffect(() => {
    resetPriceScale()
  }, [mode, resetPriceScale, timeframe])

  const handlePointerDown = (event) => {
    if (event.button !== 0) return
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = { initialScaleFactor: scaleFactor, startY: event.clientY }
    setResizing(true)
  }

  const handlePointerMove = (event) => {
    if (!dragState.current) return
    event.stopPropagation()
    setScaleFactor(
      derivePriceScaleFactor(
        dragState.current.initialScaleFactor,
        event.clientY - dragState.current.startY
      )
    )
  }

  const stopResizing = (event) => {
    event.stopPropagation()
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    dragState.current = null
    setResizing(false)
  }

  const handleDoubleClick = (event) => {
    event.stopPropagation()
    resetPriceScale()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowUp') setScaleFactor((current) => clamp(current / 1.1, 0.25, 4))
    else if (event.key === 'ArrowDown') setScaleFactor((current) => clamp(current * 1.1, 0.25, 4))
    else if (event.key === '0') resetPriceScale()
    else return
    event.stopPropagation()
    event.preventDefault()
  }

  return {
    domain,
    handleDoubleClick,
    handleKeyDown,
    handlePointerDown,
    handlePointerMove,
    resetPriceScale,
    resizing,
    scaleFactor,
    stopResizing
  }
}
