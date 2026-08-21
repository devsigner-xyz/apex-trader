const FALLBACK_COLORS = {
  axis: 'rgb(204 208 220)',
  ask: 'rgb(173 155 227)',
  bid: 'rgb(118 209 170)'
}

function readCssToken(name, fallback) {
  if (typeof document === 'undefined') return fallback

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function readCssColor(name, fallback) {
  const value = readCssToken(name, fallback)
  if (typeof document === 'undefined' || !value.startsWith('var(')) return value

  const probe = document.createElement('span')
  probe.style.color = value
  document.documentElement.append(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved || fallback
}

function readCssNumber(name, fallback) {
  const value = Number.parseFloat(readCssToken(name, String(fallback)))

  return Number.isFinite(value) ? value : fallback
}

function withOpacity(color, opacity) {
  const hex = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i)
  if (hex) {
    const value = hex[1].length === 3 ? [...hex[1]].map((channel) => channel.repeat(2)).join('') : hex[1]
    const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16))
    return `rgba(${channels.join(', ')}, ${opacity})`
  }

  const channels = color.match(/\d+(?:\.\d+)?/g)
  if (!channels || channels.length < 3) return color

  return `rgba(${channels.slice(0, 3).join(', ')}, ${opacity})`
}

export function getChartColors() {
  const candlestick = readCssColor('--color-chart-candlestick', FALLBACK_COLORS.ask)
  const bid = readCssColor('--color-chart-bid', FALLBACK_COLORS.bid)
  const ask = readCssColor('--color-chart-ask', FALLBACK_COLORS.ask)

  return {
    ask: {
      area: withOpacity(ask, readCssNumber('--chart-depth-area-opacity', 0.1)),
      line: ask
    },
    axis: readCssColor('--color-chart-axis', FALLBACK_COLORS.axis),
    bid: {
      area: withOpacity(bid, readCssNumber('--chart-depth-area-opacity', 0.1)),
      line: bid
    },
    border: readCssColor('--color-border', 'rgb(255 255 255 / 18%)'),
    candlestick,
    grid: readCssColor('--color-chart-grid-line', 'rgb(255 255 255 / 8%)'),
    surface: readCssColor('--color-surface-raised', '#292929'),
    upCandlestick: readCssColor('--color-chart-candlestick-up', bid),
    volumeDown: withOpacity(candlestick, readCssNumber('--chart-volume-opacity', 0.5)),
    volumeUp: withOpacity(
      readCssColor('--color-chart-candlestick-up', bid),
      readCssNumber('--chart-volume-opacity', 0.5)
    )
  }
}

export function getDepthChartFillOpacity() {
  return readCssNumber('--chart-depth-fill-opacity', 0.5)
}
