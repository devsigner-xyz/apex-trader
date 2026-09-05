import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const llmsTxt = await readFile(new URL('../public/llms.txt', import.meta.url), 'utf8')
const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const markdownOverview = await readFile(new URL('../public/index.md', import.meta.url), 'utf8')

test('publishes an llms.txt file that passes the Lighthouse content checks', () => {
  assert.ok(llmsTxt.length >= 50)
  assert.match(llmsTxt, /^\s*#\s+.+/m)
  assert.match(llmsTxt, /\[.+\]\(.+\)/)
})

test('follows the recommended llms.txt heading and summary order', () => {
  const significantLines = llmsTxt.split('\n').filter((line) => line.trim())

  assert.equal(significantLines[0], '# Apex Trader')
  assert.match(significantLines[1], /^>\s+\S/)
})

test('advertises agent-readable resources from the HTML document', () => {
  assert.match(indexHtml, /<link rel="describedby" href="\/llms\.txt" \/>/)
  assert.match(
    indexHtml,
    /<link rel="alternate" type="text\/markdown" href="\/index\.md" \/>/
  )
  assert.match(markdownOverview, /^# Apex Trader\n/)
})
