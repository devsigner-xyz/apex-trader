export const fixtureMarkets = [
  ['BTCUSDT', '7,391.62', '7,391.61', '7,391.63', '+0.30%', '5.1K'],
  ['ETHUSDT', '151.42', '151.41', '151.43', '-0.89%', '112K'],
  ['BNBUSDT', '15.88', '15.87', '15.89', '+0.43%', '47K'],
  ['XRPUSDT', '0.2251', '0.2250', '0.2252', '+1.12%', '2.4M'],
  ['ES', '3,146.25', '3,146.00', '3,146.50', '+0.38%', '1.1M'],
  ['NQ', '8,402.50', '8,402.25', '8,402.75', '+0.95%', '484K'],
  ['YM', '28,083', '28,082', '28,084', '+0.76%', '64K'],
  ['RTY', '1,624.1', '1,624.0', '1,624.2', '+0.26%', '129K'],
  ['CL', '55.42', '55.41', '55.43', '+2.39%', '211K'],
  ['GC', '1,472.6', '1,472.5', '1,472.7', '+2.09%', '191K'],
  ['SI', '17.05', '17.04', '17.06', '+1.82%', '63K'],
  ['ZN', "129'085", "129'080", "129'090", '-0.22%', '2.4M'],
  ['EURUSD', '1.1018', '1.1017', '1.1019', '+0.06%', '—'],
  ['GBPUSD', '1.2904', '1.2903', '1.2905', '+0.10%', '—'],
  ['USDJPY', '109.52', '109.51', '109.53', '-0.11%', '—'],
  ['AAPL', '66.04', '66.03', '66.05', '-0.63%', '47M'],
  ['MSFT', '151.38', '151.37', '151.39', '+0.43%', '23M'],
  ['NVDA', '5.40', '5.39', '5.41', '-0.98%', '99M'],
  ['AMD', '39.15', '39.14', '39.16', '+0.81%', '14M'],
  ['TSLA', '22.10', '22.09', '22.11', '+5.14%', '59M'],
  ['META', '202.00', '201.99', '202.01', '+0.75%', '14M'],
  ['AMZN', '89.08', '89.07', '89.09', '-0.57%', '36M'],
  ['GOOGL', '65.68', '65.67', '65.69', '+1.22%', '21M'],
  ['NFLX', '314.66', '314.65', '314.67', '-0.69%', '24M'],
  ['DAX', '13,236', '—', '—', '+0.59%', '43M'],
  ['VIX', '12.62', '—', '—', '-5.50%', '—'],
  ['QQQ', '205.58', '205.57', '205.59', '+0.35%', '33M'],
  ['SPY', '314.31', '314.30', '314.32', '+0.41%', '39M'],
  ['ADAUSDT', '0.0391', '0.0390', '0.0392', '+1.38%', '41M'],
  ['LINKUSDT', '2.24', '2.23', '2.25', '+3.70%', '7.8M'],
  ['LTCUSDT', '48.31', '48.30', '48.32', '-0.52%', '3.4M'],
  ['BCHUSDT', '213.76', '213.74', '213.78', '+0.64%', '841K'],
  ['TRXUSDT', '0.0147', '0.0146', '0.0148', '-0.21%', '73M'],
  ['XLMUSDT', '0.0568', '0.0567', '0.0569', '+0.92%', '19M'],
  ['ETCUSDT', '3.91', '3.90', '3.92', '-1.13%', '2.2M'],
  ['EOSUSDT', '2.68', '2.67', '2.69', '+0.45%', '8.9M'],
  ['ZB', "159'120", "159'115", "159'125", '+0.18%', '412K'],
  ['ZF', "118'207", "118'205", "118'210", '-0.09%', '603K'],
  ['6E', '1.1020', '1.1019', '1.1021', '+0.05%', '176K'],
  ['6J', '0.00913', '0.00912', '0.00914', '-0.16%', '94K'],
  ['6B', '1.2906', '1.2905', '1.2907', '+0.08%', '81K'],
  ['NG', '2.31', '2.30', '2.32', '+1.76%', '228K'],
  ['HG', '2.65', '2.64', '2.66', '+0.71%', '76K'],
  ['JPM', '131.76', '131.75', '131.77', '-0.44%', '11M'],
  ['INTC', '24.87', '24.86', '24.88', '+0.57%', '21M'],
  ['ORCL', '56.08', '56.07', '56.09', '+0.33%', '9.4M'],
  ['XMRUSDT', '54.11', '54.10', '54.12', '+1.04%', '318K'],
  ['DASHUSDT', '51.24', '51.23', '51.25', '-0.74%', '296K'],
  ['ZECUSDT', '27.94', '27.93', '27.95', '+0.62%', '521K'],
  ['IOTAUSDT', '0.2051', '0.2050', '0.2052', '-0.38%', '12M']
]

