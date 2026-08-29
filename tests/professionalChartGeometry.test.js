import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSessionProfile,
  clamp,
  createPriceScale,
  createPriceTicks,
  createTemporalViewport,
  createTimeScale,
  deriveCandleGeometry,
  deriveFootprintCellGeometry,
  derivePannedOffset,
  derivePriceDomain,
  derivePriceScaleFactor,
  deriveScaledPriceDomain,
  deriveSessionProfileBarGeometry,
  deriveStepProfileCellGeometry,
  deriveVolumeBarGeometry,
  deriveZoomedViewport,
  findTimeScaleBarIndex,
  isChartOffsetAtLatest,
  niceDisplayStep,
  normalizeWheelDelta,
  selectEvenIndexes,
  selectTimeTickIndexes,
  selectVisibleWindow
} from '../src/services/professionalChartGeometry.js'

const bars = [
  { close: 101, high: 103, low: 98, open: 100, timestamp: 0 },
  { close: 104, high: 105, low: 100, open: 101, timestamp: 1 },
  { close: 102, high: 106, low: 99, open: 104, timestamp: 2 },
  { close: 107, high: 108, low: 101, open: 102, timestamp: 3 }
]

test('selects and clamps visible windows for full, short and empty histories', () => {
  const integerWindow = selectVisibleWindow(bars, 2, 1)
  assert.deepEqual(integerWindow, {
    endIndex: 3,
    logicalEnd: 3,
    logicalStart: 1,
    maximumOffset: 2,
    phase: 0,
    renderBars: bars.slice(1, 3),
    safeOffset: 1,
    startIndex: 1,
    visible: bars.slice(1, 3)
  })
  assert.deepEqual(selectVisibleWindow(bars.slice(0, 1), 5, 10).visible, bars.slice(0, 1))
  assert.deepEqual(selectVisibleWindow([], 5, 0).visible, [])
  assert.equal(clamp(12, 0, 10), 10)
})

test('selects partial edge bars and exposes their logical rendering phase', () => {
  const window = selectVisibleWindow(bars, 2, 0.5)

  assert.equal(window.logicalStart, 1.5)
  assert.equal(window.logicalEnd, 3.5)
  assert.equal(window.startIndex, 1)
  assert.equal(window.endIndex, 4)
  assert.equal(window.phase, 0.5)
  assert.deepEqual(window.renderBars, bars.slice(1, 4))
  assert.equal(window.visible, window.renderBars)
})

test('normalizes wheel units and derives deterministic horizontal panning', () => {
  assert.deepEqual(normalizeWheelDelta({ deltaMode: 0, deltaX: 4, deltaY: -8 }), {
    x: 4,
    y: -8
  })
  assert.deepEqual(normalizeWheelDelta({ deltaMode: 1, deltaX: 2, deltaY: -3 }), {
    x: 32,
    y: -48
  })
  assert.deepEqual(normalizeWheelDelta({ deltaMode: 2, deltaX: 1, deltaY: -1 }, 600), {
    x: 600,
    y: -600
  })
  assert.equal(
    derivePannedOffset({
      maximumOffset: 100,
      pixelDelta: -100,
      plotWidth: 1000,
      rightOffset: 20,
      visibleCount: 50
    }),
    25
  )
  assert.equal(
    derivePannedOffset({
      maximumOffset: 100,
      pixelDelta: 100,
      plotWidth: 1000,
      rightOffset: 20,
      visibleCount: 50
    }),
    15
  )
  assert.equal(
    derivePannedOffset({
      maximumOffset: 100,
      pixelDelta: 5,
      plotWidth: 1000,
      rightOffset: 20,
      visibleCount: 50
    }),
    19.75
  )
})

test('zooms the temporal viewport around the cursor anchor', () => {
  const current = { barCount: 200, rightOffset: 20, visibleCount: 40 }
  const anchorRatio = 0.25
  const next = deriveZoomedViewport({
    ...current,
    anchorRatio,
    delta: -480,
    maximumVisibleCount: 160,
    minimumVisibleCount: 12
  })
  const currentAnchor =
    current.barCount -
    current.rightOffset -
    current.visibleCount +
    anchorRatio * (current.visibleCount - 1)
  const nextAnchor =
    current.barCount - next.rightOffset - next.visibleCount + anchorRatio * (next.visibleCount - 1)

  assert.deepEqual(next, { rightOffset: 35.75, visibleCount: 19 })
  assert.ok(Math.abs(currentAnchor - nextAnchor) <= Number.EPSILON)
  assert.deepEqual(
    deriveZoomedViewport({
      ...current,
      anchorRatio: 1,
      delta: -10000,
      maximumVisibleCount: 160,
      minimumVisibleCount: 12
    }),
    { rightOffset: 20, visibleCount: 12 }
  )
})

