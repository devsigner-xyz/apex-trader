import { historicalCacheName, recordPersistentChunk } from '../historicalAssetCache.js'
import { normalizeLiquidityTile } from '../liquidityHeatmap.js'
import { assetUrl, chunkAssetPaths, fetchGzipJson, loadRuntimeManifest } from './runtimeManifest.js'

export const CHUNK_MS = 15 * 60 * 1000

const playbackChunkCache = new Map()
const liquidityChunkCache = new Map()

export function chunkIndexFor(timestamp, sessionStart) {
  return Math.max(0, Math.min(95, Math.floor((timestamp - sessionStart) / CHUNK_MS)))
}

async function fetchPlaybackChunk(index, fetchImpl, retryOptions) {
  const manifest = await loadRuntimeManifest(fetchImpl, retryOptions)
  const paths = chunkAssetPaths(manifest, index)
  const cacheName = historicalCacheName(manifest.datasetVersion)
  const [book, trades] = await Promise.all([
    fetchGzipJson(paths.book, fetchImpl, cacheName, retryOptions),
    fetchGzipJson(paths.trades, fetchImpl, cacheName, retryOptions)
  ])
  if (fetchImpl === globalThis.fetch)
    await recordPersistentChunk(
      {
        cacheName,
        index,
        urls: (nextIndex) => Object.values(chunkAssetPaths(manifest, nextIndex)).map(assetUrl)
      },
      { limit: manifest.cache?.chunkLimit }
    )
  return { book, index, trades }
}

export function loadPlaybackChunk(index, fetchImpl = fetch, retryOptions) {
  if (fetchImpl !== globalThis.fetch) return fetchPlaybackChunk(index, fetchImpl, retryOptions)
  if (!playbackChunkCache.has(index)) {
    const request = fetchPlaybackChunk(index, fetchImpl, retryOptions).catch((error) => {
      playbackChunkCache.delete(index)
      throw error
    })
    playbackChunkCache.set(index, request)
  }
  return playbackChunkCache.get(index)
}

async function fetchLiquidityChunk(index, fetchImpl, retryOptions) {
  const manifest = await loadRuntimeManifest(fetchImpl, retryOptions)
  if (!manifest.assets?.liquidityChunkTemplate)
    throw new Error('The historical dataset does not include liquidity tiles.')
  const paths = chunkAssetPaths(manifest, index)
  const cacheName = historicalCacheName(manifest.datasetVersion)
  const raw = await fetchGzipJson(paths.liquidity, fetchImpl, cacheName, retryOptions)
  if (fetchImpl === globalThis.fetch)
    await recordPersistentChunk(
      {
        cacheName,
        index,
        urls: (nextIndex) => Object.values(chunkAssetPaths(manifest, nextIndex)).map(assetUrl)
      },
      { limit: manifest.cache?.chunkLimit }
    )
  return normalizeLiquidityTile(raw, manifest.liquidity?.normalizationMaxAmount)
}

export function loadLiquidityChunk(index, fetchImpl = fetch, retryOptions) {
  if (fetchImpl !== globalThis.fetch) return fetchLiquidityChunk(index, fetchImpl, retryOptions)
  if (!liquidityChunkCache.has(index)) {
    const request = fetchLiquidityChunk(index, fetchImpl, retryOptions).catch((error) => {
      liquidityChunkCache.delete(index)
      throw error
    })
    liquidityChunkCache.set(index, request)
  }
  return liquidityChunkCache.get(index)
}
