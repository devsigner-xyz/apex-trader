import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deriveChartLayerPresentation,
  deriveChartPanelStyle,
  deriveProfileMarkers,
  selectVisibleTimeTickIndexes
} from '../src/components/professional/chart/marketChartPresentation.js'

test('profile markers are omitted without a finite POC and retain their display contract otherwise', () => {
  assert.deepEqual(deriveProfileMarkers({ poc: Number.NaN }), [])
  assert.deepEqual(deriveProfileMarkers({ poc: 101, vah: 110, val: 90 }), [
    { label: 'VAH', price: 110, tone: 'value-area' },
    { label: 'POC', price: 101, tone: 'poc' },
    { label: 'VAL', price: 90, tone: 'value-area' }
  ])
})

test('chart layer presentation clamps derived dimensions and retains its mode settings', () => {
  const expanded = deriveChartLayerPresentation({
    range: 560,
    sourceTickSize: 1,
    step: 20,
    visible: [{ volume: 2 }, { volume: 9 }],
    visibleCount: 1
  })
  assert.equal(expanded.candleWidth, 11.6)
  assert.equal(expanded.volumeWidth, 9.6)
  assert.equal(expanded.maximumVisibleVolume, 9)
  assert.equal(expanded.footprintFontSize, 14)
  assert.equal(expanded.footprintDeltaFontSize, 14)
  assert.equal(expanded.footprintZoomScale, 1.6)
  assert.equal(expanded.stepDeltaFontSize, 19)
  assert.equal(expanded.footprintTickSize, expanded.footprintSettings.tickSize)
  assert.equal(expanded.stepProfileTickSize, expanded.stepProfileSettings.tickSize)
  assert.deepEqual(expanded.footprintSettings, {
    format: 'compact',
    imbalanceRatio: 3,
    minimumVolume: 0,
    mode: 'bidAsk',
    scale: 'linear',
    stackedImbalanceSize: 3,
    tickSize: expanded.footprintTickSize
  })

  const compact = deriveChartLayerPresentation({
    range: 1,
    sourceTickSize: 0.25,
    step: 2,
    visible: [],
    visibleCount: 100
  })
  assert.equal(compact.candleWidth, 4)
  assert.equal(compact.volumeWidth, 5)
  assert.equal(compact.maximumVisibleVolume, 1)
  assert.equal(compact.footprintFontSize, 10)
  assert.equal(compact.footprintDeltaFontSize, 11)
  assert.equal(compact.footprintZoomScale, 1)
  assert.equal(compact.stepDeltaFontSize, 13)
  assert.equal(compact.footprintTickSize, 0.25)
  assert.equal(compact.stepProfileTickSize, 0.25)
})

test('visible time ticks retain only labels inside the padded plot bounds', () => {
  assert.deepEqual(selectVisibleTimeTickIndexes([0, 100, 200], 0, 200), [1])
  assert.deepEqual(selectVisibleTimeTickIndexes([0, 100, 200], 300, 400), [])
})

test('chart panel style collapses both panel dimensions when volume is hidden', () => {
  assert.deepEqual(deriveChartPanelStyle({ volume: 118 }, { volume: true }), {
    '--volume-panel-height': '118px',
    '--volume-resizer-height': '7px'
  })
  assert.deepEqual(deriveChartPanelStyle({ volume: 118 }, { volume: false }), {
    '--volume-panel-height': '0px',
    '--volume-resizer-height': '0px'
  })
})
