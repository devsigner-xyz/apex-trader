import { expect, test } from '@playwright/test'

test.use({ viewport: { height: 1080, width: 1920 } })

test('panel sizes persist across reloads and later visits', async ({ context, page }) => {
  await page.goto('/demo')

  await page.getByLabel('Resize watchlist').focus()
  await page.keyboard.press('ArrowRight')
  await page.getByLabel('Resize DOM').focus()
  await page.keyboard.press('ArrowLeft')
  await page.getByLabel('Resize execution panel').focus()
  await page.keyboard.press('ArrowRight')

  const readPanelWidths = (targetPage) =>
    Promise.all([
      targetPage.getByLabel('Markets', { exact: true }).evaluate((node) => node.offsetWidth),
      targetPage.locator('.dom').evaluate((node) => node.offsetWidth),
      targetPage.locator('.execution').evaluate((node) => node.offsetWidth)
    ])

  const resizedWidths = await readPanelWidths(page)
  expect(resizedWidths).toEqual([368, 234, 272])
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('apex-trader:panel-sizes:v1')))
  ).toEqual({ dom: 234, execution: 272, watch: 368 })

  await page.reload()
  expect(await readPanelWidths(page)).toEqual(resizedWidths)

  const returningPage = await context.newPage()
  await returningPage.goto('/demo/footprint')
  expect(await readPanelWidths(returningPage)).toEqual(resizedWidths)
  await returningPage.close()
})

test('workspace resizing, Activity, order ticket and chart navigation remain coherent', async ({ page }) => {
  await page.goto('/demo')
  const watchlist = page.getByLabel('Markets', { exact: true })
  const initialWatchlist = await watchlist.boundingBox()
  const initialWatchCells = await watchlist
    .locator('button.selected span')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  await page.getByLabel('Resize watchlist').focus()
  await page.keyboard.press('ArrowRight')
  const resizedWatchlist = await watchlist.boundingBox()
  const resizedWatchCells = await watchlist
    .locator('button.selected span')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  expect(resizedWatchlist.width).toBeGreaterThan(initialWatchlist.width)
  expect(resizedWatchCells.every((width, index) => width > initialWatchCells[index])).toBe(true)

  const domPanel = page.locator('.dom')
  const initialDom = await domPanel.boundingBox()
  const initialDomCells = await page
    .locator('.dom-row')
    .first()
    .locator('span')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  await page.getByLabel('Resize DOM').focus()
  await page.keyboard.press('ArrowLeft')
  const resizedDom = await domPanel.boundingBox()
  expect(resizedDom.width).toBeGreaterThan(initialDom.width)
  await expect
    .poll(async () => {
      const resizedDomCells = await page
        .locator('.dom-row')
        .first()
        .locator('span')
        .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
      return (
        resizedDomCells.every((width, index) => width >= initialDomCells[index] - 0.1) &&
        resizedDomCells.some((width, index) => width > initialDomCells[index] + 0.5)
      )
    })
    .toBe(true)

  await page.locator('.dom-row').evaluateAll((nodes) => {
    window.__domRowsByPrice = new Map(nodes.map((node) => [node.dataset.price, node]))
  })
  await expect
    .poll(() =>
      page
        .locator('.dom-row')
        .evaluateAll((nodes) =>
          nodes.some((node) => window.__domRowsByPrice.get(node.dataset.price) === node)
        )
    )
    .toBe(true)

  const activityPanel = page.getByRole('tabpanel')
  await expect(activityPanel.locator('.activity-head span')).toHaveText([
    'SYMBOL',
    'SIDE',
    'QTY',
    'ENTRY',
    'MARK',
    'UPL',
    'OPENED',
    'ACTION'
  ])
  await expect(activityPanel.locator('.activity-row')).toHaveCount(2)
  await page.getByRole('tab', { name: /ORDERS/ }).click()
  await expect(activityPanel).toContainText('WORKING')
  await expect(activityPanel.locator('.activity-head span')).toHaveText([
    'TIME',
    'SYMBOL',
    'SIDE',
    'TYPE',
    'QTY',
    'LIMIT / TRIGGER',
    'TIF',
    'STATUS',
    'ACTION'
  ])
  await expect(activityPanel.locator('.activity-row')).toHaveCount(4)
  await page.getByRole('tab', { name: /FILLS/ }).click()
  await expect(activityPanel).toContainText('LIQUIDITY')
  await expect(activityPanel).toContainText('MAKER')
  await expect(activityPanel.locator('.activity-row')).toHaveCount(3)
  await page.getByRole('tab', { name: 'ACTIVITY' }).click()
  await expect(activityPanel.locator('.activity-head span')).toHaveText([
    'TIME',
    'EVENT',
    'DETAIL',
    'STATUS',
    'ACCOUNT'
  ])
  await page.getByRole('tab', { name: 'ACCOUNT & RISK' }).click()
  await expect(activityPanel).toContainText('WITHIN LIMITS')
  await expect(activityPanel).toContainText('SIMULATED ACCOUNT')
  await expect(activityPanel).toContainText('Unrealized P&L')
  await expect(activityPanel.locator('.activity-head')).toHaveCount(0)
  const detailsTrigger = page.getByRole('button', { name: 'VIEW MORE' })
  await detailsTrigger.click()
  const details = page.getByRole('dialog', { name: 'ACCOUNT & RISK DETAILS' })
  await expect(details).toBeVisible()
  await expect(details).toContainText('Estimated equity')
  await expect(details).toContainText('Working orders')
  await expect(details).toContainText('Gross position')
  await expect(page.getByRole('button', { name: 'Close account and risk details' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(details).toBeHidden()
  await expect(detailsTrigger).toBeFocused()

  const orderType = page.getByLabel('Order type')
  await expect(page.getByLabel('Limit price', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Quantity')).toHaveValue('0.10')
  await expect(page.getByLabel('Time in force')).toHaveValue('GTC')

  await orderType.selectOption('market')
  await expect(page.getByLabel('Limit price', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Stop price')).toHaveCount(0)
  await expect(page.getByLabel('Take profit price')).toHaveCount(0)
  await expect(page.getByLabel('Time in force')).toHaveValue('IOC')
  await expect(page.getByLabel('Time in force')).toBeDisabled()
  await page.getByRole('button', { name: 'PLACE BUY MARKET' }).click()
  await expect(page.getByText(/SIM BUY MARKET staged/)).toBeVisible()
  await expect(page.getByText(/not transmitted/)).toBeVisible()

  await orderType.selectOption('stop-limit')
  await expect(page.getByLabel('Stop price')).toBeVisible()
  await expect(page.getByLabel('Limit price', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Take profit price')).toHaveCount(0)

  await orderType.selectOption('oco')
  await expect(page.getByLabel('Take profit price')).toBeVisible()
  await expect(page.getByLabel('Stop price')).toBeVisible()
  await expect(page.getByLabel('Stop limit price')).toBeVisible()
  await expect(page.getByLabel('Limit price', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Time in force')).toHaveValue('GTC')

  await expect(page.getByRole('button', { name: /Layout 01/ })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'Workspace settings' })).toHaveCount(0)
  await page.getByLabel('Chart mode').selectOption('footprint')
  await expect(page).toHaveURL(/\/demo\/footprint$/)
  await expect(page.getByLabel('footprint historical chart')).toBeVisible()
  await expect(page.getByLabel('Timeframe').locator('option')).toHaveCount(1)
  await expect(page.getByLabel('Timeframe')).toHaveValue('60')
  await expect(page.getByLabel('Timeframe').locator('option')).toHaveText(['1 hour'])
})
