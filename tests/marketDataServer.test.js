import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { gzipSync, gunzipSync } from 'node:zlib'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { once } from 'node:events'
import { Writable } from 'node:stream'
import test from 'node:test'
import { createMarketDataMiddleware } from '../server/marketDataMiddleware.mjs'
import {
  REQUIRED_MARKET_DATA_ASSET_IDS,
  validateMarketDataManifest
} from '../server/marketDataManifest.mjs'
import {
  createRailwayBucketManifestLoader,
  railwayBucketConfig
} from '../server/bucketPresigner.mjs'

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function fixtureManifest(asset) {
  return {
    schema: 'apextrader.market-dataset-manifest/v4',
    datasetVersion: 'bybit-spot-test',
    market: {
      exchange: 'bybit',
      marketType: 'spot',
      symbol: 'BTCUSDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT'
    },
    sessionStart: 1,
    sessionEndExclusive: 2,
    liquidityStart: 1,
    liquidityEnd: 2,
    assets: Object.fromEntries(REQUIRED_MARKET_DATA_ASSET_IDS.map((id) => [id, { ...asset }]))
  }
}

class CaptureResponse extends Writable {
  constructor() {
    super()
    this.statusCode = 200
    this.headers = {}
    this.chunks = []
  }

  _write(chunk, _encoding, callback) {
    this.chunks.push(Buffer.from(chunk))
    callback()
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode
    this.headers = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)])
    )
    return this
  }
}

async function invoke(middleware, url, { method = 'GET', headers = {} } = {}) {
  const response = new CaptureResponse()
  await middleware({ url, method, headers: { host: 'localhost', ...headers } }, response, () => {
    response.writeHead(404).end()
  })
  if (!response.writableFinished) await once(response, 'finish')
  return {
    status: response.statusCode,
    headers: response.headers,
    body: Buffer.concat(response.chunks)
  }
}

test('server exposes a sanitized manifest and immutable local assets', async () => {
  const root = await mkdtemp('/tmp/apex-market-data-')
  const payload = gzipSync(JSON.stringify({ ok: true }))
  const assetKey = 'bybit-spot-test/session.json.gz'
  await writeFile(
    path.join(root, 'manifest-v4.json'),
    JSON.stringify(
      fixtureManifest({
        key: assetKey,
        sha256: sha256(payload),
        bytes: payload.byteLength,
        contentType: 'application/json',
        contentEncoding: 'gzip'
      })
    )
  )
  await mkdir(path.dirname(path.join(root, assetKey)), { recursive: true })
  await writeFile(path.join(root, assetKey), payload)

  const middleware = createMarketDataMiddleware({
    localRoot: root,
    manifestPath: path.join(root, 'manifest-v4.json'),
    useLocalAssets: true
  })

  const manifestResponse = await invoke(middleware, '/api/market-data/manifest')
  assert.equal(manifestResponse.status, 200)
  assert.equal(manifestResponse.headers['cache-control'], 'public, max-age=0, must-revalidate')
  const publicManifest = JSON.parse(manifestResponse.body)
  assert.equal(publicManifest.assets.session.key, undefined)
  assert.equal(publicManifest.assets.session.href, '/api/market-data/assets/session')

  const assetResponse = await invoke(middleware, publicManifest.assets.session.href)
  assert.equal(assetResponse.status, 200)
  assert.equal(assetResponse.headers['cache-control'], 'public, max-age=31536000, immutable')
  assert.deepEqual(JSON.parse(gunzipSync(assetResponse.body)), { ok: true })

  const rejected = await invoke(middleware, '/api/market-data/assets/..%2Fsecret')
  assert.equal(rejected.status, 404)
})

