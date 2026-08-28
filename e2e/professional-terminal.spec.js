import { expect, test } from '@playwright/test'

const views = [
  ['/demo', 'candles'],
  ['/demo/footprint', 'footprint'],
  ['/demo/step-profile', 'step-profile']
]

test.use({ viewport: { height: 1080, width: 1920 } })

async function expectFooterContract(page) {
  const footer = page.locator('.terminal-footer')
  const link = footer.getByRole('link', { name: 'devsigner.xyz', exact: true })

  await expect(footer).toHaveText('ApexTrader by devsigner.xyz')
  await expect(link).toHaveAttribute('href', /^https:\/\/devsigner\.xyz\/?$/)
  await expect(link).toHaveAttribute('target', '_blank')
  const rel = (await link.getAttribute('rel'))?.split(/\s+/) ?? []
  expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
}

async function expectInsetSelectChevron(select) {
  const styles = await select.evaluate((node) => {
    const computed = getComputedStyle(node)
    return {
      appearance: computed.appearance,
      backgroundImage: computed.backgroundImage,
      backgroundPosition: computed.backgroundPosition,
      backgroundSize: computed.backgroundSize,
      paddingRight: computed.paddingRight
    }
  })

  expect(styles.appearance).toBe('none')
  expect(styles.backgroundImage).toContain('svg')
  expect(styles.backgroundPosition).toContain('8px')
  expect(styles.backgroundSize).toBe('12px 8px')
  expect(styles.paddingRight).toBe('28px')
}

async function readChartWindow(chart) {
  return chart.evaluate((node) => ({
    end: node.dataset.windowEnd,
    start: node.dataset.windowStart
  }))
}

async function readCandleCenter(candle) {
  return candle.evaluate((node) => {
    const line = node.querySelector('line')
    const svg = node.ownerSVGElement
    const point = svg.createSVGPoint()
    point.x = Number(line.getAttribute('x1'))
    point.y = 0
    return point.matrixTransform(line.getScreenCTM()).x
  })
}

