import { expect, test } from '@playwright/test'
import { moveToCandle, readCandleCenter, readChartWindow } from './support/professionalTerminal.js'

test.use({ viewport: { height: 1080, width: 1920 } })

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
  await page.mouse.move(0, 0)
  await expect(chart.locator('.chart-crosshair-line')).toHaveCount(0)
  await expect(volumePanel.locator('.chart-crosshair-line')).toHaveCount(0)
})

test('chart stays still on hover and pans continuously while the pointer is held', async ({
  page
}) => {
  await page.goto('/demo')
  const chart = page.getByLabel('candles historical chart')
  await page.getByLabel('Timeframe').selectOption('15')
  await chart.focus()
  await page.keyboard.press('0')
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

test('timeframe changes maximize future space while drag can restore profile overlap', async ({
  page
}) => {
  await page.goto('/demo')
  const chart = page.getByLabel('candles historical chart')
  const timeframe = page.getByLabel('Timeframe')

  for (const value of ['15', '60', '5', '30']) {
    await timeframe.selectOption(value)
    const visibleCount = Number(await chart.getAttribute('data-visible-count'))
    await expect
      .poll(async () => Number(await chart.getAttribute('data-right-offset')))
      .toBe(-visibleCount * 0.3)
    const geometry = await chart.evaluate((node) => {
      const data = node.querySelector('.chart-data-layer').getBoundingClientRect()
      const profile = node
        .querySelector('[aria-label="Visible range volume profile overlay"]')
        .getBoundingClientRect()
      return { dataRight: data.right, profileLeft: profile.left }
    })
    expect(geometry.dataRight).toBeLessThan(geometry.profileLeft)
  }

  const initialVisibleCount = await chart.getAttribute('data-visible-count')
  const bounds = await chart.boundingBox()
  const y = bounds.y + bounds.height * 0.45
  await page.mouse.move(bounds.x + bounds.width * 0.3, y)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.62, y, { steps: 8 })
  await page.mouse.up()

  await expect
    .poll(async () => Number(await chart.getAttribute('data-right-offset')))
    .toBeGreaterThan(-Number(initialVisibleCount) * 0.3)
  await expect(chart).toHaveAttribute('data-visible-count', initialVisibleCount)
  const overlappedGeometry = await chart.evaluate((node) => {
    const data = node.querySelector('.chart-data-layer').getBoundingClientRect()
    const profile = node
      .querySelector('[aria-label="Visible range volume profile overlay"]')
      .getBoundingClientRect()
    return { dataRight: data.right, profileLeft: profile.left }
  })
  expect(overlappedGeometry.dataRight).toBeGreaterThan(overlappedGeometry.profileLeft)
})

test('drag can move current data left of the volume profile in every chart mode', async ({
  page
}) => {
  const cases = [
    { mode: 'candles', route: '/demo' },
    { mode: 'footprint', route: '/demo/footprint' },
    { mode: 'step-profile', route: '/demo/step-profile' }
  ]

  for (const { mode, route } of cases) {
    await page.goto(route)
    const chart = page.getByLabel(`${mode} historical chart`)
    const bounds = await chart.boundingBox()
    const initialVisibleCount = await chart.getAttribute('data-visible-count')
    const initialVolumeBar = await page.locator('.volume-bar').last().boundingBox()
    const initialGeometry = await chart.evaluate((node) => {
      const data = node.querySelector('.chart-data-layer').getBoundingClientRect()
      const profile = node
        .querySelector('[aria-label="Visible range volume profile overlay"]')
        .getBoundingClientRect()
      return { dataRight: data.right, profileLeft: profile.left }
    })

    await page.mouse.move(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.45)
    await page.mouse.down()
    await page.mouse.move(bounds.x + bounds.width * 0.3, bounds.y + bounds.height * 0.45, {
      steps: 8
    })
    await page.mouse.up()

    await expect
      .poll(async () => Number(await chart.getAttribute('data-right-offset')))
      .toBeLessThan(0)
    await expect(chart).toHaveAttribute('data-visible-count', initialVisibleCount)
    await expect(chart).toHaveAttribute('data-follow-latest', 'true')

    const shiftedGeometry = await chart.evaluate((node) => {
      const data = node.querySelector('.chart-data-layer').getBoundingClientRect()
      const profile = node
        .querySelector('[aria-label="Visible range volume profile overlay"]')
        .getBoundingClientRect()
      return { dataRight: data.right, profileLeft: profile.left }
    })
    const shiftedVolumeBar = await page.locator('.volume-bar').last().boundingBox()
    expect(shiftedGeometry.dataRight).toBeLessThan(initialGeometry.dataRight)
    expect(shiftedGeometry.dataRight).toBeLessThan(shiftedGeometry.profileLeft)
    expect(shiftedVolumeBar.x).toBeLessThan(initialVolumeBar.x)

    await chart.focus()
    await page.keyboard.press('0')
    await expect(chart).toHaveAttribute('data-right-offset', '0')
  }
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
  await page.getByLabel('Timeframe').selectOption('5')
  const chart = page.getByLabel('step-profile historical chart')
  const chartBounds = await chart.boundingBox()

  await chart.focus()
  await page.keyboard.press('0')
  await page.keyboard.press('ArrowLeft')
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