export const activityTables = {
  POSITIONS: {
    columns: ['SYMBOL', 'SIDE', 'QTY', 'ENTRY', 'MARK', 'UPL', 'OPENED', 'ACTION'],
    grid: '1.1fr 0.7fr 0.7fr 1fr 1fr 0.85fr 0.9fr 0.85fr',
    rows: [
      ['BTCUSDT', 'BUY', '0.25', '7,366.42', '7,391.62', '+$6.30', '02:17:06', 'CLOSE'],
      ['BTCUSDT', 'SELL', '0.10', '7,405.00', '7,391.62', '+$1.34', '01:48:03', 'CLOSE']
    ]
  },
  ORDERS: {
    columns: ['TIME', 'SYMBOL', 'SIDE', 'TYPE', 'QTY', 'LIMIT / TRIGGER', 'TIF', 'STATUS', 'ACTION'],
    grid: '0.85fr 1fr 0.65fr 0.85fr 0.65fr 1.35fr 0.6fr 0.95fr 0.85fr',
    rows: [
      ['04:02:18', 'BTCUSDT', 'BUY', 'LIMIT', '0.25', '7,380.50', 'GTC', 'WORKING', 'CANCEL'],
      ['03:58:40', 'BTCUSDT', 'SELL', 'STOP', '0.25', '7,350.00', 'GTC', 'WORKING', 'CANCEL'],
      ['02:17:06', 'BTCUSDT', 'SELL', 'LIMIT', '0.10', '7,412.18', 'GTC', 'FILLED', 'DETAILS'],
      ['01:48:03', 'BTCUSDT', 'BUY', 'STOP', '0.10', '7,405.00', 'GTC', 'CANCELLED', 'DETAILS']
    ]
  },
  FILLS: {
    columns: ['TIME', 'SYMBOL', 'SIDE', 'QTY', 'FILL PRICE', 'FEE', 'LIQUIDITY', 'ORDER ID'],
    grid: '0.9fr 1fr 0.7fr 0.7fr 1fr 0.75fr 0.9fr 1fr',
    rows: [
      ['03:42:11', 'BTCUSDT', 'BUY', '0.25', '7,366.42', '$0.31', 'TAKER', 'MKT-1042'],
      ['02:17:06', 'BTCUSDT', 'SELL', '0.10', '7,412.18', '$0.18', 'MAKER', 'LMT-1038'],
      ['01:22:14', 'BTCUSDT', 'BUY', '0.15', '7,398.24', '$0.26', 'MAKER', 'LMT-1029']
    ]
  },
  ACTIVITY: {
    columns: ['TIME', 'EVENT', 'DETAIL', 'STATUS', 'ACCOUNT'],
    grid: '0.75fr 0.8fr minmax(240px, 3fr) 0.9fr 0.9fr',
    rows: [
      ['04:02:18', 'ORDER', 'Limit buy 0.25 BTCUSDT @ 7,380.50', 'ACCEPTED', 'DEMO-001'],
      ['03:58:40', 'RISK', 'Stop sell checked against session limits', 'VALIDATED', 'DEMO-001'],
      ['03:42:11', 'FILL', 'Market buy 0.25 BTCUSDT @ 7,366.42', 'COMPLETE', 'DEMO-001']
    ]
  }
}

export const activityTabs = [
  ['POSITIONS', `POSITIONS  ${activityTables.POSITIONS.rows.length}`],
  ['ORDERS', `ORDERS  ${activityTables.ORDERS.rows.length}`],
  ['FILLS', `FILLS  ${activityTables.FILLS.rows.length}`],
  ['ACTIVITY', 'ACTIVITY'],
  ['ACCOUNT & RISK', 'ACCOUNT & RISK']
]

export const accountSummary = [
  { label: 'Unrealized P&L', tone: 'positive', value: '+$7.64' },
  { label: 'Realized P&L', tone: 'positive', value: '+$18.42' },
  { label: 'Estimated fees', value: '$0.75' },
  { label: 'Open positions', value: '2' },
  { label: 'Working orders', value: '2' }
]

export const riskLimits = [
  { label: 'Daily loss', detail: '$0.00 / $500', usage: 0 },
  { label: 'Gross position', detail: '0.35 / 1.00 BTC', usage: 35 },
  { label: 'Working orders', detail: '2 / 10', usage: 20 }
]
