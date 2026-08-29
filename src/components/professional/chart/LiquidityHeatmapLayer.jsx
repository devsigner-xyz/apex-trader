import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { chunkIndexFor, loadLiquidityChunk } from '../../../services/proPlayback.js'
import { averageLiquidityAt, createLiquidityColorLut } from '../../../services/liquidityHeatmap.js'
import { chartDimensions } from '../config.js'

const { mainBottom, mainTop, priceChartHeight } = chartDimensions

function requestedChunkIndexes(start, end, sessionStart) {
  const first = chunkIndexFor(Math.max(start, sessionStart), sessionStart)
  const last = chunkIndexFor(Math.max(start, end - 1), sessionStart)
  return Array.from({ length: last - first + 1 }, (_, offset) => first + offset)
}

export default function LiquidityHeatmapLayer({
  enabled,
  intensity,
  priceDomain,
  replayTimestamp,
  sessionStart,
  timeframe,
  viewportEnd,
  viewportStart
}) {
  const canvasRef = useRef(null)
  const renderKeyRef = useRef('')
  const [canvasSize, setCanvasSize] = useState({ height: 0, width: 0 })
  const [status, setStatus] = useState('idle')
  const [tiles, setTiles] = useState(new Map())
  const indexes = useMemo(
    () =>
      enabled && viewportEnd > viewportStart
        ? requestedChunkIndexes(viewportStart, Math.min(viewportEnd, replayTimestamp), sessionStart)
        : [],
    [enabled, replayTimestamp, sessionStart, viewportEnd, viewportStart]
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

    const cutoff = Math.min(Math.max(replayTimestamp, viewportStart), viewportEnd)
    const cutoffPixel = Math.round(
      ((cutoff - viewportStart) / (viewportEnd - viewportStart)) * width
    )
    const renderKey = [
      width,
      height,
      viewportStart,
      viewportEnd,
      priceDomain.low,
      priceDomain.high,
      intensity,
      cutoffPixel,
      indexKey
    ].join(':')
    if (renderKeyRef.current === renderKey) return
    renderKeyRef.current = renderKey

    const firstTile = tiles.values().next().value
    const loadedTiles = [...tiles.values()]
    const aggregationMs = timeframe > 5 ? timeframe * 60_000 : 0
    const aggregateCache = new Map()
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

    for (let x = 0; x < Math.min(width, cutoffPixel); x += 1) {
      const timestamp = viewportStart + ((x + 0.5) / width) * (viewportEnd - viewportStart)
      const tile = tiles.get(chunkIndexFor(timestamp, sessionStart))
      if (!tile) continue
      const sampleIndex = Math.floor((timestamp - tile.chunkStart) / tile.sampleDurationMs)
      if (sampleIndex < 0 || sampleIndex >= tile.sampleCount) continue
      const sampleOffset = sampleIndex * tile.priceCount
      for (let y = top; y < bottom; y += 1) {
        const priceIndex = priceIndexes[y - top]
        if (priceIndex < 0 || priceIndex >= tile.priceCount) continue
        let raw
        if (aggregationMs > 0) {
          const bucketIndex = Math.floor((timestamp - sessionStart) / aggregationMs)
          const cacheKey = `${bucketIndex}:${priceIndex}`
          raw = aggregateCache.get(cacheKey)
          if (raw === undefined) {
            const bucketStart = sessionStart + bucketIndex * aggregationMs
            const price = firstTile.priceMin + (priceIndex + 0.5) * firstTile.priceStep
            raw = averageLiquidityAt(
              loadedTiles,
              bucketStart,
              Math.min(bucketStart + aggregationMs, cutoff),
              price
            )
            aggregateCache.set(cacheKey, raw)
          }
        } else raw = tile.values[sampleOffset + priceIndex]
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
    priceDomain,
    replayTimestamp,
    sessionStart,
    status,
    tiles,
    timeframe,
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
      data-temporal-aggregation={timeframe > 5 ? `${timeframe}m-average` : 'raw-5s'}
      ref={canvasRef}
    />
  )
}

LiquidityHeatmapLayer.propTypes = {
  enabled: PropTypes.bool.isRequired,
  intensity: PropTypes.number.isRequired,
  priceDomain: PropTypes.shape({
    high: PropTypes.number.isRequired,
    low: PropTypes.number.isRequired,
    range: PropTypes.number.isRequired
  }).isRequired,
  replayTimestamp: PropTypes.number.isRequired,
  sessionStart: PropTypes.number.isRequired,
  timeframe: PropTypes.number.isRequired,
  viewportEnd: PropTypes.number.isRequired,
  viewportStart: PropTypes.number.isRequired
}
