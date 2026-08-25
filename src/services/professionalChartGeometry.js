import { createFixedChartSlots } from './chartTransforms.js'

export function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

export function selectVisibleWindow(bars, visibleCount, rightOffset) {
  if (!Array.isArray(bars)) throw new TypeError('Chart bars must be an array.')
  if (!Number.isInteger(visibleCount) || visibleCount < 1)
    throw new TypeError('Visible chart bar count must be a positive integer.')

  const maximumOffset = Math.max(0, bars.length - Math.min(visibleCount, bars.length))
  const safeOffset = clamp(Number.isFinite(rightOffset) ? rightOffset : 0, 0, maximumOffset)
  const endIndex = bars.length - safeOffset
  const startIndex = Math.max(0, endIndex - visibleCount)

  return {
    endIndex,
    maximumOffset,
    safeOffset,
    startIndex,
    visible: bars.slice(startIndex, endIndex)
  }
}

export function normalizeWheelDelta({ deltaMode = 0, deltaX = 0, deltaY = 0 }, pageSize = 800) {
  const multiplier = deltaMode === 1 ? 16 : deltaMode === 2 ? pageSize : 1
  return { x: deltaX * multiplier, y: deltaY * multiplier }
}

export function deriveZoomedViewport({
  anchorRatio,
  barCount,
  delta,
  maximumVisibleCount,
  minimumVisibleCount,
  rightOffset,
  visibleCount
}) {
  const safeAnchor = clamp(anchorRatio, 0, 1)
  const safeVisibleCount = clamp(Math.round(visibleCount), minimumVisibleCount, maximumVisibleCount)
  const nextVisibleCount = clamp(
    Math.round(safeVisibleCount * Math.exp(delta * 0.0015)),
    minimumVisibleCount,
    maximumVisibleCount
  )
  const maximumOffset = Math.max(0, barCount - nextVisibleCount)

  if (nextVisibleCount === safeVisibleCount) {
    return {
      rightOffset: clamp(Math.round(rightOffset), 0, maximumOffset),
      visibleCount: safeVisibleCount
    }
  }

  const currentStart = barCount - rightOffset - safeVisibleCount
  const anchorIndex = currentStart + safeAnchor * (safeVisibleCount - 1)
  const nextStart = anchorIndex - safeAnchor * (nextVisibleCount - 1)
  const nextRightOffset = barCount - (nextStart + nextVisibleCount)

  return {
    rightOffset: clamp(Math.round(nextRightOffset), 0, maximumOffset),
    visibleCount: nextVisibleCount
  }
}

export function derivePannedOffset({
  maximumOffset,
  pixelDelta,
  plotWidth,
  rightOffset,
  visibleCount
}) {
  const pixelsPerBar = plotWidth / Math.max(visibleCount, 1)
  const barDelta = Math.round(pixelDelta / Math.max(pixelsPerBar, 4))
  return clamp(rightOffset - barDelta, 0, maximumOffset)
}

export function derivePriceDomain(visibleBars, mode) {
  if (!Array.isArray(visibleBars)) throw new TypeError('Visible chart bars must be an array.')
  if (visibleBars.length === 0) return { high: 1, low: 0, range: 1 }

  const rawLow = Math.min(...visibleBars.map((bar) => bar.low))
  const rawHigh = Math.max(...visibleBars.map((bar) => bar.high))
  const rawRange = rawHigh - rawLow || Math.max(rawHigh * 0.001, 1)
  const low = rawLow - rawRange * 0.08
  const high = rawHigh + rawRange * (mode === 'footprint' ? 0.12 : 0.08)

  return { high, low, range: high - low }
}

export function derivePriceScaleFactor(
  initialScaleFactor,
  pixelDelta,
  minimumScaleFactor = 0.25,
  maximumScaleFactor = 4
) {
  if (!Number.isFinite(initialScaleFactor) || initialScaleFactor <= 0)
    throw new TypeError('Initial price scale factor must be positive.')
  if (!Number.isFinite(pixelDelta)) throw new TypeError('Price scale pixel delta must be finite.')
  return clamp(
    initialScaleFactor * Math.exp(pixelDelta * 0.006),
    minimumScaleFactor,
    maximumScaleFactor
  )
}

export function deriveScaledPriceDomain(domain, scaleFactor) {
  if (
    !Number.isFinite(domain?.high) ||
    !Number.isFinite(domain?.low) ||
    !Number.isFinite(domain?.range) ||
    domain.range <= 0
  )
    throw new TypeError('Price domain must contain a finite positive range.')
  if (!Number.isFinite(scaleFactor) || scaleFactor <= 0)
    throw new TypeError('Price scale factor must be positive.')

  const center = (domain.high + domain.low) / 2
  const range = domain.range * scaleFactor
  return { high: center + range / 2, low: center - range / 2, range }
}

