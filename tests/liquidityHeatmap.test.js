import assert from 'node:assert/strict'
import test from 'node:test'
import {
  averageLiquidityAt,
  createLiquidityColorLut,
  decodeLiquidityValues,
  liquiditySampleAt,
  liquidityTileValue,
  normalizeLiquidityTile
} from '../src/services/liquidityHeatmap.js'

function encoded(values) {
  const bytes = new Uint8Array(values.length * 2)
  const view = new DataView(bytes.buffer)
  values.forEach((value, index) => view.setUint16(index * 2, value, true))
  return Buffer.from(bytes).toString('base64')
}

test('liquidity tiles decode little-endian uint16 amounts deterministically', () => {
  assert.deepEqual([...decodeLiquidityValues(encoded([0, 125, 65_535]), 3)], [0, 125, 65_535])
  assert.throws(() => decodeLiquidityValues(encoded([1]), 2), /byte length/)
})

test('liquidity samples remain aligned to exact time and price bins', () => {
  const tile = normalizeLiquidityTile(
    {
      amountScale: 100,
      chunkStart: 1000,
      priceCount: 3,
      priceMin: 99,
      priceStep: 1,
      sampleCount: 2,
      sampleDurationMs: 5000,
      schema: 'apextrader.liquidity-tile/v1',
      values: encoded([0, 150, 0, 225, 0, 400])
    },
    25
  )
  assert.equal(liquidityTileValue(tile, 0, 1), 1.5)
  assert.equal(liquiditySampleAt(tile, 1001, 100.2), 150)
  assert.equal(liquiditySampleAt(tile, 6001, 99.2), 225)
  assert.equal(liquiditySampleAt(tile, 6001, 101.2), 400)
  assert.equal(liquiditySampleAt(tile, 11_001, 101.2), 0)
})

test('the logarithmic palette increases opacity with liquidity and respects intensity', () => {
  const subtle = createLiquidityColorLut({
    amountScale: 100,
    intensity: 0.4,
    normalizationMaxAmount: 25
  })
  const strong = createLiquidityColorLut({
    amountScale: 100,
    intensity: 0.8,
    normalizationMaxAmount: 25
  })
  assert.equal(subtle[3], 0)
  assert.ok(subtle[2500 * 4 + 3] > subtle[100 * 4 + 3])
  assert.ok(strong[100 * 4 + 3] > subtle[100 * 4 + 3])
})

test('higher-timeframe liquidity uses a time-weighted mean including empty samples', () => {
  const tile = normalizeLiquidityTile(
    {
      amountScale: 100,
      chunkStart: 1000,
      priceCount: 2,
      priceMin: 99,
      priceStep: 1,
      sampleCount: 3,
      sampleDurationMs: 5000,
      schema: 'apextrader.liquidity-tile/v1',
      values: encoded([0, 100, 0, 300, 0, 0])
    },
    25
  )

  assert.equal(averageLiquidityAt([tile], 1000, 16_000, 100.2), 133)
  assert.equal(averageLiquidityAt([tile], 1000, 16_000, 99.2), 0)
})
