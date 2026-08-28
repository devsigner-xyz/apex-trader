import { expect, test } from '@playwright/test'

test.use({ viewport: { height: 1080, width: 1920 } })

async function opaquePixelCount(canvas) {
  return canvas.evaluate((node) => {
    const context = node.getContext('2d')
    const pixels = context.getImageData(0, 0, node.width, node.height).data
    let count = 0
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) count += 1
    return count
  })
}

test('real L2 liquidity heatmap renders behind candles and persists its controls', async ({
  page
}) => {
  await page.goto('/demo')
  const canvas = page.locator('.liquidity-heatmap-canvas')
  const chart = page.getByLabel('candles historical chart')
  await expect(canvas).toHaveAttribute('data-status', 'ready', { timeout: 15_000 })
  expect(Number(await canvas.getAttribute('data-loaded-tiles'))).toBeGreaterThan(1)
  await expect.poll(() => opaquePixelCount(canvas)).toBeGreaterThan(1000)

  const canvasBox = await canvas.boundingBox()
  const chartBox = await chart.boundingBox()
  expect(canvasBox.x).toBeCloseTo(chartBox.x, 0)
  expect(canvasBox.width).toBeCloseTo((chartBox.width * 1048) / 1128, 0)
  expect(await canvas.evaluate((node) => getComputedStyle(node).zIndex)).toBe('0')
  expect(await chart.evaluate((node) => getComputedStyle(node).zIndex)).toBe('1')

  await page.getByRole('button', { name: 'Chart settings' }).click()
  const toggle = page.getByLabel('Show liquidity heatmap')
  const intensity = page.getByLabel('Liquidity heatmap intensity')
  await expect(toggle).toBeChecked()
  await expect(intensity).toHaveValue('60')
  await intensity.fill('85')
  await expect(canvas).toHaveAttribute('data-intensity', '85')

  await toggle.uncheck()
  await expect(canvas).toHaveAttribute('data-status', 'idle')
  await expect.poll(() => opaquePixelCount(canvas)).toBe(0)
  await page.reload()
  await page.getByRole('button', { name: 'Chart settings' }).click()
  await expect(page.getByLabel('Show liquidity heatmap')).not.toBeChecked()
  await expect(page.getByLabel('Liquidity heatmap intensity')).toHaveValue('85')
  await expect(page.getByLabel('Liquidity heatmap intensity')).toBeDisabled()
})

test('liquidity heatmap remains a Candles-only layer', async ({ page }) => {
  await page.goto('/demo')
  const canvas = page.locator('.liquidity-heatmap-canvas')
  await expect(canvas).toHaveAttribute('data-status', 'ready', { timeout: 15_000 })
  await page.getByLabel('Chart mode').selectOption('footprint')
  await expect(page).toHaveURL(/\/demo\/footprint$/)
  await expect(canvas).toHaveCount(0)
  await page.getByLabel('Chart mode').selectOption('candles')
  await expect(page).toHaveURL(/\/demo$/)
  await expect(page.locator('.liquidity-heatmap-canvas')).toHaveAttribute('data-status', 'ready', {
    timeout: 15_000
  })
})

test('pre-roll outside the detailed session does not load or draw liquidity', async ({ page }) => {
  await page.goto('/demo')
  const chart = page.getByLabel('candles historical chart')
  const marketChart = page.locator('.market-chart')
  const canvas = page.locator('.liquidity-heatmap-canvas')
  await expect(canvas).toHaveAttribute('data-status', 'ready', { timeout: 15_000 })

  await page.getByLabel('Timeframe').selectOption('1440')
  await expect(marketChart).toHaveAttribute('data-history-status', 'ready', { timeout: 15_000 })
  await chart.focus()
  await page.keyboard.press('ArrowLeft')

  await expect(canvas).toHaveAttribute('data-status', 'idle')
  await expect(canvas).toHaveAttribute('data-loaded-tiles', '0')
  await expect.poll(() => opaquePixelCount(canvas)).toBe(0)
})

test('core replay survives a dataset without heatmap assets and Cache API write failure', async ({
  page
}) => {
  await page.addInitScript(() => {
    if (typeof Cache !== 'undefined')
      Cache.prototype.put = async () => {
        throw new DOMException('Cache.put() encountered a network error', 'NetworkError')
      }
  })
  await page.route('**/api/market-data/manifest', async (route) => {
    const response = await route.fetch()
    const manifest = await response.json()
    for (const assetId of Object.keys(manifest.assets))
      if (assetId.startsWith('liquidity-')) delete manifest.assets[assetId]
    delete manifest.liquidity
    await route.fulfill({ json: manifest })
  })

  await page.goto('/demo')

  await expect(page.getByLabel('candles historical chart')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('.liquidity-heatmap-canvas')).toHaveAttribute('data-status', 'error')
})
