export const HISTORICAL_CACHE_PREFIX = 'apextrader-tardis-'
export const DEFAULT_PERSISTENT_CHUNK_LIMIT = 16

const CHUNK_INDEX_KEY_PREFIX = 'apextrader.tardis.chunk-indices.'
const HISTORICAL_FETCH_DELAYS_MS = [100, 200]

function sleep(delay) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delay))
}

function isRecoverableResponse(response) {
  return (
    response.status === 408 ||
    response.status === 429 ||
    (response.status >= 500 && response.status <= 599)
  )
}

function isRecoverableFetchError(error) {
  if (error?.name === 'AbortError') return false
  return (
    error instanceof TypeError || error?.name === 'NetworkError' || error?.name === 'TimeoutError'
  )
}

export async function fetchHistoricalAsset(
  url,
  { fetchImpl = globalThis.fetch, init, sleep: sleepImpl = sleep } = {}
) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetchImpl(url, init)
      const delay = HISTORICAL_FETCH_DELAYS_MS[attempt]
      if (!response.ok && isRecoverableResponse(response) && delay !== undefined) {
        await sleepImpl(delay)
        continue
      }
      return response
    } catch (error) {
      const delay = HISTORICAL_FETCH_DELAYS_MS[attempt]
      if (!isRecoverableFetchError(error) || delay === undefined) throw error
      await sleepImpl(delay)
    }
  }
}

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
  let names
  try {
    names = await cacheStorage.keys()
  } catch {
    return
  }
  const stale = names.filter(
    (name) => name.startsWith(HISTORICAL_CACHE_PREFIX) && name !== activeCacheName
  )
  await Promise.allSettled(stale.map((name) => cacheStorage.delete(name)))
  if (!storage?.length || !storage?.key) return
  const activeKey = `${CHUNK_INDEX_KEY_PREFIX}${activeCacheName}`
  const staleKeys = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key?.startsWith(CHUNK_INDEX_KEY_PREFIX) && key !== activeKey) staleKeys.push(key)
  }
  for (const key of staleKeys)
    try {
      storage.removeItem(key)
    } catch {
      // Persistent storage is an optimization and must never block playback.
    }
}

export async function fetchPersistentAsset(
  url,
  {
    cacheName,
    cacheStorage = browserCacheStorage(),
    fetchImpl = globalThis.fetch,
    sleep: sleepImpl
  }
) {
  const fetchNetwork = (init) =>
    fetchHistoricalAsset(url, { fetchImpl, init, sleep: sleepImpl })
  if (!cacheStorage?.open || fetchImpl !== globalThis.fetch) return fetchNetwork()
  let cache
  let cached
  try {
    cache = await cacheStorage.open(cacheName)
    cached = await cache.match(url)
  } catch {
    return fetchNetwork()
  }
  if (cached) return cached
  const response = await fetchNetwork({ cache: 'force-cache' })
  if (response.ok)
    try {
      await cache.put(url, response.clone())
    } catch {
      // A Cache API failure must not discard an otherwise valid network response.
    }
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
  try {
    const cache = await cacheStorage.open(cacheName)
    await Promise.allSettled(
      evicted.flatMap((chunkIndex) => urls(chunkIndex).map((url) => cache.delete(url)))
    )
  } catch {
    // Eviction is best-effort and must never block playback.
  }
}
