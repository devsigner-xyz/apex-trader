export const MARKET_DATA_MANIFEST_SCHEMA = 'apextrader.market-dataset-manifest/v4'

export const REQUIRED_MARKET_DATA_ASSET_IDS = Object.freeze([
  'session',
  'provenance',
  ...[5, 15, 30, 60, 240, 1440].map((timeframe) => `history-${timeframe}`),
  ...['book', 'trades', 'liquidity'].flatMap((kind) =>
    Array.from({ length: 96 }, (_, index) => `${kind}-${String(index).padStart(3, '0')}`)
  )
])

const SHA_256_PATTERN = /^[a-f0-9]{64}$/
const SAFE_ASSET_KEY_SEGMENT = /^(?!\.\.?$)[^/\\\0]+$/

function assert(condition, message) {
  if (!condition) throw new Error(`Invalid market data manifest: ${message}`)
}

export function isSafeAssetKey(key) {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    !key.startsWith('/') &&
    key.split('/').every((segment) => SAFE_ASSET_KEY_SEGMENT.test(segment))
  )
}

function validateAsset(assetId, asset) {
  assert(asset && typeof asset === 'object' && !Array.isArray(asset), `asset ${assetId}`)
  assert(isSafeAssetKey(asset.key), `unsafe key for ${assetId}`)
  assert(SHA_256_PATTERN.test(asset.sha256), `sha256 for ${assetId}`)
  assert(Number.isSafeInteger(asset.bytes) && asset.bytes > 0, `bytes for ${assetId}`)
  assert(asset.contentType === 'application/json', `contentType for ${assetId}`)
  assert(
    asset.contentEncoding === undefined || asset.contentEncoding === 'gzip',
    `contentEncoding for ${assetId}`
  )
}

export function validateMarketDataManifest(manifest) {
  assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest), 'root')
  assert(manifest.schema === MARKET_DATA_MANIFEST_SCHEMA, 'schema')
  assert(
    typeof manifest.datasetVersion === 'string' && manifest.datasetVersion.length > 0,
    'version'
  )
  assert(manifest.market?.exchange === 'bybit', 'exchange')
  assert(manifest.market?.marketType === 'spot', 'market type')
  assert(manifest.market?.symbol === 'BTCUSDT', 'symbol')
  assert(manifest.assets && typeof manifest.assets === 'object', 'assets')

  for (const assetId of REQUIRED_MARKET_DATA_ASSET_IDS) {
    assert(Object.hasOwn(manifest.assets, assetId), `missing asset ${assetId}`)
  }
  for (const [assetId, asset] of Object.entries(manifest.assets)) validateAsset(assetId, asset)

  return manifest
}

export function toPublicMarketDataManifest(manifest, assetUrl) {
  const validated = validateMarketDataManifest(manifest)
  return {
    ...validated,
    assets: Object.fromEntries(
      Object.entries(validated.assets).map(([assetId, asset]) => [
        assetId,
        {
          sha256: asset.sha256,
          bytes: asset.bytes,
          contentType: asset.contentType,
          ...(asset.contentEncoding ? { contentEncoding: asset.contentEncoding } : {}),
          href: assetUrl(assetId)
        }
      ])
    )
  }
}