async function moveToCandle(page, chart, candle) {
  const x = await readCandleCenter(candle)
  const chartBounds = await chart.boundingBox()
  await page.mouse.move(x, chartBounds.y + chartBounds.height * 0.45)
}

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
    await expectFooterContract(page)
    await expect(page.locator('.window-label')).toHaveCount(0)
    await expect(page.getByText('DOM', { exact: true })).toHaveCount(0)
    await expect(page.getByText('TIME & SALES')).toHaveCount(0)
    await expect(page.getByText('EXECUTION', { exact: true })).toHaveCount(0)
    await expect(page.getByText(/LADDER|D42|CUM/)).toHaveCount(0)
    const activity = page.getByLabel('Orders and positions')
    const footer = page.locator('.terminal-footer')
    const marketHeader = page.locator('.market-header')
    const watchlist = page.getByLabel('Markets', { exact: true })
    const chartHeader = page.locator('.market-chart > header')
    const chartControls = page.getByRole('toolbar', { name: 'Chart controls' })
    const chartStack = page.locator('.chart-stack')
    const dom = page.locator('.dom')
    const execution = page.locator('.execution')
    const tape = execution.locator('.tape')
    const domHeader = dom.locator('header')
    const tapeHeader = tape.locator(':scope > header')
    await expect(activity).toBeVisible()
    await expect(marketHeader).toContainText('APEX TRADER')
    await expect(marketHeader.locator('select')).toHaveCount(0)
    await expect(page.getByLabel('Market', { exact: true })).toHaveCount(0)
    await expect(chartControls.locator('select')).toHaveCount(2)
    await expect(chartControls.locator('select').nth(0)).toHaveAttribute('aria-label', 'Timeframe')
    await expect(chartControls.locator('select').nth(1)).toHaveAttribute('aria-label', 'Chart mode')
    await expectInsetSelectChevron(chartControls.locator('select').first())
    await expect(chartControls.getByRole('button', { name: 'Chart settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'RESET' })).toHaveCount(0)
    await expect(page.getByLabel('Tick size')).toHaveCount(0)
    await expect(marketHeader).not.toContainText('WORKSTATION')
    await expect(marketHeader).not.toContainText('UTC')
    await expect(page.locator('.workspace-toolbar')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Layout 01/ })).toHaveCount(0)
    const activityBox = await activity.boundingBox()
    const footerBox = await footer.boundingBox()
    const marketHeaderBox = await marketHeader.boundingBox()
    const watchlistBox = await watchlist.boundingBox()
    const chartHeaderBox = await chartHeader.boundingBox()
    const chartControlsBox = await chartControls.boundingBox()
    const chartStackBox = await chartStack.boundingBox()
    const domBox = await dom.boundingBox()
    const executionBox = await execution.boundingBox()
    const domHeaderBox = await domHeader.boundingBox()
    const tapeHeaderBox = await tapeHeader.boundingBox()
    expect(watchlistBox.y).toBeCloseTo(marketHeaderBox.y + marketHeaderBox.height, 0)
    expect(chartControlsBox.x).toBeGreaterThan(chartHeaderBox.x)
    expect(chartControlsBox.y).toBeGreaterThanOrEqual(chartHeaderBox.y)
    expect(chartControlsBox.y + chartControlsBox.height).toBeLessThanOrEqual(
      chartHeaderBox.y + chartHeaderBox.height
    )
    expect(chartStackBox.y).toBeCloseTo(marketHeaderBox.y + marketHeaderBox.height, 0)
    expect(domBox.y).toBeCloseTo(chartStackBox.y, 0)
    expect(executionBox.y).toBeCloseTo(chartStackBox.y, 0)
    expect(tapeHeaderBox.height).toBe(44)
    expect(tapeHeaderBox.height).toBe(domHeaderBox.height)
    await expect(domHeader).toContainText(/BTC · 0\.10 · x1/)
    await expect(tapeHeader).toContainText('BTC · Showing all')
    await expect(page.getByRole('button', { name: 'DOM settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Time and Sales settings' })).toBeVisible()
    await expect(tape.locator('.tape-head span')).toHaveText(['TIME', 'PRICE', 'SIZE'])
    await expect(tape.getByText('SIDE', { exact: true })).toHaveCount(0)
    await expect(tape.locator(':scope > button').first().locator('span')).toHaveCount(3)
    await expect(tape.locator(':scope > button').first()).toHaveAttribute(
      'aria-label',
      /(?:buy|sell) trade at/
    )
    await expect(page.getByText('SIM fixture · no order is transmitted')).toHaveCount(0)
    expect(activityBox.height).toBeGreaterThanOrEqual(200)
    expect(activityBox.y + activityBox.height).toBeLessThanOrEqual(footerBox.y)
    expect(footerBox.x).toBe(0)
    expect(footerBox.width).toBe(1920)
    expect(footerBox.height).toBe(36)
    const chartLeftEdges = await page.getByLabel(`${mode} historical chart`).evaluate((chart) => ({
      grid: Number(chart.querySelector('.gridline').getAttribute('x1')),
      poc: Number(chart.querySelector('.poc-line').getAttribute('x1')),
      viewBox: chart.viewBox.baseVal.x
    }))
    expect(chartLeftEdges).toEqual({ grid: 0, poc: 0, viewBox: 0 })
    await expect(page.getByRole('button', { name: /Zoom chart/ })).toHaveCount(0)
    await expect(page.getByLabel('Visible bars')).toHaveCount(0)
    await expect(page.getByText('CVD Δ · PER BAR', { exact: true })).toHaveCount(0)
    await expect(page.locator('.delta-bar')).toHaveCount(0)
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
    await expect(page.locator('.chart-summary > span')).toHaveCount(1)
    await expect(page.locator('.chart-summary')).toContainText(/O .* H .* L .* C .* Δ .* V /)
    await expect(page.getByText(/VOLUME · ALIGNED TO PRICE BARS/i)).toHaveCount(0)
    await expect(page.getByText('VISIBLE RANGE VOLUME PROFILE', { exact: true })).toHaveCount(0)
    await expect(page.locator('.quiet')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Reserve space for volume profile' })
    ).toHaveCount(0)
    await expect(page.getByLabel('Historical time')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^(PLAY|PAUSE)$/ })).toHaveCount(0)
    await expect(page.locator('.replay-status')).toHaveCount(0)
    const pricePanelBox = await page.locator('.price-chart-panel').boundingBox()
    const volumePanelBox = await page
      .getByRole('img', { name: 'Volume panel', exact: true })
      .boundingBox()
    const profilePanelBox = await page
      .getByRole('img', { name: 'Visible range volume profile overlay', exact: true })
      .boundingBox()
    expect(profilePanelBox.x).toBeGreaterThanOrEqual(pricePanelBox.x)
    expect(profilePanelBox.x + profilePanelBox.width).toBeLessThanOrEqual(
      pricePanelBox.x + pricePanelBox.width
    )
    const profileMarkerGeometry = await page.locator('.market-chart').evaluate((chart) => {
      const marker = chart.querySelector('.session-profile-marker')
      const markerRect = marker.querySelector('rect')
      const markerText = marker.querySelector('text')
      const levelLine = marker.parentElement.querySelector('.poc-line, .value-line')
      return {
        color: getComputedStyle(marker).color,
        dashPattern: getComputedStyle(levelLine).strokeDasharray,
        fill: getComputedStyle(markerRect).fill,
        lineCount: marker.querySelectorAll('line').length,
        lineOpacity: Number(getComputedStyle(levelLine).opacity),
        lineX1: Number(levelLine.getAttribute('x1')),
        lineX2: Number(levelLine.getAttribute('x2')),
        markerLeft: Number(markerRect.getAttribute('x')),
        stroke: getComputedStyle(markerRect).stroke,
        textFill: getComputedStyle(markerText).fill
      }
    })
    expect(profileMarkerGeometry.markerLeft).toBe(8)
    expect(profileMarkerGeometry.lineX1).toBe(0)
    expect(profileMarkerGeometry.lineX2).toBe(1048)
    expect(profileMarkerGeometry.lineCount).toBe(0)
    expect(profileMarkerGeometry.dashPattern).not.toBe('none')
    expect(profileMarkerGeometry.lineOpacity).toBeLessThan(0.7)
    expect(profileMarkerGeometry.fill).toBe(profileMarkerGeometry.color)
    expect(profileMarkerGeometry.stroke).toBe('none')
    expect(profileMarkerGeometry.textFill).not.toBe(profileMarkerGeometry.fill)
    expect(pricePanelBox.y + pricePanelBox.height).toBeLessThanOrEqual(volumePanelBox.y)
    await expect(page.getByLabel('Resize volume panel')).toBeVisible()
    await expect(page.getByLabel('Resize session volume profile panel')).toHaveCount(0)
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
      const stepProfileLevels = page.locator('.step-profile-level')
      const stepProfileValues = page.locator('.step-profile-value')
      expect(await stepProfileLevels.count()).toBeGreaterThan(20)
      expect(await stepProfileValues.count()).toBe(await stepProfileLevels.count())
      const stepProfileGeometry = await stepProfileLevels.evaluateAll((levels) =>
        levels.map((level) => {
          const bid = level.querySelector('.step-profile-bid')
          const ask = level.querySelector('.step-profile-ask')
          const cell = level.querySelector('.step-profile-cell-bg')
          const value = level.querySelector('.step-profile-value')
          return {
            askFill: getComputedStyle(ask).fill,
            askWidth: Number(ask.getAttribute('width')),
            askX: Number(ask.getAttribute('x')),
            bidFill: getComputedStyle(bid).fill,
            bidWidth: Number(bid.getAttribute('width')),
            bidX: Number(bid.getAttribute('x')),
            cellWidth: Number(cell.getAttribute('width')),
            cellX: Number(cell.getAttribute('x')),
            label: value.textContent
          }
        })
      )
      expect(
        stepProfileGeometry.some(({ askWidth, bidWidth }) => Math.abs(askWidth - bidWidth) > 0.5)
      ).toBe(true)
      expect(
        stepProfileGeometry.every(
          ({ bidWidth, bidX, cellX }) => Math.abs(bidX + bidWidth - cellX) < 0.01
        )
      ).toBe(true)
      expect(
        stepProfileGeometry.every(
          ({ askX, cellWidth, cellX }) => Math.abs(cellX + cellWidth - askX) < 0.01
        )
      ).toBe(true)
      expect(stepProfileGeometry.every(({ cellWidth }) => cellWidth >= 60 && cellWidth <= 70)).toBe(
        true
      )
      expect(stepProfileGeometry.every(({ label }) => label.includes('×'))).toBe(true)
      const profileSpacing = Math.min(
        ...profileCenters.slice(1).map((center, index) => center - profileCenters[index])
      )
      const profileWidths = await page.locator('.step-profile-bar').evaluateAll((bars) =>
        bars.map((bar) => {
          const levels = [...bar.querySelectorAll('.step-profile-level')]
          const left = Math.min(
            ...levels.map((level) =>
              Number(level.querySelector('.step-profile-bid').getAttribute('x'))
            )
          )
          const right = Math.max(
            ...levels.map((level) => {
              const ask = level.querySelector('.step-profile-ask')
              return Number(ask.getAttribute('x')) + Number(ask.getAttribute('width'))
            })
          )
          return right - left
        })
      )
      expect(profileWidths.every((width) => width < profileSpacing)).toBe(true)
      expect(stepProfileGeometry.every(({ bidFill }) => bidFill === 'rgb(47, 182, 124)')).toBe(true)
      expect(stepProfileGeometry.every(({ askFill }) => askFill === 'rgb(225, 91, 100)')).toBe(true)
      expect(await page.locator('.step-profile-poc-outline').count()).toBeGreaterThan(0)
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
      expect(valueFontSize).toBeGreaterThanOrEqual(10)
      expect(initialCellWidth).toBeLessThanOrEqual(38)
      const verticalAlignment = await cells.evaluateAll((nodes) =>
        nodes.flatMap((node) => {
          const background = node.querySelector('.footprint-bid-bg')
          const backgroundBox = background.getBoundingClientRect()
          const cellCenter = backgroundBox.top + backgroundBox.height / 2

          return [...node.querySelectorAll('.footprint-cell-value')].map((value) => {
            const valueBox = value.getBoundingClientRect()
            return Math.abs(valueBox.top + valueBox.height / 2 - cellCenter)
          })
        })
      )
      expect(Math.max(...verticalAlignment)).toBeLessThanOrEqual(0.75)
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

