import { expect, test } from '@playwright/test'

test.use({ viewport: { height: 1080, width: 1920 } })

test('footprint chart panels, settings and volume size persist', async ({ page }) => {
  await page.goto('/demo/footprint')
  const profilePanel = page.getByRole('img', {
    name: 'Visible range volume profile overlay',
    exact: true
  })
  const volumePanel = page.getByRole('img', { name: 'Volume panel', exact: true })
  const priceChart = page.getByLabel('footprint historical chart')
  const priceChartBox = await priceChart.boundingBox()
  const profileBox = await profilePanel.boundingBox()
  const initialVolumeHeight = (await volumePanel.boundingBox()).height
  const valueAreaMarkers = page.locator('.session-profile-marker')
  expect(profileBox.x).toBeGreaterThanOrEqual(priceChartBox.x)
  expect(profileBox.x + profileBox.width).toBeLessThanOrEqual(priceChartBox.x + priceChartBox.width)
  await expect(page.getByLabel('Resize session volume profile panel')).toHaveCount(0)

  await page.getByLabel('Chart settings').click()
  await page.getByLabel('Show visible range volume profile').uncheck()
  await expect(profilePanel).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'VAH, POC and VAL markers' })).toBeVisible()
  await expect(valueAreaMarkers).toHaveCount(3)
  await page.getByLabel('Show visible range volume profile').check()
  await expect(profilePanel).toBeVisible()
  const valueArea = page.getByLabel('Visible range value area')
  await expect(valueArea).toBeVisible()
  await expect(valueAreaMarkers).toHaveCount(3)
  await page.getByLabel('Show VAH, POC and VAL').uncheck()
  await expect(valueArea).toHaveCount(0)
  await expect(valueAreaMarkers).toHaveCount(0)
  await expect(profilePanel).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('apex-trader:chart-panel-visibility:v1')))
    )
    .toEqual({ profile: true, valueArea: false, volume: true })
  await page.reload()
  await expect(profilePanel).toBeVisible()
  await expect(valueArea).toHaveCount(0)
  await page.getByLabel('Chart settings').click()
  await expect(page.getByLabel('Show VAH, POC and VAL')).not.toBeChecked()
  await page.getByLabel('Show VAH, POC and VAL').check()
  await expect(valueArea).toBeVisible()
  await expect(valueAreaMarkers).toHaveCount(3)
  await page.keyboard.press('Escape')

  await page.getByLabel('Resize volume panel').focus()
  await page.keyboard.press('ArrowUp')
  expect((await volumePanel.boundingBox()).height).toBeGreaterThan(initialVolumeHeight)
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('apex-trader:chart-panel-sizes:v1')))
  ).toEqual({ volume: 118 })
  await page.reload()
  await expect(profilePanel).toBeVisible()
  expect((await volumePanel.boundingBox()).height).toBeCloseTo(118, 0)
})

test('chart settings keep common controls and scope colors to each supported mode', async ({ page }) => {
  await page.goto('/demo')
  const settingsTrigger = page.getByLabel('Chart settings')
  await settingsTrigger.click()

  for (const label of [
    'Show visible range volume profile',
    'Show VAH, POC and VAL',
    'Show volume'
  ]) {
    await expect(page.getByLabel(label)).toBeVisible()
  }
  await expect(page.getByLabel('Up candle color')).toBeVisible()
  await expect(page.getByLabel('Down candle color')).toBeVisible()
  await expect(page.getByLabel('Show liquidity heatmap')).toBeVisible()

  await page.getByLabel('Up candle color').fill('#335577')
  await page.getByLabel('Down candle color').fill('#884422')
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('apex-trader:chart-appearance:v1')))
    )
    .toEqual({
      candles: { down: '#884422', up: '#335577' },
      stepProfile: { ask: null, bid: null }
    })
  expect(
    await page.locator('.market-chart .up rect').first().evaluate((node) => getComputedStyle(node).fill)
  ).toBe('rgb(51, 85, 119)')

  await page.getByLabel('Chart mode').selectOption('footprint')
  await expect(page).toHaveURL(/\/demo\/footprint$/)
  await expect(page.getByRole('dialog', { name: 'Chart settings' })).toBeVisible()
  await expect(page.getByLabel('Show visible range volume profile')).toBeVisible()
  await expect(page.getByLabel('Up candle color')).toHaveCount(0)
  await expect(page.getByLabel('Step profile bid color')).toHaveCount(0)
  await expect(page.getByLabel('Show liquidity heatmap')).toHaveCount(0)

  await page.getByLabel('Chart mode').selectOption('step-profile')
  await expect(page).toHaveURL(/\/demo\/step-profile$/)
  await expect(page.getByLabel('Step profile bid color')).toBeVisible()
  await expect(page.getByLabel('Step profile ask color')).toBeVisible()
  await expect(page.getByLabel('Up candle color')).toHaveCount(0)
  await page.getByLabel('Step profile bid color').fill('#ddeeff')
  await page.getByLabel('Step profile ask color').fill('#123456')
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('apex-trader:chart-appearance:v1')))
    )
    .toEqual({
      candles: { down: '#884422', up: '#335577' },
      stepProfile: { ask: '#123456', bid: '#ddeeff' }
    })
  expect(
    await page
      .locator('.step-profile-bid')
      .first()
      .evaluate((node) => getComputedStyle(node).fill)
  ).toBe('rgb(221, 238, 255)')
  expect(
    await page
      .locator('.step-profile-ask')
      .first()
      .evaluate((node) => getComputedStyle(node).fill)
  ).toBe('rgb(18, 52, 86)')

  await page.getByLabel('Chart mode').selectOption('candles')
  await expect(page.getByLabel('Up candle color')).toHaveValue('#335577')
  await page.reload()
  await settingsTrigger.click()
  await expect(page.getByLabel('Down candle color')).toHaveValue('#884422')
})
