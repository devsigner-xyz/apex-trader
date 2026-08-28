import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { chunkIndexFor, loadLiquidityChunk } from '../../../services/proPlayback.js'
import { createLiquidityColorLut } from '../../../services/liquidityHeatmap.js'
import { chartDimensions } from '../config.js'
import {
  requestedLiquidityChunkIndexes,
  resolveLiquidityWindow
} from './liquidityViewport.js'

const { mainBottom, mainTop, priceChartHeight } = chartDimensions

export default function LiquidityHeatmapLayer({
  enabled,
  intensity,
  liquidityEnd,
  liquidityStart,
  priceDomain,
  replayTimestamp,
  sessionStart,
  viewportEnd,
  viewportStart
}) {
  const canvasRef = useRef(null)
  const renderKeyRef = useRef('')
  const [canvasSize, setCanvasSize] = useState({ height: 0, width: 0 })
  const [status, setStatus] = useState('idle')
  const [tiles, setTiles] = useState(new Map())
  const liquidityWindow = useMemo(
    () =>
      enabled
        ? resolveLiquidityWindow({
            liquidityEnd,
            liquidityStart,
            replayTimestamp,
            viewportEnd,
            viewportStart
          })
        : null,
    [enabled, liquidityEnd, liquidityStart, replayTimestamp, viewportEnd, viewportStart]
  )
  const indexes = useMemo(
    () => requestedLiquidityChunkIndexes(liquidityWindow, sessionStart),
    [liquidityWindow, sessionStart]
  )
  const indexKey = indexes.join(',')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(1, Math.round(entry.contentRect.width))
      const height = Math.max(1, Math.round(entry.contentRect.height))
      setCanvasSize((current) =>
        current.width === width && current.height === height ? current : { height, width }
      )
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!enabled || indexes.length === 0) {
      setStatus('idle')
      setTiles(new Map())
      return undefined
    }
    let current = true
    setStatus('loading')
    Promise.all(indexes.map(async (index) => [index, await loadLiquidityChunk(index)]))
      .then((entries) => {
        if (!current) return
        setTiles(new Map(entries))
        setStatus('ready')
      })
      .catch(() => {
        if (current) setStatus('error')
      })
    return () => {
      current = false
    }
  }, [enabled, indexKey])

  useEffect(() => {
    const canvas = canvasRef.current
    const { height, width } = canvasSize
    if (!canvas || width < 1 || height < 1) return
    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return

    if (!enabled || status !== 'ready' || tiles.size === 0) {
      context.clearRect(0, 0, width, height)
      renderKeyRef.current = ''
      return
    }

    if (!liquidityWindow) {
      context.clearRect(0, 0, width, height)
      renderKeyRef.current = ''
      return
    }

    const startPixel = Math.max(
      0,
      Math.floor(
        ((liquidityWindow.start - viewportStart) / (viewportEnd - viewportStart)) * width
      )
    )
    const endPixel = Math.min(
      width,
      Math.ceil(((liquidityWindow.end - viewportStart) / (viewportEnd - viewportStart)) * width)
    )
    const renderKey = [
      width,
      height,
      viewportStart,
      viewportEnd,
      priceDomain.low,
      priceDomain.high,
      intensity,
      startPixel,
      endPixel,
      indexKey
    ].join(':')
    if (renderKeyRef.current === renderKey) return
    renderKeyRef.current = renderKey

    const firstTile = tiles.values().next().value
    const lut = createLiquidityColorLut({
      amountScale: firstTile.amountScale,
      intensity,
      normalizationMaxAmount: firstTile.normalizationMaxAmount
    })
    const image = context.createImageData(width, height)
    const top = Math.max(0, Math.floor((mainTop / priceChartHeight) * height))
    const bottom = Math.min(height, Math.ceil((mainBottom / priceChartHeight) * height))
    const priceIndexes = new Int32Array(bottom - top)
    for (let y = top; y < bottom; y += 1) {
      const chartY = (y / height) * priceChartHeight
      const price =
        priceDomain.high - ((chartY - mainTop) / (mainBottom - mainTop)) * priceDomain.range
      priceIndexes[y - top] = Math.floor((price - firstTile.priceMin) / firstTile.priceStep)
    }

    for (let x = startPixel; x < endPixel; x += 1) {
      const timestamp = viewportStart + ((x + 0.5) / width) * (viewportEnd - viewportStart)
      const tile = tiles.get(chunkIndexFor(timestamp, sessionStart))
      if (!tile) continue
      const sampleIndex = Math.floor((timestamp - tile.chunkStart) / tile.sampleDurationMs)
      if (sampleIndex < 0 || sampleIndex >= tile.sampleCount) continue
      const sampleOffset = sampleIndex * tile.priceCount
      for (let y = top; y < bottom; y += 1) {
        const priceIndex = priceIndexes[y - top]
        if (priceIndex < 0 || priceIndex >= tile.priceCount) continue
        const raw = tile.values[sampleOffset + priceIndex]
        if (raw === 0) continue
        const source = raw * 4
        const target = (y * width + x) * 4
        image.data[target] = lut[source]
        image.data[target + 1] = lut[source + 1]
        image.data[target + 2] = lut[source + 2]
        image.data[target + 3] = lut[source + 3]
      }
    }
    context.putImageData(image, 0, 0)
  }, [
    canvasSize,
    enabled,
    indexKey,
    intensity,
    liquidityWindow,
    priceDomain,
    replayTimestamp,
    sessionStart,
    status,
    tiles,
    viewportEnd,
    viewportStart
  ])

  return (
    <canvas
      aria-hidden="true"
      className="liquidity-heatmap-canvas"
      data-intensity={Math.round(intensity * 100)}
      data-loaded-tiles={tiles.size}
      data-status={status}
      ref={canvasRef}
    />
  )
}

LiquidityHeatmapLayer.propTypes = {
  enabled: PropTypes.bool.isRequired,
  intensity: PropTypes.number.isRequired,
  liquidityEnd: PropTypes.number.isRequired,
  liquidityStart: PropTypes.number.isRequired,
  priceDomain: PropTypes.shape({
    high: PropTypes.number.isRequired,
    low: PropTypes.number.isRequired,
    range: PropTypes.number.isRequired
  }).isRequired,
  replayTimestamp: PropTypes.number.isRequired,
  sessionStart: PropTypes.number.isRequired,
  viewportEnd: PropTypes.number.isRequired,
  viewportStart: PropTypes.number.isRequired
}
