export function aggregateChartData(candlesticks, volumes, timeframeMinutes) {
  const intervalMs = timeframeMinutes * 60 * 1000
  const groups = new Map()

  candlesticks.forEach(([timestamp, open, high, low, close], index) => {
    const groupTimestamp = Math.floor(timestamp / intervalMs) * intervalMs
    const group = groups.get(groupTimestamp) ?? {
      close,
      high,
      low,
      open,
      timestamp: groupTimestamp,
      volume: 0
    }
    group.high = Math.max(group.high, high)
    group.low = Math.min(group.low, low)
    group.close = close
    group.volume += volumes[index]?.[1] ?? 0
    groups.set(groupTimestamp, group)
  })

  const grouped = [...groups.values()]
  return {
    candlesticks: grouped.map(({ timestamp, open, high, low, close }) => [
      timestamp,
      open,
      high,
      low,
      close
    ]),
    volumes: grouped.map(({ timestamp, volume }) => [timestamp, volume])
  }
}