test('time-axis wheel zoom anchors the latest visible candle', async ({ page }) => {
  await page.goto('/demo')
  const chart = page.getByLabel('candles historical chart')
  const initialVisibleCount = Number(await chart.getAttribute('data-visible-count'))
  const initialWindowEnd = await chart.getAttribute('data-window-end')
  const chartBounds = await chart.boundingBox()
  const readVisibleProfile = () =>
    chart.evaluate((node) => [
      node.dataset.profilePoc,
      node.dataset.profileVah,
      node.dataset.profileVal
    ])
  const initialProfile = await readVisibleProfile()

  await page.mouse.move(
    chartBounds.x + chartBounds.width * 0.25,
    chartBounds.y + chartBounds.height * 0.5
  )
  await page.mouse.wheel(0, -480)
  await expect
    .poll(async () => Number(await chart.getAttribute('data-visible-count')))
    .toBeLessThan(initialVisibleCount)
  await expect(chart).toHaveAttribute('data-window-end', initialWindowEnd)
  await expect(chart).toHaveAttribute('data-right-offset', '0')
  await expect(chart).toHaveAttribute('data-follow-latest', 'true')
  await expect.poll(readVisibleProfile).not.toEqual(initialProfile)
})

test('candle hover updates OHLC data and leaving restores the latest summary', async ({ page }) => {
  await page.goto('/demo')
  const chart = page.getByLabel('candles historical chart')
  const summary = page.locator('.chart-summary > span')
  const candles = chart.locator('g.up, g.down')
  const targetCandle = candles.nth(2)
  const expectedSummary = await targetCandle.evaluate((node) => {
    const format = (value) =>
      Number(value).toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      })
    return `O ${format(node.dataset.open)} · H ${format(node.dataset.high)} · L ${format(
      node.dataset.low
    )} · C ${format(node.dataset.close)} · Δ ${format(node.dataset.delta)} · V ${format(
      node.dataset.volume
    )}`
  })

  await moveToCandle(page, chart, targetCandle)
  await expect(summary).toHaveText(expectedSummary)

  await page.mouse.wheel(0, -480)
  await expect(summary).not.toHaveText(expectedSummary)

  await page.mouse.move(0, 0)
  await expect
    .poll(() =>
      page.evaluate(() => {
        const summaryText = document.querySelector('.chart-summary > span')?.textContent ?? ''
        const summaryClose = summaryText.match(/ · C ([\d,.]+) · Δ /)?.[1]
        const currentPrice = document.querySelector('.current-price-text')?.textContent
        return Boolean(summaryClose && summaryClose === currentPrice)
      })
    )
    .toBe(true)
})