test('keeps the last visible candle fixed while resizing the time axis', () => {
  const current = { barCount: 200, rightOffset: 20.25, visibleCount: 40 }
  const next = deriveZoomedViewport({
    ...current,
    anchorRatio: 1,
    delta: -480,
    maximumVisibleCount: 160,
    minimumVisibleCount: 12
  })

  assert.deepEqual(next, { rightOffset: 20.25, visibleCount: 19 })
  assert.equal(current.barCount - current.rightOffset - 1, current.barCount - next.rightOffset - 1)
})

test('hit-tests chart X positions against logical bars and partial boundaries', () => {
  const viewport = selectVisibleWindow(bars, 2, 0.5)
  const hit = (chartX) =>
    findTimeScaleBarIndex({
      barCount: bars.length,
      chartX,
      logicalEnd: viewport.logicalEnd,
      logicalStart: viewport.logicalStart,
      plotLeft: 10,
      plotWidth: 200,
      visibleCount: 2
    })

  assert.equal(hit(10), 1)
  assert.equal(hit(60), 2)
  assert.equal(hit(160), 3)
  assert.equal(hit(210), 3)
  assert.equal(hit(9), null)
  assert.equal(hit(211), null)

  const shortViewport = selectVisibleWindow(bars.slice(0, 1), 5, 0)
  assert.equal(
    findTimeScaleBarIndex({
      barCount: 1,
      chartX: 20,
      logicalEnd: shortViewport.logicalEnd,
      logicalStart: shortViewport.logicalStart,
      plotLeft: 0,
      plotWidth: 100,
      visibleCount: 5
    }),
    0
  )
  assert.equal(
    findTimeScaleBarIndex({
      barCount: 1,
      chartX: 21,
      logicalEnd: shortViewport.logicalEnd,
      logicalStart: shortViewport.logicalStart,
      plotLeft: 0,
      plotWidth: 100,
      visibleCount: 5
    }),
    null
  )
  assert.equal(isChartOffsetAtLatest(0.0000001), true)
  assert.equal(isChartOffsetAtLatest(0.001), false)
})

test('derives the existing padded price domains and a deterministic price scale', () => {
  const candles = derivePriceDomain(bars, 'candles')
  const footprint = derivePriceDomain(bars, 'footprint')
  assert.equal(candles.low, 97.2)
  assert.equal(candles.high, 108.8)
  assert.equal(footprint.high, 109.2)

  const scale = createPriceScale({ high: 110, low: 90, range: 20 }, 40, 600)
  assert.equal(scale.toY(110), 40)
  assert.equal(scale.toY(100), 320)
  assert.equal(scale.toY(90), 600)
  assert.deepEqual(createPriceTicks({ high: 110, low: 90, range: 20 }, 3), [110, 100, 90])
})

test('rescales the price domain around its center with bounded drag sensitivity', () => {
  assert.deepEqual(deriveScaledPriceDomain({ high: 110, low: 90, range: 20 }, 2), {
    high: 120,
    low: 80,
    range: 40
  })
  assert.ok(Math.abs(derivePriceScaleFactor(1, 100) - Math.exp(0.6)) < 1e-12)
  assert.equal(derivePriceScaleFactor(1, 10000), 4)
  assert.equal(derivePriceScaleFactor(1, -10000), 0.25)
})

test('uses one temporal slot model for every chart rendering mode', () => {
  const candles = createTimeScale(3, 12, 0, 120)
  const footprint = createTimeScale(3, 12, 0, 120)
  const stepProfile = createTimeScale(3, 12, 0, 120)
  assert.deepEqual(candles, footprint)
  assert.deepEqual(footprint, stepProfile)
  assert.deepEqual(candles.positions, [5, 15, 25])
  assert.deepEqual(createTimeScale(3, 2, 0, 20, 0.5).positions, [0, 10, 20])
  assert.deepEqual(selectEvenIndexes(10, 4), [0, 3, 6, 9])
  assert.deepEqual(selectEvenIndexes(0, 4), [])
})

test('keeps short higher-timeframe histories aligned with their empty chart slots', () => {
  const hour = 60 * 60 * 1000
  assert.deepEqual(
    createTemporalViewport({ firstTimestamp: 0, intervalMs: hour, logicalStart: 0, slotCount: 34 }),
    { end: 34 * hour, start: 0 }
  )
  assert.equal((24 * hour) / (34 * hour), 24 / 34)
})

