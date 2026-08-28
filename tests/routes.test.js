import assert from 'node:assert/strict'
import test from 'node:test'
import { demoPathForMode, resolveRoute } from '../src/app/routes.js'

test('resolves the landing and canonical demo paths', () => {
  assert.deepEqual(resolveRoute('/'), { canonicalPath: '/', kind: 'landing' })
  assert.deepEqual(resolveRoute('/demo'), {
    canonicalPath: '/demo',
    kind: 'demo',
    mode: 'candles'
  })
  assert.deepEqual(resolveRoute('/demo/footprint/'), {
    canonicalPath: '/demo/footprint',
    kind: 'demo',
    mode: 'footprint'
  })
  assert.deepEqual(resolveRoute('/demo/step-profile'), {
    canonicalPath: '/demo/step-profile',
    kind: 'demo',
    mode: 'step-profile'
  })
})

test('marks legacy demo paths for canonical replacement', () => {
  assert.deepEqual(resolveRoute('/price-chart'), {
    canonicalPath: '/demo',
    kind: 'demo',
    mode: 'candles',
    replace: true
  })
  assert.deepEqual(resolveRoute('/footprint'), {
    canonicalPath: '/demo/footprint',
    kind: 'demo',
    mode: 'footprint',
    replace: true
  })
  assert.deepEqual(resolveRoute('/step-profile'), {
    canonicalPath: '/demo/step-profile',
    kind: 'demo',
    mode: 'step-profile',
    replace: true
  })
})

test('replaces unknown paths with the landing', () => {
  assert.deepEqual(resolveRoute('/unknown/product/path'), {
    canonicalPath: '/',
    kind: 'landing',
    replace: true
  })
})

test('builds only supported canonical demo paths', () => {
  assert.equal(demoPathForMode('candles'), '/demo')
  assert.equal(demoPathForMode('footprint'), '/demo/footprint')
  assert.equal(demoPathForMode('step-profile'), '/demo/step-profile')
  assert.equal(demoPathForMode('unsupported'), '/demo')
})
