import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

const colorLiteral = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|%23[0-9a-f]{3,8}\b/i
const tokenValues = {
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
  '--pro-current-price-tag': '#8e5b37',
  '--pro-dom-ask-volume': 'rgb(225 91 100 / 0.25)',
  '--pro-dom-bid-volume': 'rgb(47 182 124 / 0.25)',
  '--pro-action-buy': '#226f55',
  '--pro-action-sell': '#853946',
  '--pro-action-text': '#fff',
  '--pro-quote-update': 'rgb(214 139 84 / 0.16)',
  '--pro-tape-update': 'rgb(47 182 124 / 0.12)'
}

test('UI color literals remain confined to semantic token definitions', async () => {
  const professionalStyles = await readFile('src/styles/professional.css', 'utf8')
  const rootEnd = professionalStyles.indexOf('\n}\n')
  const tokenDefinitions = professionalStyles.slice(0, rootEnd)
  const styleRules = professionalStyles.slice(rootEnd + 3)

  assert.notEqual(rootEnd, -1)
  for (const [token, value] of Object.entries(tokenValues)) {
    assert.ok(tokenDefinitions.includes(`${token}: ${value};`))
  }
  assert.match(tokenDefinitions, /--pro-select-chevron:/)
  assert.doesNotMatch(styleRules, colorLiteral)

  const uiFiles = (await readdir('src', { recursive: true })).filter(
    (file) => /\.(css|js|jsx)$/.test(file) && file !== 'styles/professional.css' && file !== 'styles/tokens.css'
  )
  const contents = await Promise.all(uiFiles.map((file) => readFile(`src/${file}`, 'utf8')))

  assert.ok(uiFiles.includes('components/professional/chart/VolumePanel.jsx'))
  for (const content of contents) assert.doesNotMatch(content, colorLiteral)
})
