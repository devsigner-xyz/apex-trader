import { expect, test } from '@playwright/test'

test.use({ viewport: { height: 1080, width: 1920 } })

test('Markets columns can be configured while required columns remain visible', async ({
  page
}) => {
  await page.goto('/demo')
  const markets = page.getByLabel('Markets', { exact: true })
  const selectedRow = markets.locator('button.selected')

  await expect(markets.getByText('MARKETS', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Watchlist category')).toHaveCount(0)
  await page.getByRole('button', { name: 'Markets settings' }).click()

  const settings = page.getByRole('dialog', { name: 'Markets columns' })
  const symbol = page.getByLabel('Show SYM column')
  const last = page.getByLabel('Show LAST column')
  const bid = page.getByLabel('Show BID column')
  const ask = page.getByLabel('Show ASK column')
  const change = page.getByLabel('Show Δ% column')
  const volume = page.getByLabel('Show VOL column')

  await expect(settings).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(bid).toBeFocused()
  await expect(symbol).toBeChecked()
  await expect(symbol).toBeDisabled()
  await expect(last).toBeChecked()
  await expect(last).toBeDisabled()
  await expect(bid).toBeChecked()
  await expect(ask).toBeChecked()
  await expect(change).toBeChecked()
  await expect(volume).toBeChecked()

  const widthsBefore = await selectedRow
    .locator('.watch-cell')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  await ask.uncheck()
  await volume.uncheck()
  await expect(markets.locator('.watch-head .watch-cell')).toHaveCount(4)
  await expect(selectedRow.locator('.watch-cell')).toHaveCount(4)
  await expect(markets.locator('.watch-cell--ask')).toHaveCount(0)
  await expect(markets.locator('.watch-cell--volume')).toHaveCount(0)

  const widthsAfter = await selectedRow
    .locator('.watch-cell')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  expect(widthsAfter.length).toBe(4)
  expect(widthsAfter[0]).toBeGreaterThan(widthsBefore[0])
  expect(widthsAfter[1]).toBeGreaterThan(widthsBefore[1])

  await page.keyboard.press('Escape')
  await expect(settings).toBeHidden()

  await page.reload()
  const reloadedMarkets = page.getByLabel('Markets', { exact: true })
  await expect(reloadedMarkets.locator('.watch-head .watch-cell')).toHaveCount(4)
  await page.getByRole('button', { name: 'Markets settings' }).click()
  await page.getByLabel('Show ASK column').check()
  await expect(reloadedMarkets.locator('.watch-head .watch-cell')).toHaveCount(5)
  await expect(reloadedMarkets.locator('.watch-cell--ask')).toHaveCount(51)
})

test('Markets can be filtered and its rows scroll independently', async ({ page }) => {
  await page.goto('/demo')

  const markets = page.getByLabel('Markets', { exact: true })
  const search = page.getByRole('searchbox', { name: 'Search markets' })
  const columnHeader = markets.locator('.watch-head')
  const rowsViewport = page.getByLabel('Market symbols')
  const rows = rowsViewport.locator('.market-row')

  await expect(rows).toHaveCount(50)
  await expect(search).toHaveAttribute('placeholder', 'Search symbol')

  const [toolbarBox, searchBox, settingsBox, columnHeaderBox] = await Promise.all([
    markets.locator('.markets-toolbar').boundingBox(),
    search.boundingBox(),
    page.getByRole('button', { name: 'Markets settings' }).boundingBox(),
    columnHeader.boundingBox()
  ])
  expect(searchBox.y).toBeGreaterThanOrEqual(toolbarBox.y)
  expect(settingsBox.x).toBeGreaterThan(searchBox.x + searchBox.width)
  expect(columnHeaderBox.y).toBeGreaterThanOrEqual(searchBox.y + searchBox.height)

  await search.fill('ltc')
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText('LTCUSDT')

  await search.fill('not-a-symbol')
  await expect(rows).toHaveCount(0)
  await expect(markets.getByText('No markets found', { exact: true })).toBeVisible()

  await search.clear()
  await expect(rows).toHaveCount(50)
  const scrollState = await rowsViewport.evaluate((node) => {
    const pageScrollBefore = window.scrollY
    node.scrollTop = node.scrollHeight
    return {
      clientHeight: node.clientHeight,
      pageScrollAfter: window.scrollY,
      pageScrollBefore,
      scrollHeight: node.scrollHeight,
      scrollTop: node.scrollTop
    }
  })
  expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight)
  expect(scrollState.scrollTop).toBeGreaterThan(0)
  expect(scrollState.pageScrollAfter).toBe(scrollState.pageScrollBefore)
})
