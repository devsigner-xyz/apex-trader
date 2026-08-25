export const chartTypes = ['candlestick', 'line', 'heikinAshi']

function toChartTime(timestamp) {
  return Math.floor(timestamp / 1000)
}

export function createFixedChartSlots(itemCount, slotCount, plotLeft, plotWidth) {
  if (!Number.isInteger(itemCount) || itemCount < 0)
    throw new TypeError('Chart item count must be a non-negative integer.')
  if (!Number.isInteger(slotCount) || slotCount < 1 || itemCount > slotCount)
    throw new TypeError(
      'Chart slot count must be a positive integer at least as large as item count.'
    )
  if (!Number.isFinite(plotLeft) || !Number.isFinite(plotWidth) || plotWidth <= 0)
    throw new TypeError('Chart plot geometry must be finite and have positive width.')

  const step = plotWidth / slotCount
  return {
    positions: Array.from({ length: itemCount }, (_, index) => plotLeft + (index + 0.5) * step),
    step
  }
}

export function createCandlestickData(candlesticks) {
  return candlesticks.map(([timestamp, open, high, low, close]) => ({
    close,
    high,
    low,
    open,
    time: toChartTime(timestamp)
  }))
}

export function createLineData(candlesticks) {
  return candlesticks.map(([timestamp, , , , close]) => ({
    time: toChartTime(timestamp),
    value: close
  }))
}

export function createHeikinAshiData(candlesticks) {
  let previous = null

  return candlesticks.map(([timestamp, open, high, low, close]) => {
    const heikinClose = (open + high + low + close) / 4
    const heikinOpen = previous ? (previous.open + previous.close) / 2 : (open + close) / 2
    const data = {
      close: heikinClose,
      high: Math.max(high, heikinOpen, heikinClose),
      low: Math.min(low, heikinOpen, heikinClose),
      open: heikinOpen,
      time: toChartTime(timestamp)
    }

    previous = data
    return data
  })
}

export function createSmaData(candlesticks, period = 20) {
  if (!Number.isInteger(period) || period < 1) throw new TypeError('SMA period must be a positive integer.')

  let sum = 0
  return candlesticks.flatMap((candle, index) => {
    sum += candle[4]
    if (index >= period) sum -= candlesticks[index - period][4]
    if (index < period - 1) return []

    return [{ time: toChartTime(candle[0]), value: sum / period }]
  })
}

export function createVolumeData(volumePoints, colors) {
  return volumePoints.map(({ direction, timestamp, volume }) => ({
    color: direction === 'up' ? colors.up : colors.down,
    time: toChartTime(timestamp),
    value: volume
  }))
}
