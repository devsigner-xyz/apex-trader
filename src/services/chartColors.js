const FALLBACK_COLORS = {
  axis: 'rgb(204 208 220)',
  ask: 'rgb(173 155 227)',
  bid: 'rgb(118 209 170)'
}

function readCssToken(name, fallback) {
  if (typeof document === 'undefined') return fallback

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function readCssNumber(name, fallback) {
  const value = Number.parseFloat(readCssToken(name, String(fallback)))

  return Number.isFinite(value) ? value : fallback
}

function withOpacity(color, opacity) {
  const channels = color.match(/\d+(?:\.\d+)?/g)

  if (!channels || channels.length < 3) return color

  return `rgba(${channels.slice(0, 3).join(', ')}, ${opacity})`
}

export function getChartColors() {
  const candlestick = readCssToken('--color-chart-candlestick', FALLBACK_COLORS.ask)
  const bid = readCssToken('--color-chart-bid', FALLBACK_COLORS.bid)
  const ask = readCssToken('--color-chart-ask', FALLBACK_COLORS.ask)

  return {
    ask: {
      area: withOpacity(ask, readCssNumber('--chart-depth-area-opacity', 0.1)),
      line: ask
    },
    axis: readCssToken('--color-chart-axis', FALLBACK_COLORS.axis),
    bid: {
      area: withOpacity(bid, readCssNumber('--chart-depth-area-opacity', 0.1)),
      line: bid
    },
    candlestick,
    upCandlestick: readCssToken('--color-chart-candlestick-up', bid),
    volume: withOpacity(candlestick, readCssNumber('--chart-volume-opacity', 0.5))
  }
}

export function getDepthChartFillOpacity() {
  return readCssNumber('--chart-depth-fill-opacity', 0.5)
}
