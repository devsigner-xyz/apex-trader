const SCENARIOS = {
  balance: { label: 'Balance', buyBias: 0, drift: 0, volatility: 1 },
  breakout: { label: 'Ruptura compradora', buyBias: 0.28, drift: 0.7, volatility: 1.15 },
  absorption: { label: 'Absorción', buyBias: 0.36, drift: 0.1, volatility: 0.85 },
  failedBreakout: { label: 'Ruptura fallida', buyBias: -0.15, drift: -0.32, volatility: 1.25 },
  exhaustion: { label: 'Agotamiento', buyBias: 0.08, drift: 0.08, volatility: 0.5 }
}

export const DEMO_BAR_DURATION_MS = 5 * 60 * 1000

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

function formatTime(timestamp) {
  return new Date(timestamp).toISOString().slice(11, 19)
}

function getPoc(levels) {
  return levels.reduce(
    (current, level) =>
      !current ||
      (level.total ?? level.bid + level.ask) > (current.total ?? current.bid + current.ask)
        ? level
        : current,
    null
  )
}

function withFootprintMetrics(levels, imbalanceRatio) {
  const poc = getPoc(levels)

  return {
    delta: levels.reduce((sum, level) => sum + level.ask - level.bid, 0),
    pocPrice: poc?.price ?? null,
    total: levels.reduce((sum, level) => sum + level.bid + level.ask, 0),
    levels: levels.map((level, index) => {
      const lowerBid = levels[index - 1]?.bid ?? 0
      const upperAsk = levels[index + 1]?.ask ?? 0
      return {
        ...level,
        total: level.bid + level.ask,
        delta: level.ask - level.bid,
        askImbalance: level.ask >= Math.max(1, lowerBid) * imbalanceRatio,
        bidImbalance: level.bid >= Math.max(1, upperAsk) * imbalanceRatio,
        isPoc: level.price === poc?.price
      }
    })
  }
}

function validateExecutedTrade(trade) {
  if (
    !trade ||
    !Number.isFinite(trade.timestamp) ||
    !Number.isFinite(trade.price) ||
    !Number.isFinite(trade.qty) ||
    trade.qty <= 0 ||
    !['buy', 'sell'].includes(trade.aggressor)
  ) {
    throw new TypeError(
      'Executed trades require finite timestamp, price, positive qty, and aggressor.'
    )
  }
}

function createLevels(levelsByPrice, tickSize) {
  return [...levelsByPrice.entries()]
    .map(([price, volumes]) => ({
      price: Number(price),
      bid: volumes.bid,
      ask: volumes.ask
    }))
    .sort((left, right) => left.price - right.price)
    .map((level) => ({ ...level, price: Math.round(level.price / tickSize) * tickSize }))
}

function createBar(timestamp, trades, tickSize, imbalanceRatio) {
  const levelsByPrice = new Map()

  for (const trade of trades) {
    const price = Math.round(trade.price / tickSize) * tickSize
    const volumes = levelsByPrice.get(price) ?? { ask: 0, bid: 0 }
    volumes[trade.aggressor === 'buy' ? 'ask' : 'bid'] += trade.qty
    levelsByPrice.set(price, volumes)
  }

  const sortedTrades = [...trades].sort((left, right) => left.timestamp - right.timestamp)
  const levels = createLevels(levelsByPrice, tickSize)
  const metrics = withFootprintMetrics(levels, imbalanceRatio)

  return {
    ...metrics,
    close: sortedTrades.at(-1).price,
    high: Math.max(...sortedTrades.map((trade) => trade.price)),
    low: Math.min(...sortedTrades.map((trade) => trade.price)),
    open: sortedTrades[0].price,
    timestamp
  }
}

/**
 * Compatibility helper for consumers that already have aggregated bid/ask levels.
 * The synthetic demo itself derives these inputs from ExecutedTrade records.
 */
