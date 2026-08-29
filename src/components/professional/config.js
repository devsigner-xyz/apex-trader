export const watchlistColumns = [
  { id: 'symbol', label: 'SYM', required: true, sourceIndex: 0, width: 'minmax(0, 1.4fr)' },
  { id: 'last', label: 'LAST', required: true, sourceIndex: 1, width: 'minmax(0, 1.15fr)' },
  { id: 'bid', label: 'BID', sourceIndex: 2, width: 'minmax(0, 1fr)' },
  { id: 'ask', label: 'ASK', sourceIndex: 3, width: 'minmax(0, 1fr)' },
  { id: 'change', label: 'Δ%', sourceIndex: 4, width: 'minmax(0, 0.82fr)' },
  { id: 'volume', label: 'VOL', sourceIndex: 5, width: 'minmax(0, 0.9fr)' }
]

export const optionalWatchlistColumns = watchlistColumns
  .filter(({ required }) => !required)
  .map(({ id }) => id)

export const storageKeys = {
  chartPanelSizes: 'apex-trader:chart-panel-sizes:v1',
  chartPanelVisibility: 'apex-trader:chart-panel-visibility:v1',
  chartLiquidity: 'apex-trader:chart-liquidity:v1',
  panelSizes: 'apex-trader:panel-sizes:v1',
  watchlistColumns: 'apex-trader:markets-columns'
}

export const executionOrderTypes = {
  limit: {
    label: 'Limit',
    priceFields: ['limitPrice'],
    timeInForce: ['GTC', 'IOC', 'FOK']
  },
  market: {
    label: 'Market',
    priceFields: [],
    timeInForce: ['IOC']
  },
  'stop-market': {
    label: 'Stop Market',
    priceFields: ['stopPrice'],
    timeInForce: ['GTC']
  },
  'stop-limit': {
    label: 'Stop Limit',
    priceFields: ['stopPrice', 'limitPrice'],
    timeInForce: ['GTC']
  },
  oco: {
    label: 'OCO',
    priceFields: ['takeProfitPrice', 'stopPrice', 'stopLimitPrice'],
    timeInForce: ['GTC']
  }
}

export const panelSizeDefaults = { dom: 218, execution: 280, watch: 360 }
export const panelSizeLimits = {
  dom: [218, 340],
  execution: [250, 380],
  watch: [340, 460]
}

export const chartDefaults = { candles: 34, footprint: 12, 'step-profile': 9 }
export const defaultChartTimeframe = 30
export const chartViewportLimits = {
  candles: { maximum: 160, minimum: 28 },
  footprint: { maximum: 13, minimum: 4 },
  'step-profile': { maximum: 12, minimum: 1 }
}
export const chartTimeframes = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 }
]
export const footprintTimeframes = chartTimeframes.filter(({ minutes }) => minutes >= 60)

export const chartDimensions = {
  chartWidth: 1128,
  mainBottom: 585,
  mainTop: 42,
  plotLeft: 0,
  plotRight: 1048,
  priceAxisX: 1056,
  priceChartHeight: 646,
  profileChartWidth: 180,
  timeTickY: 615,
  volumeBottom: 90,
  volumeChartHeight: 100,
  volumeTop: 10
}

export const chartPanelSizeDefaults = { profile: 180, volume: 110 }
export const chartPanelSizeLimits = {
  profile: [120, 280],
  volume: [72, 200]
}
export const chartPanelVisibilityDefaults = { profile: true, valueArea: true, volume: true }
export const chartLiquidityDefaults = { enabled: true, intensity: 0.6 }