test('chart hover shows a dotted crosshair aligned through the volume panel', async ({ page }) => {
  await page.setViewportSize({ height: 1080, width: 1920 })
  await page.goto('/demo')
  const chart = page.getByLabel('candles historical chart')
  const volumePanel = page.getByRole('img', { name: 'Volume panel', exact: true })
  const bounds = await chart.boundingBox()

  await expect(chart.locator('.chart-crosshair-line')).toHaveCount(0)
  await page.mouse.move(bounds.x + bounds.width * 0.45, bounds.y + bounds.height * 0.45)

  const priceVertical = chart.locator('.chart-crosshair-line--vertical')
  const priceHorizontal = chart.locator('.chart-crosshair-line--horizontal')
  const volumeVertical = volumePanel.locator('.chart-crosshair-line--vertical')
  await expect(priceVertical).toHaveCount(1)
  await expect(priceHorizontal).toHaveCount(1)
  await expect(volumeVertical).toHaveCount(1)
  expect(await volumeVertical.getAttribute('x1')).toBe(await priceVertical.getAttribute('x1'))

  const opacities = await chart.evaluate((node) => ({
    crosshair: Number(getComputedStyle(node.querySelector('.chart-crosshair-line')).opacity),
    poc: Number(getComputedStyle(node.querySelector('.poc-line')).opacity),
    valueArea: Number(getComputedStyle(node.querySelector('.value-line')).opacity)
  }))
  expect(opacities.crosshair).toBeGreaterThan(opacities.poc)
  expect(opacities.crosshair).toBeGreaterThan(opacities.valueArea)
  await page.screenshot({
    fullPage: false,
    path: 'output/playwright/chart-crosshair-volume-1920x1080.png'
  })

  await page.mouse.move(0, 0)
  await expect(chart.locator('.chart-crosshair-line')).toHaveCount(0)
  await expect(volumePanel.locator('.chart-crosshair-line')).toHaveCount(0)
})

