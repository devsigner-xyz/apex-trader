import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeChartAppearance,
  normalizeChartLiquidity,
  normalizeChartPanelSizes,
  normalizeChartPanelVisibility,
  normalizePanelSizes,
  normalizeWatchlistColumns,
  readPersistentValue,
  writePersistentValue
} from '../src/services/professionalTerminalPersistence.js'

test('normalizes persistent chart appearance within the candles mode only', () => {
  assert.deepEqual(normalizeChartAppearance(), { candles: { down: null, up: null } })
  assert.deepEqual(
    normalizeChartAppearance({
      candles: { down: '#ABCDEF', up: '#123456' },
      footprint: { down: '#111111', up: '#222222' }
    }),
    { candles: { down: '#abcdef', up: '#123456' } }
  )
  assert.deepEqual(normalizeChartAppearance({ candles: { down: 'red', up: '#12345' } }), {
    candles: { down: null, up: null }
  })
})

test('normalizes workspace panel sizes with the existing defaults and limits', () => {
  assert.deepEqual(normalizePanelSizes({ dom: 999, execution: '260', watch: -1 }), {
    dom: 340,
    execution: 260,
    watch: 340
  })
  assert.deepEqual(normalizePanelSizes(null), { dom: 218, execution: 280, watch: 360 })
})

test('normalizes only the resizable chart volume panel size', () => {
  assert.deepEqual(normalizeChartPanelSizes(), { volume: 110 })
  assert.deepEqual(normalizeChartPanelSizes({ profile: 100, volume: 500 }), { volume: 200 })
  assert.deepEqual(normalizeChartPanelSizes({ profile: 280, volume: 60 }), { volume: 72 })
  assert.deepEqual(
    normalizeChartPanelVisibility({ profile: false, valueArea: false, volume: 'false' }),
    {
      profile: false,
      valueArea: false,
      volume: true
    }
  )
  assert.deepEqual(normalizeChartPanelVisibility({ profile: false, volume: false }), {
    profile: false,
    valueArea: true,
    volume: false
  })
})

test('reads legacy chart panel sizes and writes the normalized volume size alone', () => {
  const values = new Map([['chart-panel-sizes', '{"profile":180,"volume":118}']])
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  }

  assert.deepEqual(readPersistentValue(storage, 'chart-panel-sizes', normalizeChartPanelSizes), {
    volume: 118
  })
  assert.equal(
    writePersistentValue(
      storage,
      'chart-panel-sizes',
      normalizeChartPanelSizes({ profile: 120, volume: 400 })
    ),
    true
  )
  assert.equal(values.get('chart-panel-sizes'), '{"volume":200}')
})

test('normalizes persistent liquidity heatmap controls', () => {
  assert.deepEqual(normalizeChartLiquidity(), { enabled: true, intensity: 0.6 })
  assert.deepEqual(normalizeChartLiquidity({ enabled: false, intensity: 2 }), {
    enabled: false,
    intensity: 1
  })
  assert.deepEqual(normalizeChartLiquidity({ enabled: 'false', intensity: 0.05 }), {
    enabled: true,
    intensity: 0.2
  })
})

test('keeps only known optional watchlist columns in canonical order', () => {
  assert.deepEqual(normalizeWatchlistColumns(['volume', 'unknown', 'bid']), ['bid', 'volume'])
  assert.deepEqual(normalizeWatchlistColumns(null), ['bid', 'ask', 'change', 'volume'])
})

test('reads and writes JSON through an injected storage adapter', () => {
  const values = new Map([['layout', '{"dom":250,"execution":300,"watch":400}']])
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  }

  assert.deepEqual(readPersistentValue(storage, 'layout', normalizePanelSizes), {
    dom: 250,
    execution: 300,
    watch: 400
  })
  assert.equal(
    writePersistentValue(storage, 'visible', {
      profile: false,
      valueArea: false,
      volume: true
    }),
    true
  )
  assert.equal(values.get('visible'), '{"profile":false,"valueArea":false,"volume":true}')
  assert.deepEqual(readPersistentValue(storage, 'missing', normalizePanelSizes), {
    dom: 218,
    execution: 280,
    watch: 360
  })
})

test('falls back safely when storage cannot be read or written', () => {
  const storage = {
    getItem: () => {
      throw new Error('unavailable')
    },
    setItem: () => {
      throw new Error('unavailable')
    }
  }

  assert.deepEqual(readPersistentValue(storage, 'layout', normalizePanelSizes), {
    dom: 218,
    execution: 280,
    watch: 360
  })
  assert.equal(writePersistentValue(storage, 'layout', {}), false)
})
