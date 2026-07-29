export const footprintModes = ['bidAsk', 'delta', 'volume']
export const footprintScales = ['linear', 'logarithmic']
export const footprintFormats = ['compact', 'precise']
export const footprintStackSizes = [2, 3, 4, 5]

export function createDefaultFootprintSettings(sourceTickSize) {
  return {
    format: 'compact',
    imbalanceRatio: 3,
    minimumVolume: 0,
    mode: 'bidAsk',
    scale: 'linear',
    stackedImbalanceSize: 3,
    tickSize: sourceTickSize
  }
}

function isPositiveFinite(value) {
  return Number.isFinite(value) && value > 0
}

export function normalizeFootprintSettings(candidate, sourceTickSize) {
  const defaults = createDefaultFootprintSettings(sourceTickSize)
  const tickSize = Number(candidate?.tickSize)
  const imbalanceRatio = Number(candidate?.imbalanceRatio)
  const minimumVolume = Number(candidate?.minimumVolume)
  const stackedImbalanceSize = Number(candidate?.stackedImbalanceSize)

  return {
    format: footprintFormats.includes(candidate?.format) ? candidate.format : defaults.format,
    imbalanceRatio: isPositiveFinite(imbalanceRatio) ? imbalanceRatio : defaults.imbalanceRatio,
    minimumVolume: Number.isFinite(minimumVolume) && minimumVolume >= 0 ? minimumVolume : 0,
    mode: footprintModes.includes(candidate?.mode) ? candidate.mode : defaults.mode,
    scale: footprintScales.includes(candidate?.scale) ? candidate.scale : defaults.scale,
    stackedImbalanceSize: footprintStackSizes.includes(stackedImbalanceSize)
      ? stackedImbalanceSize
      : defaults.stackedImbalanceSize,
    tickSize: isPositiveFinite(tickSize) && tickSize >= sourceTickSize ? tickSize : sourceTickSize
  }
}

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

export function deriveFootprintBars(rawBars, settings) {
  return rawBars.map((bar) => deriveFootprintBar(bar, settings))
}

export function deriveFootprintProfile(rawProfile, settings) {
  return deriveFootprintBar({ ...rawProfile, timestamp: 0 }, settings)
}

export function getDiagonalPair(level, levels, settings) {
  const byPrice = new Map(levels.map((item) => [item.price, item]))
  const askCounterpart = byPrice.get(level.price - settings.tickSize)
  const bidCounterpart = byPrice.get(level.price + settings.tickSize)

  return {
    ask: {
      counterpart: askCounterpart?.bid ?? 0,
      counterpartPrice: level.price - settings.tickSize,
      ratio: askCounterpart?.bid ? level.ask / askCounterpart.bid : null,
      side: 'ask'
    },
    bid: {
      counterpart: bidCounterpart?.ask ?? 0,
      counterpartPrice: level.price + settings.tickSize,
      ratio: bidCounterpart?.ask ? level.bid / bidCounterpart.ask : null,
      side: 'bid'
    }
  }
}

export function formatFootprintVolume(value, format) {
  if (value === 0) return '—'
  if (format === 'precise') return value.toFixed(3)
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`
  if (Math.abs(value) >= 100) return value.toFixed(0)
  if (Math.abs(value) >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

export function formatCellValue(level, settings) {
  if (settings.mode === 'delta') return `Δ ${formatFootprintVolume(level.delta, settings.format)}`
  if (settings.mode === 'volume') return `V ${formatFootprintVolume(level.total, settings.format)}`
  return `${formatFootprintVolume(level.bid, settings.format)} × ${formatFootprintVolume(
    level.ask,
    settings.format
  )}`
}
