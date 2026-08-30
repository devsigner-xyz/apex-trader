import assert from 'node:assert/strict'
import test from 'node:test'
import { gzipSync } from 'node:zlib'
import {
  assetUrl,
  chunkAssetPaths,
  loadProfessionalSession,
  loadRuntimeManifest,
  runtimeAssetPath,
  validateRuntimeManifest
} from '../src/services/replay/runtimeManifest.js'

const manifest = {
  assets: {
    bookChunkTemplate: 'datasets/v3-test/chunks/book-{index}.json.gz',
    liquidityChunkTemplate: 'datasets/v3-test/liquidity/liquidity-{index}.json.gz',
    session: 'datasets/v3-test/session.json.gz',
    tradeChunkTemplate: 'datasets/v3-test/chunks/trades-{index}.json.gz'
  },
  datasetVersion: 'v3-test',
  schema: 'apextrader.tardis-runtime-manifest/v3'
}

function gzipResponse(value) {
  return new Response(gzipSync(`${JSON.stringify(value)}\n`), {
    headers: { 'content-type': 'application/gzip' }
  })
}

test('runtime manifest helpers resolve canonical and legacy asset paths directly', () => {
  assert.equal(assetUrl('data/tardis/manifest-v3.json'), '/data/tardis/manifest-v3.json')
  assert.equal(runtimeAssetPath('session.json.gz'), 'data/tardis/session.json.gz')
  assert.equal(validateRuntimeManifest(manifest), manifest)
  assert.deepEqual(chunkAssetPaths(manifest, 7), {
    book: 'data/tardis/datasets/v3-test/chunks/book-007.json.gz',
    liquidity: 'data/tardis/datasets/v3-test/liquidity/liquidity-007.json.gz',
    trades: 'data/tardis/datasets/v3-test/chunks/trades-007.json.gz'
  })
  assert.deepEqual(
    chunkAssetPaths(
      { ...manifest, assets: { ...manifest.assets, liquidityChunkTemplate: undefined } },
      95
    ),
    {
      book: 'data/tardis/datasets/v3-test/chunks/book-095.json.gz',
      trades: 'data/tardis/datasets/v3-test/chunks/trades-095.json.gz'
    }
  )
})

test('runtime manifest validation rejects every required-field omission', () => {
  const invalid = [
    null,
    { ...manifest, schema: 'unexpected' },
    { ...manifest, datasetVersion: '' },
    { ...manifest, assets: { ...manifest.assets, session: '' } },
    { ...manifest, assets: { ...manifest.assets, bookChunkTemplate: '' } },
    { ...manifest, assets: { ...manifest.assets, tradeChunkTemplate: '' } }
  ]
  for (const value of invalid)
    assert.throws(() => validateRuntimeManifest(value), /Unexpected historical runtime manifest/)
})

test('the runtime manifest module directly loads and validates the compressed session', async () => {
  const requested = []
  const session = {
    bars: [],
    schema: 'apextrader.tardis-session/v2',
    sessionStart: 0
  }
  const fetchImpl = async (url) => {
    requested.push(url)
    if (url.endsWith('manifest-v3.json')) return Response.json(manifest)
    if (url.endsWith('session.json.gz')) return gzipResponse(session)
    return new Response(null, { status: 404 })
  }

  assert.deepEqual(await loadProfessionalSession(fetchImpl), session)
  assert.deepEqual(requested, [
    '/data/tardis/manifest-v3.json',
    '/data/tardis/datasets/v3-test/session.json.gz'
  ])
})

test('the global manifest singleton deduplicates work and clears a rejected promise', async () => {
  const previousFetch = globalThis.fetch
  const delays = []
  let requests = 0
  const fetchImpl = async () => {
    requests += 1
    if (requests <= 3) return new Response(null, { status: 503 })
    return Response.json(manifest)
  }
  globalThis.fetch = fetchImpl
  try {
    const retryOptions = { sleep: async (delay) => delays.push(delay) }
    await assert.rejects(
      () => loadRuntimeManifest(fetchImpl, retryOptions),
      /Unable to load historical asset \(503\)/
    )
    assert.equal(requests, 3)
    assert.deepEqual(delays, [100, 200])

    const recovered = loadRuntimeManifest(fetchImpl, retryOptions)
    assert.equal(loadRuntimeManifest(fetchImpl, retryOptions), recovered)
    assert.deepEqual(await recovered, manifest)
    assert.equal(requests, 4)
  } finally {
    globalThis.fetch = previousFetch
  }
})