export function createPriceScale(domain, top, bottom) {
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom <= top)
    throw new TypeError('Price scale bounds must be finite and increasing.')
  if (!Number.isFinite(domain?.low) || !Number.isFinite(domain?.range) || domain.range <= 0)
    throw new TypeError('Price scale domain must have a finite low and positive range.')

  return {
    bottom,
    domain,
    toY(price) {
      return bottom - ((price - domain.low) / domain.range) * (bottom - top)
    },
    top
  }
}

export function createTimeScale(itemCount, slotCount, plotLeft, plotWidth) {
  return createFixedChartSlots(itemCount, slotCount, plotLeft, plotWidth)
}

export function createPriceTicks(domain, count) {
  if (!Number.isInteger(count) || count < 2)
    throw new TypeError('Price tick count must be an integer of at least two.')
  return Array.from(
    { length: count },
    (_, index) => domain.high - (domain.range * index) / (count - 1)
  )
}

export function selectEvenIndexes(length, count) {
  if (!Number.isInteger(length) || length < 0)
    throw new TypeError('Source length must be a non-negative integer.')
  if (!Number.isInteger(count) || count < 1)
    throw new TypeError('Index count must be a positive integer.')
  if (length === 0) return []
  if (length === 1 || count === 1) return [0]
  return [
    ...new Set(
      Array.from({ length: count }, (_, index) => Math.round((index * (length - 1)) / (count - 1)))
    )
  ]
}

export function buildSessionProfile(profile, minimum, maximum, binCount = 25) {
  if (!Array.isArray(profile)) throw new TypeError('Session profile must be an array.')
  if (!Number.isInteger(binCount) || binCount < 2)
    throw new TypeError('Session profile bin count must be an integer of at least two.')

  const lastIndex = binCount - 1
  const bins = Array.from({ length: binCount }, (_, index) => ({
    ask: 0,
    bid: 0,
    price: minimum + ((maximum - minimum) * index) / lastIndex
  }))
  for (const level of profile) {
    const index = clamp(
      Math.round(((level.price - minimum) / (maximum - minimum || 1)) * lastIndex),
      0,
      lastIndex
    )
    bins[index].ask += level.ask
    bins[index].bid += level.bid
  }
  return bins
}

export function niceDisplayStep(target, sourceTickSize) {
  if (!Number.isFinite(target) || target <= sourceTickSize) return sourceTickSize
  const magnitude = 10 ** Math.floor(Math.log10(target))
  const normalized = target / magnitude
  const multiplier =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  return Math.max(sourceTickSize, Number((multiplier * magnitude).toFixed(8)))
}

export function deriveCandleGeometry(bar, center, width, priceScale) {
  const openY = priceScale.toY(bar.open)
  const closeY = priceScale.toY(bar.close)
  return {
    body: {
      height: Math.max(2, Math.abs(openY - closeY)),
      width,
      x: center - width / 2,
      y: Math.min(openY, closeY)
    },
    center,
    rising: bar.close >= bar.open,
    wick: {
      highY: priceScale.toY(bar.high),
      lowY: priceScale.toY(bar.low)
    }
  }
}

export function deriveFootprintCellGeometry({ plotHeight, range, step, tickSize, zoomScale }) {
  const barWidth = Math.min(step * 0.78, 76)
  return {
    barWidth,
    halfWidth: barWidth / 2,
    rowHeight: clamp((tickSize / range) * plotHeight * 0.88, 16, 24 * zoomScale)
  }
}

export function deriveStepProfileCellGeometry({ plotHeight, range, step, tickSize, zoomScale }) {
  const cellWidth = clamp(step * 0.42, 42, 40 + 20 * zoomScale)
  const rowHeight = clamp((tickSize / range) * plotHeight * 0.84, 8, 10 + 2.2 * zoomScale)
  return {
    cellWidth,
    maximumSideWidth: Math.max(2, Math.min((step - cellWidth) * 0.46, 80 * zoomScale)),
    rowHeight,
    sideHeight: Math.max(4, rowHeight - 2),
    valueFontSize: clamp(rowHeight - 2, 7, 16)
  }
}

export function deriveVolumeBarGeometry(bar, center, width, maximumVolume, top, bottom) {
  const height = Math.max(2, (bar.volume / maximumVolume) * (bottom - top))
  return {
    height,
    rising: bar.close >= bar.open,
    width,
    x: center - width / 2,
    y: bottom - height
  }
}

export function deriveSessionProfileBarGeometry(level, maximumVolume, panelWidth) {
  const total = level.ask + level.bid
  const width = (total / maximumVolume) * (panelWidth - 16)
  const right = panelWidth - 8
  return {
    ask: { width: width * 0.52, x: right - width * 0.52 },
    bid: { width: width * 0.48, x: right - width }
  }
}
