export const HISTORICAL_CACHE_PREFIX = 'apextrader-tardis-'
export const DEFAULT_PERSISTENT_CHUNK_LIMIT = 16

const CHUNK_INDEX_KEY_PREFIX = 'apextrader.tardis.chunk-indices.'

function browserCacheStorage() {
  return typeof globalThis.caches === 'undefined' ? null : globalThis.caches
}

function browserStorage() {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage
  } catch {
    return null
  }
}

function readIndices(storage, key) {
  try {
    const value = JSON.parse(storage?.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter(Number.isInteger) : []
  } catch {
    return []
  }
}

function writeIndices(storage, key, indices) {
  try {
    storage?.setItem(key, JSON.stringify(indices))
  } catch {
    // Storage quotas and privacy modes must never block playback.
  }
}

export function historicalCacheName(datasetVersion) {
  return `${HISTORICAL_CACHE_PREFIX}${datasetVersion}`
}

export async function removeStaleHistoricalCaches(
  activeCacheName,
  cacheStorage = browserCacheStorage(),
  storage = browserStorage()
) {
  if (!cacheStorage?.keys) return
  const names = await cacheStorage.keys()
  const stale = names.filter(
    (name) => name.startsWith(HISTORICAL_CACHE_PREFIX) && name !== activeCacheName
  )
  await Promise.all(stale.map((name) => cacheStorage.delete(name)))
  if (!storage?.length || !storage?.key) return
  const activeKey = `${CHUNK_INDEX_KEY_PREFIX}${activeCacheName}`
  const staleKeys = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith(CHUNK_INDEX_KEY_PREFIX) && key !== activeKey) staleKeys.push(key)
  }
  for (const key of staleKeys) storage.removeItem(key)
}

export async function fetchPersistentAsset(
  url,
  { cacheName, cacheStorage = browserCacheStorage(), fetchImpl = globalThis.fetch }
) {
  if (!cacheStorage?.open || fetchImpl !== globalThis.fetch) return fetchImpl(url)
  const cache = await cacheStorage.open(cacheName)
  const cached = await cache.match(url)
  if (cached) return cached
  const response = await fetchImpl(url, { cache: 'force-cache' })
  if (response.ok) await cache.put(url, response.clone())
  return response
}

export async function recordPersistentChunk(
  { cacheName, index, urls },
  {
    cacheStorage = browserCacheStorage(),
    limit = DEFAULT_PERSISTENT_CHUNK_LIMIT,
    storage = browserStorage()
  } = {}
) {
  if (!cacheStorage?.open || !storage || limit <= 0) return
  const key = `${CHUNK_INDEX_KEY_PREFIX}${cacheName}`
  const indices = readIndices(storage, key).filter((value) => value !== index)
  indices.push(index)
  const evicted = indices.splice(0, Math.max(0, indices.length - limit))
  writeIndices(storage, key, indices)
  if (!evicted.length) return
  const cache = await cacheStorage.open(cacheName)
  await Promise.all(
    evicted.flatMap((chunkIndex) => urls(chunkIndex).map((url) => cache.delete(url)))
  )
}
