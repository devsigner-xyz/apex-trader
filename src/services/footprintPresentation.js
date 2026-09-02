function rounded(value) {
  return Number(value.toFixed(8))
}

function aggregateLevels(levels, tickSize) {
  const byPrice = new Map()

  for (const level of levels) {
    const price = Math.floor(level.price / tickSize) * tickSize
    const current = byPrice.get(price) ?? { ask: 0, bid: 0, price }
    current.ask += level.ask
    current.bid += level.bid
    byPrice.set(price, current)
  }

  return [...byPrice.values()]
    .map((level) => ({ ...level, ask: rounded(level.ask), bid: rounded(level.bid) }))
    .sort((left, right) => left.price - right.price)
}

function markStackedImbalances(levels, side, size) {
  const flag = side === 'ask' ? 'askImbalance' : 'bidImbalance'
  const stackedFlag = side === 'ask' ? 'isStackedAskImbalance' : 'isStackedBidImbalance'
  const marked = new Set()
  let runStart = 0

  while (runStart < levels.length) {
    if (!levels[runStart][flag]) {
      runStart += 1
      continue
    }

    let runEnd = runStart + 1
    while (runEnd < levels.length && levels[runEnd][flag]) runEnd += 1
    if (runEnd - runStart >= size) {
      for (let index = runStart; index < runEnd; index += 1) marked.add(index)
    }
    runStart = runEnd
  }

  return levels.map((level, index) => ({ ...level, [stackedFlag]: marked.has(index) }))
}

export function deriveFootprintBar(rawBar, settings) {
  const aggregated = aggregateLevels(rawBar.levels, settings.tickSize).filter(
    (level) => level.ask + level.bid >= settings.minimumVolume
  )
  const byPrice = new Map(aggregated.map((level) => [level.price, level]))
  const poc = aggregated.reduce(
    (current, level) =>
      !current || level.ask + level.bid > current.ask + current.bid ? level : current,
    null
  )

  const imbalanced = aggregated.map((level) => {
    const lowerBid = byPrice.get(level.price - settings.tickSize)?.bid ?? 0
    const upperAsk = byPrice.get(level.price + settings.tickSize)?.ask ?? 0
    const total = rounded(level.ask + level.bid)
    const askImbalance =
      lowerBid > 0 &&
      level.ask >= lowerBid * settings.imbalanceRatio &&
      total >= settings.minimumVolume
    const bidImbalance =
      upperAsk > 0 &&
      level.bid >= upperAsk * settings.imbalanceRatio &&
      total >= settings.minimumVolume

    return {
      ...level,
      askImbalance,
      bidImbalance,
      delta: rounded(level.ask - level.bid),
      isPoc: level.price === poc?.price,
      total
    }
  })
  const stackedAsk = markStackedImbalances(imbalanced, 'ask', settings.stackedImbalanceSize)
  const levels = markStackedImbalances(stackedAsk, 'bid', settings.stackedImbalanceSize)

  return {
    ...rawBar,
    delta: rounded(levels.reduce((sum, level) => sum + level.delta, 0)),
    levels,
    pocPrice: poc?.price ?? null,
    total: rounded(levels.reduce((sum, level) => sum + level.total, 0))
  }
}

export function formatFootprintVolume(value, format) {
  if (value === 0) return '-'
  if (format === 'precise') return value.toFixed(3)
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`
  if (Math.abs(value) >= 100) return value.toFixed(0)
  if (Math.abs(value) >= 10) return value.toFixed(1)
  return value.toFixed(2)
}