export function calculateFootprintMetrics(levels, imbalanceRatio = 3) {
  return withFootprintMetrics(levels, imbalanceRatio)
}

/**
 * Derives every order-flow view from ExecutedTrade records.
 * ExecutedTrade: { timestamp, price, qty, aggressor: 'buy' | 'sell' }.
 */
export function deriveOrderFlowFromTrades(
  executedTrades,
  { barDurationMs = DEMO_BAR_DURATION_MS, imbalanceRatio = 3, tickSize = 10 } = {}
) {
  if (
    !Number.isFinite(barDurationMs) ||
    barDurationMs <= 0 ||
    !Number.isFinite(tickSize) ||
    tickSize <= 0
  ) {
    throw new TypeError('barDurationMs and tickSize must be positive finite numbers.')
  }

  const sortedTrades = [...executedTrades]
    .map((trade) => {
      validateExecutedTrade(trade)
      return { ...trade }
    })
    .sort((left, right) => left.timestamp - right.timestamp)
  const barsByTimestamp = new Map()
  const profileByPrice = new Map()
  let delta = 0

  const tape = sortedTrades.map((trade) => {
    const barTimestamp = Math.floor(trade.timestamp / barDurationMs) * barDurationMs
    const barTrades = barsByTimestamp.get(barTimestamp) ?? []
    barTrades.push(trade)
    barsByTimestamp.set(barTimestamp, barTrades)

    const price = Math.round(trade.price / tickSize) * tickSize
    const profileVolumes = profileByPrice.get(price) ?? { ask: 0, bid: 0 }
    profileVolumes[trade.aggressor === 'buy' ? 'ask' : 'bid'] += trade.qty
    profileByPrice.set(price, profileVolumes)

    const signedQty = trade.aggressor === 'buy' ? trade.qty : -trade.qty
    delta += signedQty
    return { ...trade, amount: trade.qty, cvd: delta, signedQty, time: formatTime(trade.timestamp) }
  })

  const bars = [...barsByTimestamp.entries()]
    .map(([timestamp, trades]) => createBar(timestamp, trades, tickSize, imbalanceRatio))
    .sort((left, right) => left.timestamp - right.timestamp)
  const volumeProfileLevels = createLevels(profileByPrice, tickSize)
  const volumeProfileMetrics = withFootprintMetrics(volumeProfileLevels, imbalanceRatio)
  const total = tape.reduce((sum, trade) => sum + trade.qty, 0)

  return {
    bars,
    cvd: tape.map((trade) => ({ timestamp: trade.timestamp, value: trade.cvd })),
    delta,
    pointOfControl: volumeProfileMetrics.pocPrice,
    tape,
    total,
    volumeProfile: volumeProfileMetrics
  }
}

/**
 * Produces deterministic ExecutedTrade records. It deliberately has no relationship
 * to book snapshot generation, so trades never imply DOM liquidity.
 */
