import assert from 'node:assert/strict'
import test from 'node:test'
import { trackEvent } from '../src/services/analytics.js'

function withWindow(value, callback) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value, writable: true })
  try {
    callback()
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor)
    else delete globalThis.window
  }
}

test('sends named events with their properties through Umami when available', () => {
  const events = []
  withWindow(
    {
      umami: {
        track: (name, data) => events.push({ data, name })
      }
    },
    () => trackEvent('open_demo', { placement: 'hero' })
  )

  assert.deepEqual(events, [{ data: { placement: 'hero' }, name: 'open_demo' }])
})

test('does not affect the application when Umami is unavailable', () => {
  withWindow({}, () => assert.doesNotThrow(() => trackEvent('open_demo', { placement: 'hero' })))
})
