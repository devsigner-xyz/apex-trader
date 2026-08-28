import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import {
  createUploadPlan,
  ensureBucketCors,
  isNotFound,
  marketDataAllowedOrigins,
  objectMatches,
  uploadCompiledMarketData,
  uploadArgumentsFrom
} from '../scripts/market-data-upload.mjs'
import { REQUIRED_MARKET_DATA_ASSET_IDS } from '../server/marketDataManifest.mjs'

function manifestFixture() {
  const datasetVersion = 'v4-0123456789abcdef'
  return {
    schema: 'apextrader.market-dataset-manifest/v4',
    datasetVersion,
    market: { exchange: 'bybit', marketType: 'spot', symbol: 'BTCUSDT' },
    assets: Object.fromEntries(
      REQUIRED_MARKET_DATA_ASSET_IDS.map((assetId) => [
        assetId,
        {
          key: `${datasetVersion}/${assetId}.json.gz`,
          sha256: 'a'.repeat(64),
          bytes: 1,
          contentType: 'application/json',
          contentEncoding: 'gzip'
        }
      ])
    )
  }
}

test('upload CLI only accepts a compiled root and derives the immutable manifest key', () => {
  assert.match(uploadArgumentsFrom([]).root, /\.cache\/bybit\/compiled$/)
  assert.match(uploadArgumentsFrom(['--root', '.cache/custom']).root, /\.cache\/custom$/)
  assert.throws(() => uploadArgumentsFrom(['--root']), /Missing value/)
  assert.throws(() => uploadArgumentsFrom(['--manifest-key', 'overwrite']), /Unknown option/)

  const plan = createUploadPlan(manifestFixture(), '/tmp/compiled')
  assert.equal(plan.manifestKey, 'v4-0123456789abcdef/manifest.json')
  assert.equal(plan.assets.length, 296)
})

test('upload plan rejects keys outside the immutable dataset prefix and collisions', () => {
  const outside = manifestFixture()
  outside.assets.session.key = 'another-version/session.json.gz'
  assert.throws(() => createUploadPlan(outside, '/tmp/compiled'), /outside dataset version/)

  const collision = manifestFixture()
  collision.assets.provenance.key = collision.assets.session.key
  assert.throws(() => createUploadPlan(collision, '/tmp/compiled'), /Duplicate asset key/)

  const version = manifestFixture()
  version.datasetVersion = '../mutable'
  assert.throws(() => createUploadPlan(version, '/tmp/compiled'), /Unexpected dataset version/)
})

test('existing immutable objects are reusable only when size and hash metadata match', () => {
  const asset = { bytes: 12, sha256: 'abc' }
  assert.equal(objectMatches({ ContentLength: 12, Metadata: { sha256: 'abc' } }, asset), true)
  assert.equal(objectMatches({ ContentLength: 11, Metadata: { sha256: 'abc' } }, asset), false)
  assert.equal(
    objectMatches({ ContentLength: 12, Metadata: { sha256: 'different' } }, asset),
    false
  )
  assert.equal(isNotFound({ name: 'NotFound' }), true)
  assert.equal(isNotFound({ $metadata: { httpStatusCode: 404 } }), true)
  assert.equal(isNotFound({ $metadata: { httpStatusCode: 403 } }), false)
})

test('bucket CORS accepts exact HTTPS origins and verifies GET/HEAD configuration', async () => {
  const origins = marketDataAllowedOrigins({
    MARKET_DATA_ALLOWED_ORIGINS:
      'https://apex.devsigner.xyz,https://apextrader-production.up.railway.app'
  })
  assert.deepEqual(origins, [
    'https://apex.devsigner.xyz',
    'https://apextrader-production.up.railway.app'
  ])
  assert.throws(() => marketDataAllowedOrigins({ MARKET_DATA_ALLOWED_ORIGINS: '*' }), /CORS origin/)
  assert.throws(
    () => marketDataAllowedOrigins({ MARKET_DATA_ALLOWED_ORIGINS: 'http://apex.devsigner.xyz' }),
    /exact HTTPS origins/
  )

  const commands = []
  const client = {
    async send(command) {
      commands.push(command)
      if (command.constructor.name === 'GetBucketCorsCommand') {
        return {
          CORSRules: [{ AllowedMethods: ['HEAD', 'GET'], AllowedOrigins: [...origins] }]
        }
      }
      return {}
    }
  }
  await ensureBucketCors(client, 'apex-market-data-test', origins)
  assert.equal(commands[0].constructor.name, 'PutBucketCorsCommand')
  assert.deepEqual(commands[0].input.CORSConfiguration.CORSRules[0].AllowedMethods, ['GET', 'HEAD'])
  assert.deepEqual(commands[0].input.CORSConfiguration.CORSRules[0].AllowedOrigins, origins)
  assert.equal(commands[1].constructor.name, 'GetBucketCorsCommand')
})

test('uploader validates every local asset before contacting the bucket', async (t) => {
  const root = await mkdtemp('/tmp/apex-upload-preflight-')
  t.after(() => rm(root, { force: true, recursive: true }))
  await writeFile(path.join(root, 'manifest-v4.json'), JSON.stringify(manifestFixture()))
  let requests = 0

  await assert.rejects(
    uploadCompiledMarketData({
      root,
      bucketClient: {
        config: { bucket: 'apex-market-data-test' },
        client: {
          async send() {
            requests += 1
            return {}
          }
        }
      }
    }),
    /ENOENT/
  )
  assert.equal(requests, 0)
})
