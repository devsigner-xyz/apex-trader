import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fetchMarketDataAsset,
  loadMarketDataManifest,
  marketDataAssetUrl,
  marketDataChunkAssetId,
  validatePublicMarketDataManifest
} from '../src/services/marketDataAssets.js'

const manifest = {
  schema: 'apextrader.market-dataset-manifest/v4',
  datasetVersion: 'bybit-spot-test',
  market: { exchange: 'bybit', marketType: 'spot', symbol: 'BTCUSDT' },
  assets: {
    session: {
      sha256: 'a'.repeat(64),
      bytes: 12,
      contentType: 'application/json',
      contentEncoding: 'gzip',
      href: '/api/market-data/assets/session'
    }
  }
}

test('market data manifest is loaded from the same-origin API', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push([url, options])
    return Response.json(manifest)
  }

  assert.deepEqual(await loadMarketDataManifest(fetchImpl), manifest)
  assert.deepEqual(calls, [['/api/market-data/manifest', { cache: 'no-cache' }]])
})

test('public manifests cannot expose bucket keys or arbitrary asset hrefs', () => {
  assert.throws(
    () =>
      validatePublicMarketDataManifest({
        ...manifest,
        assets: { session: { ...manifest.assets.session, key: 'private/session.json.gz' } }
      }),
    /Unexpected market data asset/
  )
  assert.throws(
    () =>
      validatePublicMarketDataManifest({
        ...manifest,
        assets: { session: { ...manifest.assets.session, href: 'https://storage.example/session' } }
      }),
    /Unexpected market data asset/
  )
})

test('asset helpers only resolve allowlisted manifest IDs and valid chunk ranges', async () => {
  assert.equal(marketDataChunkAssetId('book', 4), 'book-004')
  assert.throws(() => marketDataChunkAssetId('book', 96), /Invalid chunk index/)
  assert.throws(() => marketDataChunkAssetId('orders', 0), /Unknown asset kind/)
  assert.equal(marketDataAssetUrl(manifest, 'session'), '/api/market-data/assets/session')
  assert.throws(() => marketDataAssetUrl(manifest, '../secret'), /Unknown market data asset/)

  const response = await fetchMarketDataAsset(manifest, 'session', async (url) => {
    assert.equal(url, '/api/market-data/assets/session')
    return new Response('session')
  })
  assert.equal(await response.text(), 'session')
})
