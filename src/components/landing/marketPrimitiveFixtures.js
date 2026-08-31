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
  return {
    asks: [21842.5, 21842.75, 21843].map((price, index) => ({
      amount: 96 + index * 53 + shift * (index + 1),
      price
    })),
    bids: [21842, 21841.75, 21841.5].map((price, index) => ({
      amount: 112 + index * 67 - shift * (index - 2),
      price
    })),
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

export function createMarketPrimitiveSnapshot(value) {
  const phase = normalizeMarketPrimitivePhase(value)
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
    currentPrice: 21842.25,
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
    orderbook: createOrderbook(phase),
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
