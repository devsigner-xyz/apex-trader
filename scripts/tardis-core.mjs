export function createBookState() {
  return { asks: new Map(), bids: new Map(), ready: false }
}

export function applyBookGroup(state, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return { applied: false, reset: false }
  const isSnapshot = rows.some((row) => row.isSnapshot)

  // Tardis can emit deltas before a usable full snapshot. They are not a book.
  if (!state.ready && !isSnapshot) return { applied: false, reset: false }

  if (isSnapshot) {
    state.asks.clear()
    state.bids.clear()
    state.ready = true
  }

  for (const row of rows) {
    const book = row.side === 'bid' ? state.bids : state.asks
    if (row.amount === 0) book.delete(row.price)
    else book.set(row.price, row.amount)
  }

  return { applied: true, reset: isSnapshot }
}

export function sortedBook(state, depth = Number.POSITIVE_INFINITY) {
  const limit = (entries, sorter) =>
    [...entries]
      .filter(([, amount]) => amount > 0)
      .sort(sorter)
      .slice(0, depth)
  return {
    asks: limit(state.asks, (left, right) => left[0] - right[0]),
    bids: limit(state.bids, (left, right) => right[0] - left[0])
  }
}

export function valueArea(levels, fraction = 0.7) {
  if (!levels.length) return { poc: null, vah: null, val: null }
  const ordered = [...levels].sort((left, right) => left.price - right.price)
  const pocIndex = ordered.reduce(
    (best, level, index) =>
      level.bid + level.ask > ordered[best].bid + ordered[best].ask ? index : best,
    0
  )
  const target = ordered.reduce((sum, level) => sum + level.bid + level.ask, 0) * fraction
  let low = pocIndex
  let high = pocIndex
  let covered = ordered[pocIndex].bid + ordered[pocIndex].ask
  while (covered < target && (low > 0 || high < ordered.length - 1)) {
    const lower = low > 0 ? ordered[low - 1].bid + ordered[low - 1].ask : -1
    const upper = high < ordered.length - 1 ? ordered[high + 1].bid + ordered[high + 1].ask : -1
    if (upper > lower) {
      high += 1
      covered += upper
    } else {
      low -= 1
      covered += lower
    }
  }
  return { poc: ordered[pocIndex].price, vah: ordered[high].price, val: ordered[low].price }
}