test('chart stays still on hover and pans continuously while the pointer is held', async ({
  page
}) => {
  await page.goto('/demo')
  const chart = page.getByLabel('candles historical chart')
  const chartBounds = await chart.boundingBox()
  const candles = chart.locator('g.up, g.down')
  const initialWindow = await readChartWindow(chart)
  const initialOffset = Number(await chart.getAttribute('data-right-offset'))
  const firstCenter = await readCandleCenter(candles.nth(0))
  const secondCenter = await readCandleCenter(candles.nth(1))
  const barStep = secondCenter - firstCenter
  const startX = chartBounds.x + chartBounds.width * 0.5
  const startY = chartBounds.y + chartBounds.height * 0.45

  await page.mouse.move(chartBounds.x + chartBounds.width * 0.2, startY)
  await page.mouse.move(chartBounds.x + chartBounds.width * 0.8, startY, { steps: 8 })
  expect(await readChartWindow(chart)).toEqual(initialWindow)
  expect(Number(await chart.getAttribute('data-right-offset'))).toBe(initialOffset)
  await expect.poll(() => chart.evaluate((node) => getComputedStyle(node).cursor)).toBe('crosshair')

  const trackedCandle = await candles.last().elementHandle()
  expect(trackedCandle).not.toBeNull()
  const trackedStart = await readCandleCenter(trackedCandle)
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await expect.poll(() => chart.evaluate((node) => getComputedStyle(node).cursor)).toBe('grabbing')

  await page.mouse.move(startX + barStep * 0.2, startY)
  await expect
    .poll(async () => Number(await chart.getAttribute('data-right-offset')))
    .toBeGreaterThan(0)
  const firstFractionalOffset = Number(await chart.getAttribute('data-right-offset'))
  const firstFractionalCenter = await readCandleCenter(trackedCandle)

  await page.mouse.move(startX + barStep * 0.4, startY)
  await expect
    .poll(async () => Number(await chart.getAttribute('data-right-offset')))
    .toBeGreaterThan(firstFractionalOffset)
  const secondFractionalOffset = Number(await chart.getAttribute('data-right-offset'))
  const secondFractionalCenter = await readCandleCenter(trackedCandle)

  expect(firstFractionalOffset).toBeLessThan(1)
  expect(secondFractionalOffset).toBeLessThan(1)
  expect(firstFractionalCenter).toBeGreaterThan(trackedStart)
  expect(secondFractionalCenter).toBeGreaterThan(firstFractionalCenter)
  expect(secondFractionalCenter - trackedStart).toBeLessThan(barStep)
  const clipGeometry = await trackedCandle.evaluate((node) => {
    const body = node.querySelector('rect')
    const clipRect = node.ownerSVGElement.querySelector('#market-chart-price-plot-clip rect')
    const panSurface = node.ownerSVGElement.querySelector('.chart-pan-surface')
    let hasClipAncestor = false
    let current = node.parentElement
    while (current && current !== node.ownerSVGElement) {
      if (
        current.hasAttribute('clip-path') ||
        (getComputedStyle(current).clipPath && getComputedStyle(current).clipPath !== 'none')
      ) {
        hasClipAncestor = true
        break
      }
      current = current.parentElement
    }
    return {
      bodyRight: Number(body.getAttribute('x')) + Number(body.getAttribute('width')),
      clipRight: Number(clipRect.getAttribute('x')) + Number(clipRect.getAttribute('width')),
      hasClipAncestor,
      panRight: Number(panSurface.getAttribute('x')) + Number(panSurface.getAttribute('width'))
    }
  })
  expect(clipGeometry.hasClipAncestor).toBe(true)
  expect(clipGeometry.bodyRight).toBeGreaterThan(clipGeometry.clipRight)
  expect(clipGeometry.clipRight).toBeCloseTo(clipGeometry.panRight, 5)

  await page.mouse.up()
  await expect.poll(() => chart.evaluate((node) => getComputedStyle(node).cursor)).toBe('crosshair')
})

