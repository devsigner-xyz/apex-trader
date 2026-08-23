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
    await expect(page.getByText(/LADDER|D42|CUM/)).toHaveCount(0)
    const activity = page.getByLabel('Orders and positions')
    const playbackDock = page.locator('.playback-dock')
    const marketHeader = page.locator('.market-header')
    const watchlist = page.getByLabel('Demo watchlist')
    const toolbar = page.locator('.workspace-toolbar')
    const chartStack = page.locator('.chart-stack')
    const dom = page.locator('.dom')
    const execution = page.locator('.execution')
    await expect(activity).toBeVisible()
    const activityBox = await activity.boundingBox()
    const playbackBox = await playbackDock.boundingBox()
    const marketHeaderBox = await marketHeader.boundingBox()
    const watchlistBox = await watchlist.boundingBox()
    const toolbarBox = await toolbar.boundingBox()
    const chartStackBox = await chartStack.boundingBox()
    const domBox = await dom.boundingBox()
    const executionBox = await execution.boundingBox()
    expect(watchlistBox.y).toBeCloseTo(marketHeaderBox.y + marketHeaderBox.height, 0)
    expect(toolbarBox.x).toBeCloseTo(chartStackBox.x, 0)
    expect(toolbarBox.width).toBeCloseTo(chartStackBox.width, 0)
    expect(chartStackBox.y).toBeCloseTo(toolbarBox.y + toolbarBox.height, 0)
    expect(domBox.y).toBeCloseTo(toolbarBox.y, 0)
    expect(executionBox.y).toBeCloseTo(toolbarBox.y, 0)
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
      const deltaFontSize = await page
        .locator('.step-delta')
        .first()
        .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))
      expect(deltaFontSize).toBeGreaterThanOrEqual(13)
    }
    if (mode === 'footprint') {
      const cells = page.locator('.footprint-cell')
      const values = page.locator('.footprint-cell-value')
      expect(await cells.count()).toBeGreaterThan(20)
      expect(await values.count()).toBeGreaterThan(40)
      await expect(values.first()).toBeVisible()
      const valueFontSize = await values
        .first()
        .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))
      expect(valueFontSize).toBeGreaterThanOrEqual(10)
      const initialCellWidth = await page
        .locator('.footprint-bid-bg')
        .first()
        .evaluate((node) => Number(node.getAttribute('width')))
      for (let index = 0; index < 6; index += 1) {
        await page.getByRole('button', { name: 'Zoom chart in' }).click()
      }
      await expect(page.getByLabel('Visible bars')).toHaveText('4 bars')
      const zoomedValueFontSize = await page
        .locator('.footprint-cell-value')
        .first()
        .evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))
      const zoomedCellWidth = await page
        .locator('.footprint-bid-bg')
        .first()
        .evaluate((node) => Number(node.getAttribute('width')))
      expect(zoomedValueFontSize).toBeGreaterThan(valueFontSize)
      expect(zoomedValueFontSize).toBeGreaterThanOrEqual(13)
      expect(zoomedCellWidth).toBeGreaterThan(initialCellWidth)
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
  const timeline = page.getByLabel('Historical time')
  const before = Number(await timeline.inputValue())
  await page.waitForTimeout(1000)
  const elapsed = Number(await timeline.inputValue()) - before
  expect(elapsed).toBeGreaterThan(500)
  expect(elapsed).toBeLessThan(2000)
  await expect(page.getByLabel('Playback speed')).toHaveCount(0)
  await expect(page.getByText(/REPLAYING .*×/)).toHaveCount(0)
  await page.getByRole('button', { name: 'PAUSE' }).click()

  const timeframe = page.getByLabel('Timeframe')
  await expect(timeframe.locator('option')).toHaveCount(4)
  await timeframe.selectOption('15')
  await expect(page.locator('.quiet').first()).toContainText('15M')
  await timeframe.selectOption('60')
  await expect(page.locator('.quiet').first()).toContainText('1H')
  await timeframe.selectOption('5')

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

  const firstDomRow = page.locator('.dom-row').first()
  const firstDomPrice = await firstDomRow.getAttribute('data-price')
  await firstDomRow.evaluate((node) => {
    window.__firstDomRow = node
  })
  await page.waitForTimeout(700)
  const sameDomRow = await page
    .locator(`.dom-row[data-price="${firstDomPrice}"]`)
    .evaluate((node) => node === window.__firstDomRow)
  expect(sameDomRow).toBe(true)

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
  const ticket = page.locator('.ticket')
  const tape = page.locator('.tape')
  const dom = page.locator('.dom')
  const ladder = page.locator('.dom-ladder')
  await expect(activity).toBeVisible()

  const activityBox = await activity.boundingBox()
  const playbackBox = await playbackDock.boundingBox()
  const ticketBox = await ticket.boundingBox()
  const tapeBox = await tape.boundingBox()
  const domBox = await dom.boundingBox()
  const ladderBox = await ladder.boundingBox()
  expect(activityBox.height).toBeGreaterThanOrEqual(200)
  expect(activityBox.y + activityBox.height).toBeLessThanOrEqual(playbackBox.y)
  expect(playbackBox.y + playbackBox.height).toBeLessThanOrEqual(900)
  expect(ticketBox.y + ticketBox.height).toBeLessThanOrEqual(tapeBox.y + 1)
  expect(tapeBox.height).toBeGreaterThan(190)
  expect(domBox.height).toBeGreaterThanOrEqual(750)
  expect(ladderBox.height).toBeGreaterThan(580)
})