export function generateDemoExecutedTrades({
  scenario = 'balance',
  seed = 20260727,
  barCount = 14,
  levelsPerBar = 10,
  tickSize = 10,
  startTimestamp = Date.UTC(2023, 0, 1, 9, 0)
} = {}) {
  const settings = SCENARIOS[scenario] ?? SCENARIOS.balance
  const random = createRandom(seed)
  const executedTrades = []
  let previousClose = 24800

  for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
    const midpoint =
      previousClose +
      Math.round((settings.drift * (barIndex - barCount / 2) + (random() - 0.5) * 18) / tickSize) *
        tickSize
    const barTimestamp = startTimestamp + barIndex * DEMO_BAR_DURATION_MS
    const barTrades = []

    for (let levelIndex = 0; levelIndex < levelsPerBar; levelIndex += 1) {
      const offset = levelIndex - Math.floor(levelsPerBar / 2)
      const price = midpoint + offset * tickSize
      const acceptance = 0.55 + (1 - Math.abs(offset) / levelsPerBar) * 1.7
      const eventBias =
        settings.buyBias +
        (scenario === 'absorption' && offset > 1 ? 0.23 : 0) +
        (scenario === 'failedBreakout' && barIndex > barCount * 0.55 ? -0.3 : 0)
      const activity = Math.max(
        2,
        Math.round(
          (8 + random() * 34) *
            acceptance *
            (scenario === 'exhaustion' ? 1 - barIndex / (barCount * 1.7) : 1)
        )
      )
      const askShare = clamp(0.5 + eventBias + (random() - 0.5) * 0.3, 0.08, 0.92)
      const tradeCount = Math.min(activity, 2 + Math.floor(random() * 3 * settings.volatility))
      let remainingQty = activity

      for (let tradeIndex = 0; tradeIndex < tradeCount; tradeIndex += 1) {
        const tradesLeft = tradeCount - tradeIndex
        const qty =
          tradesLeft === 1
            ? remainingQty
            : Math.max(1, Math.floor(random() * (remainingQty - tradesLeft + 1)) + 1)
        remainingQty -= qty
        barTrades.push({
          aggressor: random() < askShare ? 'buy' : 'sell',
          price,
          qty,
          timestamp: barTimestamp + Math.floor(random() * DEMO_BAR_DURATION_MS)
        })
      }
    }

    barTrades.sort((left, right) => left.timestamp - right.timestamp)
    previousClose = barTrades.at(-1).price
    executedTrades.push(...barTrades)
  }

  return executedTrades.sort((left, right) => left.timestamp - right.timestamp)
}

/**
 * Produces deterministic BookSnapshot records independently from executions.
 * BookSnapshot: { timestamp, bids: [{ price, amount }], asks: [{ price, amount }] }.
 */
export function generateDemoBookSnapshots({
  seed = 20260727,
  snapshotCount = 1,
  levelsPerSide = 20,
  tickSize = 10,
  startTimestamp = Date.UTC(2023, 0, 1, 9, 0)
} = {}) {
  const random = createRandom(seed ^ 0x9e3779b9)
  const snapshots = []

  for (let snapshotIndex = 0; snapshotIndex < snapshotCount; snapshotIndex += 1) {
    const midpoint = 24800 + Math.round((random() - 0.5) * 10) * tickSize
    const bids = []
    const asks = []

    for (let levelIndex = 0; levelIndex < levelsPerSide; levelIndex += 1) {
      bids.push({
        amount: Number((0.25 + random() * 2.75).toFixed(2)),
        price: midpoint - (levelIndex + 1) * tickSize
      })
      asks.push({
        amount: Number((0.25 + random() * 2.75).toFixed(2)),
        price: midpoint + (levelIndex + 1) * tickSize
      })
    }

    snapshots.push({
      asks,
      bids,
      timestamp: startTimestamp + snapshotIndex * DEMO_BAR_DURATION_MS
    })
  }

  return snapshots
}

export function generateDemoOrderFlow(options = {}) {
  const { scenario = 'balance', seed = 20260727, tickSize = 10 } = options
  const executedTrades = generateDemoExecutedTrades(options)
  const derived = deriveOrderFlowFromTrades(executedTrades, { tickSize })

  return {
    ...derived,
    bars: derived.bars.map((bar, index) => ({ ...bar, id: `${scenario}-${seed}-${index}` })),
    executedTrades,
    scenario,
    scenarioLabel: (SCENARIOS[scenario] ?? SCENARIOS.balance).label,
    seed,
    tickSize
  }
}

export function generateDemoMarketData(options = {}) {
  const executedTrades = generateDemoExecutedTrades(options)
  const tickSize = options.tickSize ?? 10

  return {
    ...deriveOrderFlowFromTrades(executedTrades, { tickSize }),
    bookSnapshots: generateDemoBookSnapshots({ seed: options.seed }),
    executedTrades
  }
}

export const demoOrderFlowScenarios = Object.entries(SCENARIOS).map(([id, value]) => ({
  id,
  label: value.label
}))
