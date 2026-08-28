import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { normalizeLiquidityTile } from '../src/services/liquidityHeatmap.js'

const root = new URL('../public/data/tardis/', import.meta.url)

async function compressedJson(relativePath) {
  return JSON.parse(gunzipSync(await readFile(new URL(relativePath, root))))
}

test('published liquidity manifest and edge tiles preserve the session contract', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest-v3.json', root), 'utf8'))
  assert.equal(manifest.statistics.liquidityChunks, 96)
  assert.equal(manifest.liquidity.sampleDurationMs, 5000)
  assert.equal(manifest.liquidity.priceStep, 1)
  assert.equal(manifest.liquidity.normalizationMaxAmount, 70.16)

  for (const index of [0, 95]) {
    const suffix = String(index).padStart(3, '0')
    const raw = await compressedJson(
      manifest.assets.liquidityChunkTemplate.replace('{index}', suffix)
    )
    const tile = normalizeLiquidityTile(raw, manifest.liquidity.normalizationMaxAmount)
    assert.equal(tile.sampleCount, 180)
    assert.equal(tile.priceCount, 832)
    assert.ok(tile.values.some((value) => value > 0))
  }
})
