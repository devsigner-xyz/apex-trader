const baseTimestamp = Date.UTC(2019, 11, 1, 12, 0)
const tickSize = 0.25

export const marketPrimitivePhaseCount = 4
export const marketPrimitiveTickSize = tickSize

const completedCandles = [
  { open: 21834, high: 21841, low: 21831, close: 21839, volume: 620 },
  { open: 21839, high: 21849, low: 21837, close: 21846, volume: 840 },
  { open: 21846, high: 21854, low: 21843, close: 21851, volume: 730 },
  { open: 21851, high: 21853, low: 21843, close: 21845, volume: 910 }
].map((bar, index) => ({
  ...bar,
  delta: index % 2 === 0 ? 42 + index * 7 : -31 - index * 5,
  timestamp: baseTimestamp + index * 60_000
}))

const currentCandleStates = [
  { close: 21846, high: 21854, low: 21842 },
  { close: 21849, high: 21854, low: 21842 },
  { close: 21852, high: 21854, low: 21842 },
  { close: 21848, high: 21854, low: 21842 }
]

const bidVolumes = [24, 38, 61, 156, 344, 682, 1120, 1340, 934]
const askVolumes = [35, 52, 104, 238, 526, 974, 1480, 1610, 1180]
const phaseOffsets = [0, 19, -11, 27]
const domPriceStates = [
  { asks: [0.25, 0.5, 0.75], bids: [0.25, 0.5, 0.75], current: 21842.25 },
  { asks: [0.5, 0.75, 1], bids: [0.25, 0.5, 0.75], current: 21842.5 },
  { asks: [0.25, 0.5, 0.75], bids: [0.5, 0.75, 1], current: 21842.75 },
  { asks: [0.75, 1, 1.25], bids: [0.25, 0.5, 0.75], current: 21842.5 }
]
// Static 30 min replay sample, extracted from the real 2019-12-01 16:30-24:00 UTC liquidity tiles.
// Rows run high-to-low in the chart, and values use the production log-normalized 0-1 scale.
const heatmapBase = [
  [0.32, 0.32, 0.32, 0.33, 0.33, 0.37, 0.41, 0.32, 0.32, 0.37, 0.42, 0.4],
  [0.56, 0.66, 0.67, 0.67, 0.67, 0.67, 0.67, 0.67, 0.68, 0.67, 0.7, 0.68],
  [0.24, 0.23, 0.32, 0.24, 0.34, 0.42, 0.4, 0.37, 0.36, 0.36, 0.39, 0.34],
  [0.5, 0.53, 0.59, 0.57, 0.57, 0.61, 0.57, 0.68, 0.69, 0.32, 0.36, 0.36],
  [0.35, 0.31, 0.33, 0.19, 0.04, 0.24, 0.45, 0.23, 0.35, 0.25, 0.28, 0.2],
  [0.26, 0.35, 0.36, 0.44, 0.49, 0.46, 0.28, 0.29, 0.32, 0.3, 0.22, 0.27],
  [0.41, 0.29, 0.35, 0.45, 0.23, 0.35, 0.15, 0.56, 0.21, 0.22, 0.17, 0.07],
  [0.46, 0.42, 0.46, 0.42, 0.49, 0.41, 0.33, 0.42, 0.41, 0.53, 0.51, 0.53]
]

export function normalizeMarketPrimitivePhase(value) {
  if (!Number.isFinite(value)) return 0
  const integer = Math.trunc(value)
  return (
    ((integer % marketPrimitivePhaseCount) + marketPrimitivePhaseCount) % marketPrimitivePhaseCount
  )
}

function createLevels(phase, multiplier = 1) {
  const phaseOffset = phaseOffsets[phase]
  return bidVolumes.map((bid, index) => ({
    ask: Math.max(
      1,
      Math.round((askVolumes[index] + phaseOffset * ((index % 3) + 1)) * multiplier)
    ),
    bid: Math.max(1, Math.round((bid + phaseOffset * (((index + 1) % 3) + 1)) * multiplier)),
    price: Number((21840 + index * tickSize).toFixed(2))
  }))
}

