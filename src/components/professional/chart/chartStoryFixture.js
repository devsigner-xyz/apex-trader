const baseTimestamp = Date.UTC(2019, 11, 1, 0, 0)
const tickSize = 0.25

function roundPrice(value) {
  return Number((Math.round(value / tickSize) * tickSize).toFixed(2))
}

function levelsFor(price, index) {
  const center = roundPrice(price)
  return Array.from({ length: 9 }, (_, offset) => {
    const distance = Math.abs(offset - 4)
    const bid = 18 + ((index * 7 + offset * 11) % 34) + (distance === 0 ? 24 : 0)
    const ask = 16 + ((index * 13 + offset * 5) % 37) + (distance === 0 ? 32 : 0)
    return { ask, bid, price: roundPrice(center + (offset - 4) * tickSize) }
  })
}

function createBar(index) {
  const trend = index * 0.34
  const cycle = Math.sin(index / 7) * 8 + Math.cos(index / 17) * 5
  const open = roundPrice(7396 + trend + cycle)
  const close = roundPrice(open + Math.sin(index * 1.7) * 2.5)
  const levels = levelsFor((open + close) / 2, index)
  const low = Math.min(open, close, levels[0].price)
  const high = Math.max(open, close, levels.at(-1).price)
  const volume = levels.reduce((sum, level) => sum + level.ask + level.bid, 0)
  const delta = levels.reduce((sum, level) => sum + level.ask - level.bid, 0)

  return {
    close,
    cvd: delta,
    delta,
    high,
    levels,
    low,
    open,
    poc: levels[4].price,
    timestamp: baseTimestamp + index * 5 * 60_000,
    vah: levels[6].price,
    val: levels[2].price,
    volume,
    vwap: roundPrice((open + high + low + close) / 4)
  }
}

export const chartStoryBars = Array.from({ length: 180 }, (_, index) => createBar(index))
const current = chartStoryBars.at(-1)

export const chartStoryView = {
  bars: chartStoryBars,
  change: (current.close / chartStoryBars[0].open - 1) * 100,
  current,
  index: chartStoryBars.length - 1,
  orderbook: { asks: [], bids: [], groupsApplied: 1 },
  profile: { levels: [], poc: current.poc, vah: current.vah, val: current.val },
  timestamp: current.timestamp + 4 * 60_000 + 32_000,
  trades: []
}

export const chartStoryTickSize = tickSize
