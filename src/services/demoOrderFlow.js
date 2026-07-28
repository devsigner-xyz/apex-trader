const SCENARIOS = {
  balance: { label: 'Balance', buyBias: 0, drift: 0, volatility: 1 },
  breakout: { label: 'Ruptura compradora', buyBias: 0.28, drift: 0.7, volatility: 1.15 },
  absorption: { label: 'Absorción', buyBias: 0.36, drift: 0.1, volatility: 0.85 },
  failedBreakout: { label: 'Ruptura fallida', buyBias: -0.15, drift: -0.32, volatility: 1.25 },
  exhaustion: { label: 'Agotamiento', buyBias: 0.08, drift: 0.08, volatility: 0.5 }
}

function createRandom(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

export function calculateFootprintMetrics(levels, imbalanceRatio = 3) {
  const total = levels.reduce((sum, level) => sum + level.bid + level.ask, 0)
  const delta = levels.reduce((sum, level) => sum + level.ask - level.bid, 0)
  const poc = levels.reduce(
    (current, level) => (level.total > current.total ? level : current),
    levels[0]
  )

  return {
    delta,
    pocPrice: poc.price,
    total,
    levels: levels.map((level, index) => {
      const lowerBid = levels[index - 1]?.bid ?? 0
      const upperAsk = levels[index + 1]?.ask ?? 0
      return {
        ...level,
        askImbalance: level.ask >= Math.max(1, lowerBid) * imbalanceRatio,
        bidImbalance: level.bid >= Math.max(1, upperAsk) * imbalanceRatio,
        isPoc: level.price === poc.price
      }
    })
  }
}

export function generateDemoOrderFlow({
  scenario = 'balance',
  seed = 20260727,
  barCount = 14,
  levelsPerBar = 10
} = {}) {
  const settings = SCENARIOS[scenario] ?? SCENARIOS.balance
  const random = createRandom(seed)
  const bars = []
  let previousClose = 24800
  const tickSize = 10

  for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
    const midpoint =
      previousClose +
      Math.round((settings.drift * (barIndex - barCount / 2) + (random() - 0.5) * 18) / tickSize) *
        tickSize
    const rangeTicks = 4 + Math.floor(random() * 4 * settings.volatility)
    const levels = []

    for (let levelIndex = 0; levelIndex < levelsPerBar; levelIndex += 1) {
      const offset = levelIndex - Math.floor(levelsPerBar / 2)
      const price = midpoint + offset * tickSize
      const acceptance = 0.55 + (1 - Math.abs(offset) / levelsPerBar) * 1.7
      const eventBias =
        settings.buyBias +
        (scenario === 'absorption' && offset > 1 ? 0.23 : 0) +
        (scenario === 'failedBreakout' && barIndex > barCount * 0.55 ? -0.3 : 0)
      const activity = Math.max(
        1,
        Math.round(
          (8 + random() * 34) *
            acceptance *
            (scenario === 'exhaustion' ? 1 - barIndex / (barCount * 1.7) : 1)
        )
      )
      const askShare = clamp(0.5 + eventBias + (random() - 0.5) * 0.3, 0.08, 0.92)
      const ask = Math.max(1, Math.round(activity * askShare))
      const bid = Math.max(1, activity - ask)
      levels.push({ price, bid, ask, total: bid + ask, delta: ask - bid })
    }

    const metrics = calculateFootprintMetrics(levels)
    const low = Math.min(...levels.map((level) => level.price))
    const high = Math.max(...levels.map((level) => level.price))
    const open = previousClose
    const closeDirection = clamp(metrics.delta / Math.max(metrics.total, 1), -0.8, 0.8)
    const close = clamp(
      Math.round((midpoint + closeDirection * rangeTicks * tickSize) / tickSize) * tickSize,
      low,
      high
    )
    bars.push({
      ...metrics,
      close,
      high,
      id: `${scenario}-${seed}-${barIndex}`,
      low,
      open,
      timestamp: Date.UTC(2023, 0, 1, 9, barIndex * 5)
    })
    previousClose = close
  }

  return { bars, scenario, scenarioLabel: settings.label, seed, tickSize }
}

export const demoOrderFlowScenarios = Object.entries(SCENARIOS).map(([id, value]) => ({
  id,
  label: value.label
}))
