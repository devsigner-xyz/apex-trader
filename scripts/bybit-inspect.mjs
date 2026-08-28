#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { applyBookMessage, createBookState, normalizeBookMessage } from './bybit-core.mjs'

const file = process.argv[2] ?? '.cache/bybit/raw/2026-07-31_BTCUSDT_ob200.data.zip'
const unzip = spawn('unzip', ['-p', file], { stdio: ['ignore', 'pipe', 'inherit'] })
const input = createInterface({ crlfDelay: Infinity, input: unzip.stdout })
const state = createBookState()
const statistics = {
  deltas: 0,
  first: null,
  last: null,
  lines: 0,
  maxAsks: 0,
  maxBids: 0,
  minAsks: Number.POSITIVE_INFINITY,
  minBids: Number.POSITIVE_INFINITY,
  snapshots: 0
}

for await (const line of input) {
  if (!line) continue
  const message = normalizeBookMessage(JSON.parse(line))
  applyBookMessage(state, message)
  statistics.lines += 1
  statistics[message.type === 'snapshot' ? 'snapshots' : 'deltas'] += 1
  statistics.first ??= message
  statistics.last = message
  statistics.maxAsks = Math.max(statistics.maxAsks, state.asks.size)
  statistics.maxBids = Math.max(statistics.maxBids, state.bids.size)
  statistics.minAsks = Math.min(statistics.minAsks, state.asks.size)
  statistics.minBids = Math.min(statistics.minBids, state.bids.size)
}

const exitCode = await new Promise((resolve) => unzip.on('close', resolve))
if (exitCode !== 0) throw new Error(`unzip exited with ${exitCode}`)
console.log(
  JSON.stringify(
    {
      ...statistics,
      first: statistics.first && {
        seq: statistics.first.seq,
        timestamp: statistics.first.timestamp,
        type: statistics.first.type,
        updateId: statistics.first.updateId
      },
      last: statistics.last && {
        seq: statistics.last.seq,
        timestamp: statistics.last.timestamp,
        type: statistics.last.type,
        updateId: statistics.last.updateId
      }
    },
    null,
    2
  )
)