test('production asset route signs only an ID resolved through the manifest allowlist', async () => {
  const payload = Buffer.from('{}')
  const asset = {
    key: 'bybit-spot-test/session.json.gz',
    sha256: sha256(payload),
    bytes: payload.byteLength,
    contentType: 'application/json',
    contentEncoding: 'gzip'
  }
  const signed = []
  const middleware = createMarketDataMiddleware({
    useLocalAssets: false,
    loadManifest: async () => fixtureManifest(asset),
    presignAsset: async (resolvedAsset) => {
      signed.push(resolvedAsset)
      return 'https://bucket.example/signed?signature=redacted'
    }
  })

  const response = await invoke(middleware, '/api/market-data/assets/session')
  assert.equal(response.status, 302)
  assert.equal(response.headers.location, 'https://bucket.example/signed?signature=redacted')
  assert.equal(response.headers['cache-control'], 'private, no-store')
  assert.deepEqual(signed, [asset])

  const unknown = await invoke(middleware, '/api/market-data/assets/private-key')
  assert.equal(unknown.status, 404)
  assert.equal(signed.length, 1)
})

test('server rejects cross-origin API calls unless explicitly allowed', async () => {
  const payload = Buffer.from('{}')
  const middleware = createMarketDataMiddleware({
    useLocalAssets: false,
    env: {},
    loadManifest: async () =>
      fixtureManifest({
        key: 'test/session.json.gz',
        sha256: sha256(payload),
        bytes: payload.byteLength,
        contentType: 'application/json',
        contentEncoding: 'gzip'
      }),
    presignAsset: async () => 'https://bucket.example/signed'
  })

  const response = await invoke(middleware, '/api/market-data/manifest', {
    headers: { origin: 'https://hostile.example' }
  })
  assert.equal(response.status, 403)
  assert.equal(response.headers['access-control-allow-origin'], undefined)
})

test('manifest validation rejects missing assets and unsafe keys', () => {
  const payload = Buffer.from('{}')
  const manifest = fixtureManifest({
    key: 'test/session.json.gz',
    sha256: sha256(payload),
    bytes: payload.byteLength,
    contentType: 'application/json',
    contentEncoding: 'gzip'
  })
  delete manifest.assets['liquidity-095']
  assert.throws(() => validateMarketDataManifest(manifest), /missing asset liquidity-095/)
  manifest.assets['liquidity-095'] = { ...manifest.assets.session, key: '../secret' }
  assert.throws(() => validateMarketDataManifest(manifest), /unsafe key/)
})

test('Railway Bucket credentials support the injected AWS variable names', () => {
  assert.deepEqual(
    railwayBucketConfig({
      AWS_ENDPOINT_URL: 'https://storage.railway.app',
      AWS_ACCESS_KEY_ID: 'access',
      AWS_SECRET_ACCESS_KEY: 'secret',
      AWS_S3_BUCKET_NAME: 'apex-data-123',
      AWS_DEFAULT_REGION: 'auto',
      AWS_S3_URL_STYLE: 'virtual'
    }),
    {
      endpoint: 'https://storage.railway.app',
      accessKeyId: 'access',
      secretAccessKey: 'secret',
      bucket: 'apex-data-123',
      region: 'auto',
      forcePathStyle: false
    }
  )
})

test('production manifest loader reads a fixed server key and caches the bucket response', async () => {
  let requests = 0
  let currentTime = 1_000
  const sent = []
  const manifest = fixtureManifest({
    key: 'test/session.json.gz',
    sha256: 'a'.repeat(64),
    bytes: 2,
    contentType: 'application/json',
    contentEncoding: 'gzip'
  })
  const load = createRailwayBucketManifestLoader({
    env: { MARKET_DATA_MANIFEST_KEY: 'bybit-spot-test/manifest.json' },
    cacheDurationMs: 100,
    now: () => currentTime,
    bucketClient: {
      config: { bucket: 'apex-data-test' },
      client: {
        async send(command) {
          requests += 1
          sent.push(command.input)
          return { Body: { transformToString: async () => JSON.stringify(manifest) } }
        }
      }
    }
  })

  assert.deepEqual(await load(), manifest)
  assert.deepEqual(await load(), manifest)
  assert.equal(requests, 1)
  currentTime += 101
  assert.deepEqual(await load(), manifest)
  assert.equal(requests, 2)
  assert.deepEqual(sent, [
    { Bucket: 'apex-data-test', Key: 'bybit-spot-test/manifest.json' },
    { Bucket: 'apex-data-test', Key: 'bybit-spot-test/manifest.json' }
  ])
})
