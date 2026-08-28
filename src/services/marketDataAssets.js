export const MARKET_DATA_MANIFEST_URL = '/api/market-data/manifest'
export const MARKET_DATA_MANIFEST_SCHEMA = 'apextrader.market-dataset-manifest/v4'

const ASSET_HREF_PREFIX = '/api/market-data/assets/'

export function marketDataChunkAssetId(kind, index) {
  if (!['book', 'trades', 'liquidity'].includes(kind)) throw new Error('Unknown asset kind.')
  if (!Number.isInteger(index) || index < 0 || index > 95) throw new Error('Invalid chunk index.')
  return `${kind}-${String(index).padStart(3, '0')}`
}

export function validatePublicMarketDataManifest(manifest) {
  if (
    manifest?.schema !== MARKET_DATA_MANIFEST_SCHEMA ||
    !manifest.datasetVersion ||
    manifest.market?.exchange !== 'bybit' ||
    manifest.market?.marketType !== 'spot' ||
    manifest.market?.symbol !== 'BTCUSDT' ||
    !manifest.assets
  ) {
    throw new Error('Unexpected market data manifest.')
  }
  for (const [assetId, asset] of Object.entries(manifest.assets)) {
    if (
      typeof assetId !== 'string' ||
      typeof asset?.href !== 'string' ||
      !asset.href.startsWith(ASSET_HREF_PREFIX) ||
      asset.href.slice(ASSET_HREF_PREFIX.length) !== encodeURIComponent(assetId) ||
      'key' in asset
    ) {
      throw new Error('Unexpected market data asset.')
    }
  }
  return manifest
}

export async function loadMarketDataManifest(fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(MARKET_DATA_MANIFEST_URL, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Unable to load market data manifest (${response.status}).`)
  return validatePublicMarketDataManifest(await response.json())
}

export function marketDataAssetUrl(manifest, assetId) {
  const asset = manifest.assets?.[assetId]
  if (!asset) throw new Error(`Unknown market data asset: ${assetId}`)
  return asset.href
}

export async function fetchMarketDataAsset(manifest, assetId, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(marketDataAssetUrl(manifest, assetId))
  if (!response.ok)
    throw new Error(`Unable to load market data asset ${assetId} (${response.status}).`)
  return response
}