test('mode-specific zoom limits preserve readable chart geometry', async ({ page }) => {
  const cases = [
    { deltaY: -10_000, expected: 28, mode: 'candles', route: '/demo' },
    { deltaY: 10_000, expected: 13, mode: 'footprint', route: '/demo/footprint' },
    { deltaY: 10_000, expected: 12, mode: 'step-profile', route: '/demo/step-profile' }
  ]

  for (const { deltaY, expected, mode, route } of cases) {
    await page.goto(route)
    const chart = page.getByLabel(`${mode} historical chart`)
    const bounds = await chart.boundingBox()
    await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.45)
    await page.mouse.wheel(0, deltaY)
    await expect(chart).toHaveAttribute('data-visible-count', String(expected))

    if (mode === 'footprint') {
      expect(await chart.locator('.footprint-cell').count()).toBeGreaterThan(0)
      const fit = await chart.locator('.footprint-cell').evaluateAll((cells) =>
        cells.every((cell) =>
          [...cell.querySelectorAll('.footprint-cell-value')].every((value) => {
            const background = cell.querySelector(
              value.classList.contains('bid') ? '.footprint-bid-bg' : '.footprint-ask-bg'
            )
            const textBox = value.getBBox()
            const cellBox = background.getBBox()
            return (
              textBox.x >= cellBox.x - 0.5 &&
              textBox.x + textBox.width <= cellBox.x + cellBox.width + 0.5 &&
              textBox.y >= cellBox.y - 0.5 &&
              textBox.y + textBox.height <= cellBox.y + cellBox.height + 0.5
            )
          })
        )
      )
      expect(fit).toBe(true)
    }

    if (mode === 'step-profile') {
      expect(await chart.locator('.step-profile-level').count()).toBeGreaterThan(0)
      const fit = await chart.locator('.step-profile-level').evaluateAll((levels) =>
        levels.every((level) => {
          const textBox = level.querySelector('.step-profile-value').getBBox()
          const cellBox = level.querySelector('.step-profile-cell-bg').getBBox()
          return (
            textBox.x >= cellBox.x - 0.5 &&
            textBox.x + textBox.width <= cellBox.x + cellBox.width + 0.5 &&
            textBox.y >= cellBox.y - 0.5 &&
            textBox.y + textBox.height <= cellBox.y + cellBox.height + 0.5
          )
        })
      )
      expect(fit).toBe(true)
    }
  }
})

test('time-axis labels never overlap at the most compressed candle scale', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1366 })
  await page.goto('/demo')
  const chart = page.getByLabel('candles historical chart')
  const bounds = await chart.boundingBox()
  await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.45)
  await page.mouse.wheel(0, 10_000)
  await expect(chart).toHaveAttribute('data-visible-count', '160')

  const labels = await chart.locator('.time-tick').evaluateAll((nodes) =>
    nodes
      .map((node) => {
        const bounds = node.getBoundingClientRect()
        return { left: bounds.left, right: bounds.right }
      })
      .sort((left, right) => left.left - right.left)
  )
  expect(labels.length).toBeGreaterThan(1)
  expect(labels.every((label, index) => index === 0 || label.left >= labels[index - 1].right)).toBe(
    true
  )
})

