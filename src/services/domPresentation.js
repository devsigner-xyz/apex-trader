export const domPriceGroupings = [0.01, 0.05, 0.1, 0.5, 1, 5]

function decimalPlaces(value) {
  const [, decimals = ''] = String(value).split('.')
  return decimals.length
}

function assertGrouping(grouping) {
  if (!Number.isFinite(grouping) || grouping <= 0)
    throw new TypeError('DOM price grouping must be a positive finite number.')
}

export function aggregateDomSide(levels, side, grouping) {
  if (!Array.isArray(levels)) throw new TypeError('DOM levels must be an array.')
  if (side !== 'ask' && side !== 'bid') throw new TypeError('DOM side must be ask or bid.')
  assertGrouping(grouping)

  const scale =
    10 **
    Math.min(
      8,
      Math.max(
        decimalPlaces(grouping),
        ...levels.map((level) => decimalPlaces(Number(level?.price)))
      )
    )
  const groupingUnits = Math.round(grouping * scale)
  const buckets = new Map()

  for (const level of levels) {
    const price = Number(level?.price)
    const amount = Number(level?.amount)
    if (!Number.isFinite(price) || !Number.isFinite(amount) || amount <= 0) continue

    const priceUnits = Math.round(price * scale)
    const bucketUnits =
      (side === 'ask'
        ? Math.ceil(priceUnits / groupingUnits)
        : Math.floor(priceUnits / groupingUnits)) * groupingUnits
    const bucketPrice = bucketUnits / scale
    buckets.set(bucketPrice, (buckets.get(bucketPrice) ?? 0) + amount)
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => (side === 'ask' ? left - right : right - left))
    .map(([price, amount]) => ({ amount, price }))
}

export function aggregateDomOrderbook(orderbook, grouping) {
  return {
    ...orderbook,
    asks: aggregateDomSide(orderbook?.asks ?? [], 'ask', grouping),
    bids: aggregateDomSide(orderbook?.bids ?? [], 'bid', grouping)
  }
}

export function formatDomGrouping(grouping) {
  assertGrouping(grouping)
  return grouping.toFixed(Math.max(2, decimalPlaces(grouping)))
}
