import { expect, test } from '@playwright/test'
import { expectFooterContract, expectInsetSelectChevron, terminalViews } from './support/professionalTerminal.js'

test.use({ viewport: { height: 1080, width: 1920 } })

for (const [route, mode] of terminalViews) {
  test(`${mode} matches the professional terminal contract`, async ({ page }) => {
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(route)
    await expect(page.getByText('APEX TRADER', { exact: true })).toBeVisible()
    await expect(page.getByLabel(`${mode} historical chart`)).toBeVisible()
    await expectFooterContract(page, expect)
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
    await expectInsetSelectChevron(chartControls.locator('select').first(), expect)
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
    await expect(domHeader).toContainText(/BTC · 0\.01 · x1/)
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
    expect(errors).toEqual([])
  })
}
