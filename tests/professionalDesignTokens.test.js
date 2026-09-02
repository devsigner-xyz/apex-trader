import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

const colorLiteral = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|%23[0-9a-f]{3,8}\b/i
const tokenValues = {
  '--pro-accent': 'var(--color-text-accent, #f1cfa1)',
  '--pro-on-accent': '#11171c',
  '--pro-marketing-surface-shadow': '0 14px 28px rgb(0 0 0 / 0.28)',
  '--pro-popover-surface': 'rgb(24 32 39 / 0.98)',
  '--pro-popover-shadow': '0 12px 28px rgb(0 0 0 / 0.55)',
  '--pro-profile-bid': '#223e63',
  '--pro-profile-ask': '#315f76',
  '--pro-profile-value': '#7297ad',
  '--pro-footprint-bid': '#17445a',
  '--pro-footprint-ask': '#743842',
  '--pro-footprint-divider': 'rgb(11 15 18 / 0.9)',
  '--pro-footprint-text': '#e4edf1',
  '--pro-footprint-bid-imbalance': '#71dcb1',
  '--pro-footprint-ask-imbalance': '#ff8e97',
  '--pro-price-axis': '#11171c',
  '--pro-current-price-tag': 'var(--color-text-accent, #f1cfa1)',
  '--pro-candle-up': 'var(--pro-buy)',
  '--pro-candle-down': 'var(--pro-sell)',
  '--pro-step-profile-bid': 'var(--pro-buy)',
  '--pro-step-profile-ask': 'var(--pro-sell)',
  '--pro-chart-positive': 'var(--pro-buy)',
  '--pro-chart-negative': 'var(--pro-sell)',
  '--pro-dom-ask-volume': 'rgb(225 91 100 / 0.25)',
  '--pro-dom-bid-volume': 'rgb(47 182 124 / 0.25)',
  '--pro-action-buy': '#226f55',
  '--pro-action-sell': '#853946',
  '--pro-action-text': '#fff',
  '--pro-quote-update': 'rgb(241 207 161 / 0.16)',
  '--pro-tape-update': 'rgb(47 182 124 / 0.12)'
}

async function readComposedCss(file, ancestors = []) {
  const resolvedFile = new URL(file)
  assert.ok(!ancestors.includes(resolvedFile.href), `Circular CSS import: ${resolvedFile.pathname}`)

  const css = await readFile(resolvedFile, 'utf8')
  const importPattern = /@import\s+['"]([^'"]+)['"];?/g
  const nextAncestors = [...ancestors, resolvedFile.href]
  let composed = ''
  let cursor = 0
  let match

  while ((match = importPattern.exec(css))) {
    composed += css.slice(cursor, match.index)
    composed += await readComposedCss(new URL(match[1], resolvedFile), nextAncestors)
    cursor = importPattern.lastIndex
  }

  return composed + css.slice(cursor)
}

test('UI color literals remain confined to semantic token definitions', async () => {
  const professionalStyles = await readComposedCss(
    new URL('../src/styles/professional.css', import.meta.url)
  )
  const tokenDefinitions = professionalStyles.match(/:root\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
  const styleRules = professionalStyles.replace(tokenDefinitions, '')

  assert.notEqual(tokenDefinitions, '')
  for (const [token, value] of Object.entries(tokenValues)) {
    assert.ok(tokenDefinitions.includes(`${token}: ${value};`))
  }
  assert.match(tokenDefinitions, /--pro-select-chevron:/)
  assert.doesNotMatch(styleRules, colorLiteral)

  const uiFiles = (await readdir('src', { recursive: true })).filter(
    (file) =>
      /\.(css|js|jsx)$/.test(file) &&
      file !== 'styles/professional.css' &&
      file !== 'styles/tokens.css' &&
      !file.startsWith('styles/professional/')
  )
  const contents = await Promise.all(uiFiles.map((file) => readFile(`src/${file}`, 'utf8')))

  assert.ok(uiFiles.includes('components/professional/chart/VolumePanel.jsx'))
  for (const content of contents) assert.doesNotMatch(content, colorLiteral)
})
