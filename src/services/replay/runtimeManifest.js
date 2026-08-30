import {
  fetchHistoricalAsset,
  fetchPersistentAsset,
  historicalCacheName,
  removeStaleHistoricalCaches
} from '../historicalAssetCache.js'

const RUNTIME_MANIFEST_URL = 'data/tardis/manifest-v3.json'
const EXPECTED_MANIFEST_SCHEMA = 'apextrader.tardis-runtime-manifest/v3'

let runtimeManifestPromise = null

export function assetUrl(path) {
  const base = import.meta.env?.BASE_URL ?? '/'
  return `${base.replace(/\/$/, '')}/${path}`
}

async function fetchJson(url, fetchImpl = fetch, init, retryOptions) {
  const response = await fetchHistoricalAsset(assetUrl(url), {
    ...retryOptions,
    fetchImpl,
    init
  })
  if (!response.ok) throw new Error(`Unable to load historical asset (${response.status})`)
  return response.json()
}

export async function fetchGzipJson(url, fetchImpl = fetch, cacheName, retryOptions) {
  const response = await fetchPersistentAsset(assetUrl(url), {
    ...retryOptions,
    cacheName,
    fetchImpl
  })
  if (!response.ok) throw new Error(`Unable to load historical chunk (${response.status})`)
  // Vite and correctly configured CDNs transparently decode Content-Encoding.
  if (response.headers.get('content-encoding') === 'gzip') return response.json()
  if (typeof globalThis.DecompressionStream === 'undefined')
    throw new Error('This browser does not support gzip streaming.')
  const stream = response.body.pipeThrough(new globalThis.DecompressionStream('gzip'))
  return JSON.parse(await new Response(stream).text())
}

export function validateRuntimeManifest(manifest) {
  if (
    manifest?.schema !== EXPECTED_MANIFEST_SCHEMA ||
    !manifest.datasetVersion ||
    !manifest.assets?.session ||
    !manifest.assets?.bookChunkTemplate ||
    !manifest.assets?.tradeChunkTemplate
  )
    throw new Error('Unexpected historical runtime manifest.')
  return manifest
}

async function fetchRuntimeManifest(fetchImpl, retryOptions) {
  const manifest = validateRuntimeManifest(
    await fetchJson(RUNTIME_MANIFEST_URL, fetchImpl, undefined, retryOptions)
  )
  if (fetchImpl === globalThis.fetch)
    await removeStaleHistoricalCaches(historicalCacheName(manifest.datasetVersion))
  return manifest
}

export function loadRuntimeManifest(fetchImpl = fetch, retryOptions) {
  if (fetchImpl !== globalThis.fetch) return fetchRuntimeManifest(fetchImpl, retryOptions)
  if (!runtimeManifestPromise)
    runtimeManifestPromise = fetchRuntimeManifest(fetchImpl, retryOptions).catch((error) => {
      runtimeManifestPromise = null
      throw error
    })
  return runtimeManifestPromise
}

export function runtimeAssetPath(filename) {
  return `data/tardis/${filename}`
}

export function chunkAssetPaths(manifest, index) {
  const suffix = String(index).padStart(3, '0')
  const paths = {
    book: runtimeAssetPath(manifest.assets.bookChunkTemplate.replace('{index}', suffix)),
    trades: runtimeAssetPath(manifest.assets.tradeChunkTemplate.replace('{index}', suffix))
  }
  if (manifest.assets.liquidityChunkTemplate)
    paths.liquidity = runtimeAssetPath(
      manifest.assets.liquidityChunkTemplate.replace('{index}', suffix)
    )
  return paths
}

export async function loadProfessionalSession(fetchImpl = fetch, retryOptions) {
  const manifest = await loadRuntimeManifest(fetchImpl, retryOptions)
  const session = await fetchGzipJson(
    runtimeAssetPath(manifest.assets.session),
    fetchImpl,
    historicalCacheName(manifest.datasetVersion),
    retryOptions
  )
  if (session.schema !== 'apextrader.tardis-session/v2')
    throw new Error('Unexpected session schema.')
  return session
}
