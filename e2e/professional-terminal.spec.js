import { expect, test } from '@playwright/test'

const views = [
  ['/price-chart', 'candles'],
  ['/footprint', 'footprint'],
  ['/step-profile', 'step-profile']
]

test.use({ viewport: { height: 1080, width: 1920 } })

for (const [route, mode] of views) {
  test(`${mode} matches the professional terminal contract`, async ({ page }) => {
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(route)
    await expect(page.getByText('APEX TRADER', { exact: true })).toBeVisible()
    await expect(page.getByLabel(`${mode} historical chart`)).toBeVisible()
    await expect(page.getByText(/TARDIS (REPLAYING|PAUSED|BUFFERING)/)).toBeVisible()
    await expect(page.getByText('DOM', { exact: true })).toBeVisible()
    await expect(page.getByText('TIME & SALES')).toBeVisible()
    const activity = page.getByLabel('Orders and positions')
    const playbackDock = page.locator('.playback-dock')
    await expect(activity).toBeVisible()
    const activityBox = await activity.boundingBox()
    const playbackBox = await playbackDock.boundingBox()
    expect(activityBox.height).toBeGreaterThanOrEqual(200)
    expect(activityBox.y + activityBox.height).toBeLessThanOrEqual(playbackBox.y)
    await expect(page.locator('.price-tick')).toHaveCount(9)
    await expect(page.getByRole('button', { name: 'PAUSE' })).toBeVisible()
    if (mode === 'step-profile') {
      const profileCenters = await page
        .locator('.profile-spine')
        .evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute('x1'))))
      const volumeCenters = await page
        .locator('.volume-bar')
        .evaluateAll((nodes) =>
          nodes.map(
            (node) => Number(node.getAttribute('x')) + Number(node.getAttribute('width')) / 2
          )
        )
      expect(volumeCenters).toEqual(profileCenters)
    }
    if (mode === 'footprint') {
      const cells = page.locator('.footprint-cell')
      const values = page.locator('.footprint-cell-value')
      expect(await cells.count()).toBeGreaterThan(20)
      expect(await values.count()).toBeGreaterThan(40)
      await expect(values.first()).toBeVisible()
      const renderedValues = await values.allTextContents()
      expect(renderedValues.some((value) => value !== '—' && Number.parseFloat(value) > 0)).toBe(
        true
      )
      const sourceValues = await cells.evaluateAll((nodes) =>
        nodes.map((node) => Number(node.dataset.ask) + Number(node.dataset.bid))
      )
      expect(sourceValues.every((value) => Number.isFinite(value) && value > 0)).toBe(true)
    }
    await page.screenshot({ fullPage: false, path: `output/playwright/${mode}-1920x1080.png` })
    expect(errors).toEqual([])
  })
}

test('playback, settings and keyboard controls remain coherent', async ({ page }) => {
  await page.goto('/price-chart')
  const clock = page.locator('.playback-dock output')
  const before = await clock.textContent()
  await page.waitForTimeout(250)
  expect(await clock.textContent()).not.toBe(before)
  await page.getByRole('button', { name: 'PAUSE' }).click()

  const chart = page.getByLabel('candles historical chart')
  const visibleBars = page.getByLabel('Visible bars')
  const initialCount = await visibleBars.textContent()
  await chart.hover()
  await page.mouse.wheel(0, -300)
  await expect(visibleBars).not.toHaveText(initialCount)

  const visibleWindow = page.locator('.window-label')
  const initialWindow = await visibleWindow.textContent()
  await chart.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(visibleWindow).not.toHaveText(initialWindow)

  const watchlist = page.getByLabel('Demo watchlist')
  const initialWatchlist = await watchlist.boundingBox()
  await page.getByLabel('Resize watchlist').focus()
  await page.keyboard.press('ArrowRight')
  const resizedWatchlist = await watchlist.boundingBox()
  expect(resizedWatchlist.width).toBeGreaterThan(initialWatchlist.width)

  await page.getByRole('button', { name: /Layout 01/ }).click()
  await expect(page.getByRole('dialog', { name: 'Workspace settings' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Workspace settings' })).toBeHidden()
  await page.getByLabel('Chart mode').selectOption('footprint')
  await expect(page).toHaveURL(/\/footprint$/)
  await expect(page.getByLabel('footprint historical chart')).toBeVisible()
})

test('orders and positions remain visible at a smaller desktop viewport', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 })
  await page.goto('/step-profile')

  const activity = page.getByLabel('Orders and positions')
  const playbackDock = page.locator('.playback-dock')
  await expect(activity).toBeVisible()

  const activityBox = await activity.boundingBox()
  const playbackBox = await playbackDock.boundingBox()
  expect(activityBox.height).toBeGreaterThanOrEqual(200)
  expect(activityBox.y + activityBox.height).toBeLessThanOrEqual(playbackBox.y)
  expect(playbackBox.y + playbackBox.height).toBeLessThanOrEqual(900)
})