test('step profile supports deep legible zoom without sparse profile bars', async ({ page }) => {
  await page.goto('/demo/step-profile')
  const chart = page.getByLabel('step-profile historical chart')
  const chartBounds = await chart.boundingBox()

  await page.mouse.move(
    chartBounds.x + chartBounds.width * 0.5,
    chartBounds.y + chartBounds.height * 0.5
  )
  await page.mouse.wheel(0, -1000)
  await expect(chart).toHaveAttribute('data-visible-count', '2')

  const twoBarGeometry = await page.locator('.step-profile-bar').evaluateAll((bars) =>
    bars.map((bar) => {
      const cells = [...bar.querySelectorAll('.step-profile-cell-bg')]
      const sides = [...bar.querySelectorAll('.step-profile-bid, .step-profile-ask')]
      const shapes = [...cells, ...sides]
      const left = Math.min(...shapes.map((shape) => Number(shape.getAttribute('x'))))
      const right = Math.max(
        ...shapes.map(
          (shape) => Number(shape.getAttribute('x')) + Number(shape.getAttribute('width'))
        )
      )
      return {
        center: Number(bar.querySelector('.profile-spine').getAttribute('x1')),
        width: right - left
      }
    })
  )
  expect(twoBarGeometry).toHaveLength(2)
  const centerSpacing = twoBarGeometry[1].center - twoBarGeometry[0].center
  expect(Math.min(...twoBarGeometry.map(({ width }) => width))).toBeGreaterThan(
    centerSpacing * 0.55
  )

  await page.mouse.wheel(0, -1000)
  await expect(chart).toHaveAttribute('data-visible-count', '1')
  const maximumZoomGeometry = await page
    .locator('.step-profile-cell-bg')
    .first()
    .evaluate((cell) => ({
      fontSize: Number.parseFloat(
        getComputedStyle(cell.parentElement.querySelector('.step-profile-value')).fontSize
      ),
      width: Number(cell.getAttribute('width'))
    }))
  expect(maximumZoomGeometry.fontSize).toBeGreaterThanOrEqual(14)
  expect(maximumZoomGeometry.width).toBeGreaterThanOrEqual(160)
})

test('historical synchronization, settings and keyboard controls remain coherent', async ({
  page
}) => {
  await page.goto('/demo')
  const countdown = page.locator('.current-price-countdown')
  const countdownBefore = await countdown.textContent()
  await page.waitForTimeout(1000)
  await expect(countdown).not.toHaveText(countdownBefore)
  await expectFooterContract(page)
  await expect(page.locator('.window-label')).toHaveCount(0)
  await expect(page.getByLabel('Historical time')).toHaveCount(0)
  await expect(page.getByLabel('Playback speed')).toHaveCount(0)
  await expect(page.getByText(/REPLAYING|BUFFERING|PAUSED/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^(PLAY|PAUSE)$/ })).toHaveCount(0)

  const timeframe = page.getByLabel('Timeframe')
  await expect(timeframe.locator('option')).toHaveCount(6)
  await timeframe.selectOption('15')
  await expect(timeframe).toHaveValue('15')
  await expect(countdown).toHaveText(/CLOSE 1[0-4]:\d{2}/)
  await timeframe.selectOption('60')
  await expect(timeframe).toHaveValue('60')
  await expect(countdown).toHaveText(/CLOSE \d{2}:\d{2}/)
  await timeframe.selectOption('240')
  await expect(timeframe).toHaveValue('240')
  await timeframe.selectOption('1440')
  await expect(timeframe).toHaveValue('1440')
  await timeframe.selectOption('5')

  const chart = page.getByLabel('candles historical chart')
  await expect(page.getByRole('button', { name: /Zoom chart/ })).toHaveCount(0)
  await expect(page.getByLabel('Visible bars')).toHaveCount(0)

  const initialWindow = await readChartWindow(chart)
  await chart.focus()
  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => readChartWindow(chart)).not.toEqual(initialWindow)
  await page.keyboard.press('0')
  await expect(chart).toHaveAttribute('data-follow-latest', 'true')

  const priceScaleResizer = page.getByLabel('Resize price scale')
  await expect(priceScaleResizer).toHaveAttribute('aria-valuenow', '100')
  const priceScaleBounds = await priceScaleResizer.boundingBox()
  const visibleCountBeforePriceScale = await chart.getAttribute('data-visible-count')
  await page.mouse.move(
    priceScaleBounds.x + priceScaleBounds.width / 2,
    priceScaleBounds.y + priceScaleBounds.height / 2
  )
  await page.mouse.down()
  await page.mouse.move(
    priceScaleBounds.x + priceScaleBounds.width / 2,
    priceScaleBounds.y + priceScaleBounds.height / 2 + 80,
    { steps: 8 }
  )
  await page.mouse.up()
  await expect
    .poll(async () => Number(await chart.getAttribute('data-price-scale-factor')))
    .toBeGreaterThan(1.5)
  await expect(chart).toHaveAttribute('data-visible-count', visibleCountBeforePriceScale)
  await chart.focus()
  await page.keyboard.press('0')
  await expect(chart).toHaveAttribute('data-price-scale-factor', '1.0000')
  await expect(priceScaleResizer).toHaveAttribute('aria-valuenow', '100')

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
  await page.waitForTimeout(700)
  const retainedDomRowIdentity = await page
    .locator('.dom-row')
    .evaluateAll((nodes) =>
      nodes.some((node) => window.__domRowsByPrice.get(node.dataset.price) === node)
    )
  expect(retainedDomRowIdentity).toBe(true)

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
  await page.screenshot({
    fullPage: false,
    path: 'output/playwright/account-risk-summary-1920x1080.png'
  })

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
  await expect(page.getByLabel('Timeframe').locator('option')).toHaveCount(2)
  await expect(page.getByLabel('Timeframe')).toHaveValue('60')
  await expect(page.getByLabel('Timeframe').locator('option')).toHaveText(['1 hour', '4 hours'])

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
  ).toEqual({ profile: 180, volume: 118 })
  await page.reload()
  await expect(profilePanel).toBeVisible()
  expect((await volumePanel.boundingBox()).height).toBeCloseTo(118, 0)
  await page.screenshot({
    fullPage: false,
    path: 'output/playwright/footprint-profile-overlay-1920x1080.png'
  })
})