test('selects time ticks from real positions without exceeding count or spacing limits', () => {
  assert.deepEqual(selectTimeTickIndexes([], 6, 64), [])
  assert.deepEqual(selectTimeTickIndexes([0, 100, 200, 300, 400, 500]), [0, 1, 2, 3, 4, 5])
  assert.deepEqual(selectTimeTickIndexes([0, 20, 40, 60, 80, 100], 6, 64), [0, 5])
  assert.deepEqual(selectTimeTickIndexes([0, 20, 40], 1, 64), [1])

  const densePositions = Array.from({ length: 160 }, (_, index) => index * 6.5 - 3.25)
  const indexes = selectTimeTickIndexes(densePositions)
  assert.ok(indexes.length <= 6)
  assert.equal(indexes[0], 0)
  assert.equal(indexes.at(-1), densePositions.length - 1)
  assert.ok(
    indexes.every(
      (index, position) =>
        position === 0 || densePositions[index] - densePositions[indexes[position - 1]] >= 64
    )
  )
})

test('bins session profile levels without losing bid or ask volume', () => {
  const profile = buildSessionProfile(
    [
      { ask: 2, bid: 3, price: 90 },
      { ask: 5, bid: 7, price: 100 },
      { ask: 11, bid: 13, price: 110 }
    ],
    90,
    110,
    3
  )
  assert.deepEqual(profile, [
    { ask: 2, bid: 3, price: 90 },
    { ask: 5, bid: 7, price: 100 },
    { ask: 11, bid: 13, price: 110 }
  ])
})

test('chooses stable display increments at tick boundaries', () => {
  assert.equal(niceDisplayStep(0.001, 0.01), 0.01)
  assert.equal(niceDisplayStep(0.24, 0.01), 0.25)
  assert.equal(niceDisplayStep(6, 0.01), 10)
})

test('derives mode-specific primitive geometry without rendering dependencies', () => {
  const priceScale = createPriceScale({ high: 110, low: 90, range: 20 }, 0, 200)
  const candle = deriveCandleGeometry(bars[0], 50, 8, priceScale)
  assert.equal(candle.center, 50)
  assert.equal(candle.rising, true)
  assert.equal(candle.body.width, 8)
  assert.equal(candle.body.x, 46)
  assert.ok(Math.abs(candle.body.height - 10) < 1e-10)
  assert.ok(Math.abs(candle.body.y - 90) < 1e-10)
  assert.deepEqual(candle.wick, { highY: 70, lowY: 120 })
  assert.deepEqual(
    deriveFootprintCellGeometry({
      plotHeight: 500,
      range: 20,
      step: 80,
      tickSize: 1,
      zoomScale: 1
    }),
    { barWidth: 68, halfWidth: 34, rowHeight: 22 }
  )
  assert.equal(
    deriveFootprintCellGeometry({
      plotHeight: 500,
      range: 20,
      step: 140,
      tickSize: 1,
      zoomScale: 1
    }).barWidth,
    84
  )
  assert.deepEqual(
    deriveStepProfileCellGeometry({
      plotHeight: 500,
      range: 20,
      step: 100,
      tickSize: 0.5,
      zoomScale: 1
    }),
    {
      cellWidth: 60,
      maximumSideWidth: 15,
      rowHeight: 10.5,
      sideHeight: 8.5,
      valueFontSize: 8.5
    }
  )
  assert.deepEqual(
    deriveStepProfileCellGeometry({
      plotHeight: 500,
      range: 20,
      step: 524,
      tickSize: 1,
      zoomScale: 4.5
    }),
    {
      cellWidth: 180,
      maximumSideWidth: 167,
      rowHeight: 19.9,
      sideHeight: 17.9,
      valueFontSize: 16
    }
  )
  const boundedStepProfile = deriveStepProfileCellGeometry({
    plotHeight: 500,
    range: 20,
    step: 90,
    tickSize: 0.5,
    zoomScale: 1
  })
  assert.equal(boundedStepProfile.cellWidth, 60)
  assert.equal(boundedStepProfile.maximumSideWidth, 10)
  assert.ok(boundedStepProfile.cellWidth + boundedStepProfile.maximumSideWidth * 2 <= 90 - 10)
  assert.deepEqual(
    deriveVolumeBarGeometry({ close: 2, open: 1, volume: 50 }, 25, 10, 100, 10, 90),
    {
      height: 40,
      rising: true,
      width: 10,
      x: 20,
      y: 50
    }
  )
  assert.deepEqual(deriveSessionProfileBarGeometry({ ask: 60, bid: 40 }, 200, 116), {
    ask: { width: 26, x: 82 },
    bid: { width: 24, x: 58 }
  })
})
