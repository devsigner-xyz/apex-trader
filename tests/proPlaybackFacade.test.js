import assert from 'node:assert/strict'
import test from 'node:test'
import * as facade from '../src/services/proPlayback.js'
import * as chunks from '../src/services/replay/playbackChunks.js'
import * as manifest from '../src/services/replay/runtimeManifest.js'
import * as view from '../src/services/replay/professionalView.js'

test('proPlayback remains the exact compatible public facade', () => {
  assert.deepEqual(Object.keys(facade).sort(), [
    'CHUNK_MS',
    'advanceProfessionalPlaybackTime',
    'aggregateProfessionalBars',
    'chunkIndexFor',
    'deriveProfessionalView',
    'deriveVolumeProfile',
    'formatCandleCloseCountdown',
    'loadLiquidityChunk',
    'loadPlaybackChunk',
    'loadProfessionalSession',
    'loadRuntimeManifest',
    'professionalDemoStart',
    'profileThrough',
    'reconstructBook',
    'tradesThrough'
  ])

  for (const name of ['CHUNK_MS', 'chunkIndexFor', 'loadLiquidityChunk', 'loadPlaybackChunk'])
    assert.equal(facade[name], chunks[name])
  for (const name of ['loadProfessionalSession', 'loadRuntimeManifest'])
    assert.equal(facade[name], manifest[name])
  for (const name of [
    'advanceProfessionalPlaybackTime',
    'aggregateProfessionalBars',
    'deriveProfessionalView',
    'deriveVolumeProfile',
    'formatCandleCloseCountdown',
    'professionalDemoStart',
    'profileThrough',
    'reconstructBook',
    'tradesThrough'
  ])
    assert.equal(facade[name], view[name])
})