test('daily bars remain exclusive to Candles while order-flow modes retain their ranges', async ({
  page
}) => {
  await page.goto('/demo')
  const mode = page.getByLabel('Chart mode')
  const timeframe = page.getByLabel('Timeframe')

  await timeframe.selectOption('1440')
  await expect(timeframe).toHaveValue('1440')

  await mode.selectOption('step-profile')
  await expect(page).toHaveURL(/\/demo\/step-profile$/)
  await expect(timeframe).toHaveValue('240')
  await expect(timeframe.locator('option')).toHaveCount(5)

  await mode.selectOption('footprint')
  await expect(page).toHaveURL(/\/demo\/footprint$/)
  await expect(timeframe).toHaveValue('240')
  await expect(timeframe.locator('option')).toHaveCount(2)

  await mode.selectOption('candles')
  await expect(page).toHaveURL(/\/demo$/)
  await expect(timeframe.locator('option')).toHaveCount(6)
})

test('orders and positions remain visible at a smaller desktop viewport', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 })
  await page.goto('/demo/step-profile')

  const activity = page.getByLabel('Orders and positions')
  const footer = page.locator('.terminal-footer')
  const marketHeader = page.locator('.market-header')
  const ticket = page.locator('.ticket')
  const tape = page.locator('.tape')
  const dom = page.locator('.dom')
  const ladder = page.locator('.dom-ladder')
  await expect(activity).toBeVisible()

  const activityBox = await activity.boundingBox()
  const footerBox = await footer.boundingBox()
  const marketHeaderBox = await marketHeader.boundingBox()
  const ticketBox = await ticket.boundingBox()
  const tapeBox = await tape.boundingBox()
  const domBox = await dom.boundingBox()
  const ladderBox = await ladder.boundingBox()
  expect(activityBox.height).toBeGreaterThanOrEqual(200)
  expect(activityBox.y + activityBox.height).toBeLessThanOrEqual(footerBox.y)
  expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(900)
  expect(footerBox.x).toBe(0)
  expect(footerBox.width).toBe(marketHeaderBox.width)
  expect(footerBox.width).toBeGreaterThanOrEqual(1440)
  expect(ticketBox.y + ticketBox.height).toBeLessThanOrEqual(tapeBox.y + 1)
  expect(tapeBox.height).toBeGreaterThan(190)
  expect(domBox.height).toBeGreaterThanOrEqual(750)
  expect(ladderBox.height).toBeGreaterThan(580)
})
