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