function createProfile(phase) {
  const levels = createLevels(phase, 0.62)
  return levels.map((level, index) => ({
    ...level,
    price: Number((21843 - index * tickSize).toFixed(2))
  }))
}

function createOrderFlowBar({ levels, ...bar }) {
  return {
    ...bar,
    delta: levels.reduce((sum, level) => sum + level.ask - level.bid, 0),
    levels,
    volume: levels.reduce((sum, level) => sum + level.ask + level.bid, 0)
  }
}

function createOrderbook(phase) {
  const shift = phaseOffsets[phase]
  const priceState = domPriceStates[phase]
  return {
    asks: priceState.asks.map((offset, index) => ({
      amount: 96 + index * 53 + shift * (index + 1),
      price: Number((priceState.current + offset).toFixed(2))
    })),
    bids: priceState.bids.map((offset, index) => ({
      amount: 112 + index * 67 - shift * (index - 2),
      price: Number((priceState.current - offset).toFixed(2))
    })),
    currentPrice: priceState.current,
    groupsApplied: 1
  }
}

function createTrades(phase) {
  const templates = [
    { amount: 5.418, price: 21842.25, side: 'buy' },
    { amount: 5.361, price: 21842, side: 'sell' },
    { amount: 5.204, price: 21842.25, side: 'buy' },
    { amount: 4.982, price: 21842.5, side: 'buy' },
    { amount: 4.764, price: 21842, side: 'sell' },
    { amount: 4.539, price: 21841.75, side: 'sell' }
  ]

  return Array.from({ length: 6 }, (_, index) => {
    const trade = templates[(phase + index) % templates.length]
    return {
      ...trade,
      amount: Number((trade.amount + phase * 0.017).toFixed(4)),
      timestamp: baseTimestamp + phase * 1_500 - index * 3_000
    }
  })
}

function createHeatmap(phase) {
  const phaseOffset = [0, 0.06, -0.04, 0.03][phase]
  return heatmapBase.map((row, rowIndex) =>
    row.map((value, columnIndex) =>
      Number(
        Math.min(
          1,
          Math.max(0.04, value + phaseOffset * ((columnIndex + rowIndex) % 3 === 0 ? 1 : 0.45))
        ).toFixed(2)
      )
    )
  )
}

export function createMarketPrimitiveSnapshot(value) {
  const phase = normalizeMarketPrimitivePhase(value)
  const orderbook = createOrderbook(phase)
  const levels = createLevels(phase)
  const completedFootprintLevels = createLevels(0, 0.74)
  const completedStepProfileLevels = createLevels(0, 0.82)
  const currentState = currentCandleStates[phase]
  const currentCandle = {
    ...currentState,
    delta: levels.reduce((sum, level) => sum + level.ask - level.bid, 0),
    open: 21845,
    timestamp: baseTimestamp + 4 * 60_000,
    volume: levels.reduce((sum, level) => sum + level.ask + level.bid, 0)
  }

  return {
    candles: [...completedCandles, currentCandle],
    currentPrice: orderbook.currentPrice,
    heatmap: createHeatmap(phase),
    footprintBars: [
      createOrderFlowBar({
        close: 21840.75,
        high: 21842,
        levels: completedFootprintLevels,
        low: 21840,
        open: 21841.5,
        timestamp: baseTimestamp - 60_000
      }),
      createOrderFlowBar({
        close: 21841.75,
        high: 21842.25,
        levels,
        low: 21840,
        open: 21840.5,
        timestamp: baseTimestamp
      })
    ],
    orderbook,
    phase,
    profile: createProfile(phase),
    stepProfileBars: [
      createOrderFlowBar({
        close: 21840.5,
        high: 21842,
        levels: completedStepProfileLevels,
        low: 21840,
        open: 21841.25,
        timestamp: baseTimestamp
      }),
      createOrderFlowBar({
        close: 21841.5,
        high: 21842.25,
        levels: createLevels(phase, 1.1),
        low: 21840,
        open: 21840.25,
        timestamp: baseTimestamp + 60_000
      })
    ],
    trades: createTrades(phase)
  }
}
