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
    await expect(page.locator('.replay-status')).toContainText(/REPLAYING|PAUSED|BUFFERING/)
    await expect(page.getByText('DOM', { exact: true })).toBeVisible()
    await expect(page.getByText('TIME & SALES')).toBeVisible()
    await expect(page.getByText(/LADDER|D42|CUM/)).toHaveCount(0)
    const activity = page.getByLabel('Orders and positions')
    const playbackDock = page.locator('.playback-dock')
    const marketHeader = page.locator('.market-header')
    const watchlist = page.getByLabel('Markets', { exact: true })
    const toolbar = page.locator('.workspace-toolbar')
    const chartStack = page.locator('.chart-stack')
    const dom = page.locator('.dom')
    const execution = page.locator('.execution')
    const tape = execution.locator('.tape')
    const domHeader = dom.locator('header')
    const executionHeader = execution.locator('.ticket header')
    const tapeHeader = tape.locator(':scope > header')
    await expect(activity).toBeVisible()
    await expect(marketHeader).not.toContainText('TARDIS')
    await expect(marketHeader).not.toContainText(/\d{2}:\d{2}:\d{2}\.\d{3}/)
    const activityBox = await activity.boundingBox()
    const playbackBox = await playbackDock.boundingBox()
    const marketHeaderBox = await marketHeader.boundingBox()
    const watchlistBox = await watchlist.boundingBox()
    const toolbarBox = await toolbar.boundingBox()
    const chartStackBox = await chartStack.boundingBox()
    const domBox = await dom.boundingBox()
    const executionBox = await execution.boundingBox()
    const domHeaderBox = await domHeader.boundingBox()
    const executionHeaderBox = await executionHeader.boundingBox()
    const tapeHeaderBox = await tapeHeader.boundingBox()
    expect(watchlistBox.y).toBeCloseTo(marketHeaderBox.y + marketHeaderBox.height, 0)
    expect(toolbarBox.x).toBeCloseTo(chartStackBox.x, 0)
    expect(toolbarBox.width).toBeCloseTo(chartStackBox.width, 0)
    expect(chartStackBox.y).toBeCloseTo(toolbarBox.y + toolbarBox.height, 0)
    expect(domBox.y).toBeCloseTo(toolbarBox.y, 0)
    expect(executionBox.y).toBeCloseTo(toolbarBox.y, 0)
    expect(tapeHeaderBox.height).toBe(44)
    expect(tapeHeaderBox.height).toBe(domHeaderBox.height)
    expect(tapeHeaderBox.height).toBe(executionHeaderBox.height)
    await expect(tape.locator('.tape-head span')).toHaveText(['TIME', 'PRICE', 'SIZE'])
    await expect(tape.getByText('SIDE', { exact: true })).toHaveCount(0)
    await expect(tape.locator(':scope > button').first().locator('span')).toHaveCount(3)
    await expect(tape.locator(':scope > button').first()).toHaveAttribute(
      'aria-label',
      /(?:buy|sell) trade at/
    )
    expect(activityBox.height).toBeGreaterThanOrEqual(200)
    expect(activityBox.y + activityBox.height).toBeLessThanOrEqual(playbackBox.y)
    const chartLeftEdges = await page.getByLabel(`${mode} historical chart`).evaluate((chart) => ({
      deltaBaseline: Number(chart.querySelector('.delta-baseline').getAttribute('x1')),
      grid: Number(chart.querySelector('.gridline').getAttribute('x1')),
      poc: Number(chart.querySelector('.poc-line').getAttribute('x1')),
      viewBox: chart.viewBox.baseVal.x
    }))
    expect(chartLeftEdges).toEqual({ deltaBaseline: 0, grid: 0, poc: 0, viewBox: 0 })
    await expect(page.locator('.price-tick')).toHaveCount(9)
    await expect(page.getByText('PRICE · USDT', { exact: true })).toHaveCount(0)
    const priceAxisPadding = await page
      .locator('.price-tick')
      .first()
      .evaluate((tick) => {
        const axis = document.querySelector('.price-axis-bg')
        const svg = tick.ownerSVGElement
        const bounds = tick.getBBox()
        const axisX = Number(axis.getAttribute('x'))
        const chartWidth = svg.viewBox.baseVal.width
        return {
          left: bounds.x - axisX,
          right: chartWidth - bounds.x - bounds.width
        }
      })
    expect(Math.abs(priceAxisPadding.left - priceAxisPadding.right)).toBeLessThanOrEqual(4)
    await expect(page.locator('.current-price-countdown')).toHaveText(/CLOSE \d{2}:\d{2}/)
    await expect(page.getByRole('button', { name: 'PAUSE' })).toBeVisible()
    const foregroundSelector = {
      candles: '.up, .down',
      footprint: '.footprint-bar',
      'step-profile': '.profile-spine'
    }[mode]
    const profileIsBehindPriceSeries = await page
      .locator('.session-profile')
      .evaluate((profile, selector) => {
        const foreground = document.querySelector(selector)
        return Boolean(
          foreground &&
            profile.compareDocumentPosition(foreground) & Node.DOCUMENT_POSITION_FOLLOWING
        )
      }, foregroundSelector)
    expect(profileIsBehindPriceSeries).toBe(true)
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
      for (let index = 0; index < 8; index += 1) {
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
      expect(valueFontSize).toBeGreaterThanOrEqual(13)
      expect(zoomedValueFontSize).toBeGreaterThanOrEqual(valueFontSize)
      expect(zoomedValueFontSize).toBeGreaterThanOrEqual(13)
      expect(initialCellWidth).toBeLessThanOrEqual(38)
      expect(zoomedCellWidth).toBeLessThanOrEqual(38)
      const firstBar = page.locator('.footprint-bar').first()
      const deltaGap = await firstBar.evaluate((node) => {
        const delta = node.querySelector('.bar-delta')
        const cells = [...node.querySelectorAll('.footprint-bid-bg')]
        const firstCellY = Math.min(...cells.map((cell) => Number(cell.getAttribute('y'))))
        return firstCellY - Number(delta.getAttribute('y'))
      })
      expect(deltaGap).toBeGreaterThanOrEqual(8)
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

test('Markets columns can be configured while required columns remain visible', async ({
  page
}) => {
  await page.goto('/price-chart')
  const markets = page.getByLabel('Markets', { exact: true })
  const selectedRow = markets.locator('button.selected')

  await expect(markets.getByText('MARKETS', { exact: true })).toBeVisible()
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

  await page.screenshot({
    fullPage: false,
    path: 'output/playwright/markets-column-settings-1920x1080.png'
  })
  await page.keyboard.press('Escape')
  await expect(settings).toBeHidden()

  await page.reload()
  const reloadedMarkets = page.getByLabel('Markets', { exact: true })
  await expect(reloadedMarkets.locator('.watch-head .watch-cell')).toHaveCount(4)
  await page.getByRole('button', { name: 'Markets settings' }).click()
  await page.getByLabel('Show ASK column').check()
  await expect(reloadedMarkets.locator('.watch-head .watch-cell')).toHaveCount(5)
  await expect(reloadedMarkets.locator('.watch-cell--ask')).toHaveCount(29)
})

test('panel sizes persist across reloads and later visits', async ({ context, page }) => {
  await page.goto('/price-chart')

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
  await returningPage.goto('/footprint')
  expect(await readPanelWidths(returningPage)).toEqual(resizedWidths)
  await returningPage.close()
})

test('playback, settings and keyboard controls remain coherent', async ({ page }) => {
  await page.goto('/price-chart')
  const timeline = page.getByLabel('Historical time')
  const countdown = page.locator('.current-price-countdown')
  const countdownBefore = await countdown.textContent()
  const before = Number(await timeline.inputValue())
  await page.waitForTimeout(1000)
  const elapsed = Number(await timeline.inputValue()) - before
  expect(elapsed).toBeGreaterThan(500)
  expect(elapsed).toBeLessThan(2000)
  await expect(countdown).not.toHaveText(countdownBefore)
  await expect(page.getByLabel('Playback speed')).toHaveCount(0)
  await expect(page.getByText(/REPLAYING .*×/)).toHaveCount(0)
  await page.getByRole('button', { name: 'PAUSE' }).click()

  const timeframe = page.getByLabel('Timeframe')
  await expect(timeframe.locator('option')).toHaveCount(6)
  await timeframe.selectOption('15')
  await expect(page.locator('.quiet').first()).toContainText('15M')
  await expect(countdown).toHaveText(/CLOSE 1[0-4]:\d{2}/)
  await timeframe.selectOption('60')
  await expect(page.locator('.quiet').first()).toContainText('1H')
  await expect(countdown).toHaveText(/CLOSE \d{2}:\d{2}/)
  await timeframe.selectOption('240')
  await expect(page.locator('.quiet').first()).toContainText('4H')
  await timeframe.selectOption('1440')
  await expect(page.locator('.quiet').first()).toContainText('1D')
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
  const resizedDomCells = await page
    .locator('.dom-row')
    .first()
    .locator('span')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  expect(resizedDom.width).toBeGreaterThan(initialDom.width)
  expect(resizedDomCells.every((width, index) => width > initialDomCells[index])).toBe(true)

  const firstDomRow = page.locator('.dom-row.ask').nth(20)
  const firstDomPrice = await firstDomRow.getAttribute('data-price')
  await firstDomRow.evaluate((node) => {
    window.__firstDomRow = node
  })
  await page.waitForTimeout(700)
  const sameDomRow = await page
    .locator(`.dom-row[data-price="${firstDomPrice}"]`)
    .evaluate((node) => node === window.__firstDomRow)
  expect(sameDomRow).toBe(true)

  const activityPanel = page.getByRole('tabpanel')
  await expect(activityPanel.locator('.activity-row')).toHaveCount(2)
  await page.getByRole('tab', { name: /ORDERS/ }).click()
  await expect(activityPanel).toContainText('WORKING')
  await expect(activityPanel.locator('.activity-row')).toHaveCount(4)
  await page.getByRole('tab', { name: /FILLS/ }).click()
  await expect(activityPanel).toContainText('FILLED')
  await expect(activityPanel.locator('.activity-row')).toHaveCount(3)
  await page.getByRole('tab', { name: 'ACCOUNT & RISK' }).click()
  await expect(activityPanel).toContainText('WITHIN LIMITS')

  const orderType = page.getByText('ORDER TYPE').locator('select')
  await orderType.selectOption('Market')
  await page.getByRole('button', { name: 'PLACE BUY MARKET' }).click()
  await expect(page.getByText(/SIM BUY MARKET staged/)).toBeVisible()
  await expect(page.getByText(/not transmitted/)).toBeVisible()

  await page.getByRole('button', { name: /Layout 01/ }).click()
  await expect(page.getByRole('dialog', { name: 'Workspace settings' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Workspace settings' })).toBeHidden()
  await page.getByLabel('Chart mode').selectOption('footprint')
  await expect(page).toHaveURL(/\/footprint$/)
  await expect(page.getByLabel('footprint historical chart')).toBeVisible()
  await expect(page.getByLabel('Timeframe').locator('option')).toHaveCount(3)
  await expect(page.getByLabel('Timeframe')).toHaveValue('60')
  await expect(page.getByLabel('Timeframe').locator('option')).toHaveText([
    '1 hour',
    '4 hours',
    '1 day'
  ])

  const lastFootprintCenterBefore = await page
    .locator('.footprint-divider')
    .last()
    .getAttribute('x1')
  await page.getByRole('button', { name: 'Reserve space for volume profile' }).click()
  const lastFootprintCenterAfter = await page
    .locator('.footprint-divider')
    .last()
    .getAttribute('x1')
  const profileLeftEdge = await page
    .locator('.session-profile-bar')
    .evaluateAll((nodes) => Math.min(...nodes.map((node) => Number(node.getAttribute('x')))))
  expect(Number(lastFootprintCenterAfter)).toBeLessThan(Number(lastFootprintCenterBefore))
  expect(Number(lastFootprintCenterAfter)).toBeLessThan(profileLeftEdge)
  await page.screenshot({
    fullPage: false,
    path: 'output/playwright/footprint-profile-space-1920x1080.png'
  })
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
