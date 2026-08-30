import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fetchHistoricalAsset,
  fetchPersistentAsset,
  historicalCacheName,
  recordPersistentChunk,
  removeStaleHistoricalCaches
} from '../src/services/historicalAssetCache.js'

test('timeouts retry, while intentional cancellations remain terminal', async (t) => {
  await t.test('timeout', async () => {
    const delays = []
    let requests = 0
    const response = await fetchHistoricalAsset('/asset', {
      fetchImpl: async () => {
        requests += 1
        if (requests === 1) throw new DOMException('timed out', 'TimeoutError')
        return new Response('recovered')
      },
      sleep: async (delay) => delays.push(delay)
    })

    assert.equal(await response.text(), 'recovered')
    assert.equal(requests, 2)
    assert.deepEqual(delays, [100])
  })

  await t.test('intentional cancellation', async () => {
    const delays = []
    let requests = 0
    await assert.rejects(
      () =>
        fetchHistoricalAsset('/asset', {
          fetchImpl: async () => {
            requests += 1
            throw new DOMException('cancelled', 'AbortError')
          },
          sleep: async (delay) => delays.push(delay)
        }),
      { name: 'AbortError' }
    )

    assert.equal(requests, 1)
    assert.deepEqual(delays, [])
  })
})

test('only the specified transport errors and HTTP statuses are retried', async (t) => {
  for (const status of [408, 429, 500, 599])
    await t.test(`HTTP ${status}`, async () => {
      const delays = []
      let requests = 0
      const response = await fetchHistoricalAsset('/asset', {
        fetchImpl: async () => {
          requests += 1
          return requests === 1 ? new Response(null, { status }) : new Response('recovered')
        },
        sleep: async (delay) => delays.push(delay)
      })

      assert.equal(await response.text(), 'recovered')
      assert.equal(requests, 2)
      assert.deepEqual(delays, [100])
    })

  await t.test('NetworkError', async () => {
    const delays = []
    let requests = 0
    const response = await fetchHistoricalAsset('/asset', {
      fetchImpl: async () => {
        requests += 1
        if (requests === 1) throw new DOMException('network changed', 'NetworkError')
        return new Response('recovered')
      },
      sleep: async (delay) => delays.push(delay)
    })

    assert.equal(await response.text(), 'recovered')
    assert.equal(requests, 2)
    assert.deepEqual(delays, [100])
  })

  for (const status of [400, 499])
    await t.test(`terminal HTTP ${status}`, async () => {
      const delays = []
      let requests = 0
      const response = await fetchHistoricalAsset('/asset', {
        fetchImpl: async () => {
          requests += 1
          return new Response(null, { status })
        },
        sleep: async (delay) => delays.push(delay)
      })

      assert.equal(response.status, status)
      assert.equal(requests, 1)
      assert.deepEqual(delays, [])
    })

  await t.test('generic application error', async () => {
    const delays = []
    let requests = 0
    await assert.rejects(
      () =>
        fetchHistoricalAsset('/asset', {
          fetchImpl: async () => {
            requests += 1
            throw new Error('terminal')
          },
          sleep: async (delay) => delays.push(delay)
        }),
      /terminal/
    )
    assert.equal(requests, 1)
    assert.deepEqual(delays, [])
  })
})

class MemoryCache {
  constructor() {
    this.responses = new Map()
  }

  async delete(url) {
    return this.responses.delete(url)
  }

  async match(url) {
    return this.responses.get(url)?.clone()
  }

  async put(url, response) {
    this.responses.set(url, response.clone())
  }
}

class MemoryCacheStorage {
  constructor() {
    this.caches = new Map()
  }

  async delete(name) {
    return this.caches.delete(name)
  }

  async keys() {
    return [...this.caches.keys()]
  }

  async open(name) {
    if (!this.caches.has(name)) this.caches.set(name, new MemoryCache())
    return this.caches.get(name)
  }
}

class MemoryStorage {
  constructor() {
    this.values = new Map()
  }

  get length() {
    return this.values.size
  }

  getItem(key) {
    return this.values.get(key) ?? null
  }

  key(index) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key) {
    this.values.delete(key)
  }

  setItem(key, value) {
    this.values.set(key, value)
  }
}

test('persistent historical assets are fetched once and then served from Cache Storage', async () => {
  const cacheStorage = new MemoryCacheStorage()
  const previousFetch = globalThis.fetch
  let requests = 0
  const fetchImpl = async () => {
    requests += 1
    return new Response('payload')
  }
  globalThis.fetch = fetchImpl
  try {
    const options = { cacheName: historicalCacheName('v3-test'), cacheStorage, fetchImpl }
    assert.equal(await (await fetchPersistentAsset('/asset', options)).text(), 'payload')
    assert.equal(await (await fetchPersistentAsset('/asset', options)).text(), 'payload')
    assert.equal(requests, 1)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('a Cache API write failure does not discard the network response', async () => {
  const previousFetch = globalThis.fetch
  let requests = 0
  const fetchImpl = async () => {
    requests += 1
    return new Response('network payload')
  }
  globalThis.fetch = fetchImpl
  try {
    const cacheStorage = {
      async open() {
        return {
          async match() {
            return undefined
          },
          async put() {
            throw new DOMException('Cache.put() encountered a network error', 'NetworkError')
          }
        }
      }
    }
    const response = await fetchPersistentAsset('/asset', {
      cacheName: historicalCacheName('v3-test'),
      cacheStorage,
      fetchImpl
    })
    assert.equal(await response.text(), 'network payload')
    assert.equal(requests, 1)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('chunk cache keeps the most recent indices and evicts both assets of older chunks', async () => {
  const cacheStorage = new MemoryCacheStorage()
  const storage = new MemoryStorage()
  const cacheName = historicalCacheName('v3-test')
  const cache = await cacheStorage.open(cacheName)
  const urls = (index) => [`book-${index}`, `trades-${index}`]
  for (const index of [0, 1, 2])
    for (const url of urls(index)) await cache.put(url, new Response(String(index)))

  for (const index of [0, 1, 2])
    await recordPersistentChunk({ cacheName, index, urls }, { cacheStorage, limit: 2, storage })

  assert.equal(await cache.match('book-0'), undefined)
  assert.equal(await cache.match('trades-0'), undefined)
  assert.equal(await (await cache.match('book-1')).text(), '1')
  assert.equal(await (await cache.match('trades-2')).text(), '2')
})

test('dataset version changes remove stale caches and their LRU metadata', async () => {
  const cacheStorage = new MemoryCacheStorage()
  const storage = new MemoryStorage()
  const active = historicalCacheName('v3-active')
  const stale = historicalCacheName('v3-stale')
  await cacheStorage.open(active)
  await cacheStorage.open(stale)
  storage.setItem(`apextrader.tardis.chunk-indices.${active}`, '[1]')
  storage.setItem(`apextrader.tardis.chunk-indices.${stale}`, '[2]')

  await removeStaleHistoricalCaches(active, cacheStorage, storage)

  assert.deepEqual(await cacheStorage.keys(), [active])
  assert.equal(storage.length, 1)
  assert.equal(storage.getItem(`apextrader.tardis.chunk-indices.${active}`), '[1]')
})
