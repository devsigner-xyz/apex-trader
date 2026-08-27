import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeChartPanelSizes,
  normalizeChartPanelVisibility,
  normalizePanelSizes,
  normalizeWatchlistColumns,
  readPersistentValue,
  writePersistentValue
} from '../src/services/professionalTerminalPersistence.js'

test('normalizes workspace panel sizes with the existing defaults and limits', () => {
  assert.deepEqual(normalizePanelSizes({ dom: 999, execution: '260', watch: -1 }), {
    dom: 340,
    execution: 260,
    watch: 340
  })
  assert.deepEqual(normalizePanelSizes(null), { dom: 218, execution: 280, watch: 360 })
})

test('normalizes chart panel sizes and visibility with backward-compatible defaults', () => {
  assert.deepEqual(normalizeChartPanelSizes({ profile: 100, volume: 500 }), {
    profile: 120,
    volume: 200
  })
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
