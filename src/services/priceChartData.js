const PRICE_CSV_PATH = 'data/OHCLVT/XBTUSD/XBTUSD_1440.csv'

export function parseOhlcvCsv(csvText) {
  if (typeof csvText !== 'string') {
    throw new TypeError('Expected OHLCV CSV data to be a string')
  }

  const candlesticks = []
  const volumes = []

  for (const line of csvText.split(/\r?\n/)) {
    const value = line.trim()
    if (!value) continue

    const [timestamp, open, high, low, close, volume] = value.split(',').map(Number)
    const timestampMilliseconds = timestamp * 1000

    if (![timestampMilliseconds, open, high, low, close, volume].every(Number.isFinite)) {
      continue
    }

    candlesticks.push([timestampMilliseconds, open, high, low, close])
    volumes.push([timestampMilliseconds, volume])
  }

  return { candlesticks, volumes }
}

export async function loadPriceChartData(
  fetchImpl = fetch,
  url = `${import.meta.env.BASE_URL}${PRICE_CSV_PATH}`
) {
  const response = await fetchImpl(url)

  if (!response.ok) {
    throw new Error(`Unable to load price data (${response.status})`)
  }

  return parseOhlcvCsv(await response.text())
}
