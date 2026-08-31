import { expect, test } from '@playwright/test'

test('landing renders its product thesis without loading historical data', async ({ page }) => {
  const errors = []
  const historicalRequests = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.url().includes('/data/tardis/')) historicalRequests.push(request.url())
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Candles show the result. They hide the behavior.'
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Launch demo' })).toHaveAttribute('href', '/demo')
  await expect(page.getByRole('link', { name: 'Explore market primitives' })).toHaveAttribute(
    'href',
    '#modes'
  )
  await expect(page.getByText('Four prices are not the whole interval.')).toHaveCount(0)
  await expect(page.locator('#blind-spot')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Modes', exact: true })).toHaveAttribute(
    'href',
    '#modes'
  )
  await expect(page.getByRole('link', { name: 'Session', exact: true })).toHaveAttribute(
    'href',
    '#session'
  )
  await expect(page.getByRole('link', { name: 'Workspace', exact: true })).toHaveAttribute(
    'href',
    '#workspace'
  )
  await expect(page.getByRole('link', { name: 'Components', exact: true })).toHaveAttribute(
    'href',
    '/storybook/'
  )
  await expect(page.getByRole('link', { name: /Devsigner/ }).first()).toHaveAttribute(
    'href',
    'https://devsigner.xyz'
  )
  await expect(page.getByText('420,562', { exact: true })).toBeVisible()
  await page.waitForTimeout(250)
  expect(historicalRequests).toEqual([])
  expect(errors).toEqual([])
})

test('every remaining exported product image loads when its section enters the viewport', async ({
  page
}) => {
  await page.goto('/')
  const images = page.locator('main img')
  await expect(images).toHaveCount(4)

  for (let index = 0; index < (await images.count()); index += 1) {
    const image = images.nth(index)
    await image.scrollIntoViewIfNeeded()
    await expect.poll(() => image.evaluate((node) => node.naturalWidth)).toBeGreaterThan(0)
    await expect(image).not.toHaveAttribute('alt', '')
  }

  const carouselImages = page.locator('.landing-mode-slide img')
  await expect(carouselImages).toHaveCount(3)
  for (let index = 0; index < (await carouselImages.count()); index += 1) {
    await expect
      .poll(() =>
        carouselImages.nth(index).evaluate((node) => ({
          height: node.naturalHeight,
          width: node.naturalWidth
        }))
      )
      .toEqual({ height: 900, width: 1600 })
    await expect(carouselImages.nth(index)).toHaveCSS('object-fit', 'contain')
  }
})

test('hero carousel rotates through the three chart modes and supports manual control', async ({
  page
}) => {
  await page.goto('/')
  const carousel = page.getByRole('region', { name: 'Apex Trader chart modes' })
  await expect(carousel).toHaveAttribute('data-active-mode', 'candles')
  await expect(carousel).toHaveAttribute('data-rotation-state', 'playing')

  await carousel.getByRole('button', { name: 'Step Profile' }).click()
  await expect(carousel).toHaveAttribute('data-active-mode', 'step-profile')
  await expect(carousel).toHaveAttribute('data-rotation-state', 'paused')
  await expect(carousel.getByRole('button', { name: 'Step Profile' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )

  await carousel.getByRole('button', { name: 'Resume rotation' }).click()
  await expect(carousel).toHaveAttribute('data-rotation-state', 'playing')
})

test('isolated market primitives load near the viewport without mounting the workstation', async ({
  page
}) => {
  const consoleProblems = []
  const historicalRequests = []
  const showcaseRequests = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning')
      consoleProblems.push(message.text())
  })
  page.on('pageerror', (error) => consoleProblems.push(error.message))
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/data/tardis/')) historicalRequests.push(url)
    if (url.includes('/src/components/landing/MarketPrimitivesShowcase.jsx'))
      showcaseRequests.push(url)
  })

  await page.goto('/')
  expect(showcaseRequests).toEqual([])

  const loader = page.locator('.landing-primitives-loader')
  await loader.scrollIntoViewIfNeeded()
  const showcase = page.locator('.landing-primitives')
  await expect(showcase).toBeVisible()
  expect(showcaseRequests).toHaveLength(1)

  await expect(showcase.locator('.landing-primitive')).toHaveCount(6)
  await expect(showcase.locator('.market-chart')).toHaveCount(0)
  await expect(showcase.getByRole('button')).toHaveCount(2)
  await expect(
    showcase.locator('[data-primitive="candles"] g.up, [data-primitive="candles"] g.down')
  ).toHaveCount(5)
  await expect(showcase.locator('[data-primitive="footprint"] .footprint-bar')).toHaveCount(2)
  await expect(showcase.locator('[data-primitive="step-profile"] .step-profile-bar')).toHaveCount(2)
  for (const primitive of [
    'candles',
    'footprint',
    'step-profile',
    'volume-profile',
    'dom',
    'last-trades'
  ]) {
    const row = showcase.locator(`[data-primitive="${primitive}"]`)
    await expect(row).toHaveCSS('box-shadow', 'none')
    await expect(row).toHaveCSS('border-top-width', '0px')
    await expect(row).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(row.locator('.landing-primitive__visual')).toHaveCSS('box-shadow', 'none')
    await expect(row.locator('.landing-primitive__visual')).toHaveCSS('border-top-width', '0px')
    await expect(row.locator('.landing-primitive__visual')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)'
    )
  }
  for (const primitive of ['footprint', 'step-profile']) {
    const row = showcase.locator(`[data-primitive="${primitive}"]`)
    await expect(row.locator('.landing-completed-order-flow')).toHaveAttribute(
      'transform',
      'translate(0 6)'
    )
    await expect(row.locator('.landing-current-order-flow')).toHaveAttribute(
      'transform',
      'translate(0 -6)'
    )
  }
  const compactDom = showcase.locator('.dom--compact')
  await expect(compactDom.locator(':scope > header')).toContainText('BTC · 0.25 · x1')
  await expect(compactDom.locator('.dom-row.ask')).toHaveCount(3)
  await expect(compactDom.locator('.dom-spread-row')).toHaveCount(1)
  await expect(compactDom.locator('.dom-row.bid')).toHaveCount(3)
  await expect(compactDom).toHaveCSS('width', '500px')
  const domAlignment = await compactDom.evaluate((node) => {
    const parent = node.parentElement.getBoundingClientRect()
    const panel = node.getBoundingClientRect()
    return {
      centerDelta: Math.abs(panel.left + panel.width / 2 - (parent.left + parent.width / 2)),
      truncatedValues: [...node.querySelectorAll('.dom-row span, .dom-spread-row strong')].filter(
        (cell) => cell.scrollWidth > cell.clientWidth
      ).length
    }
  })
  expect(domAlignment.centerDelta).toBeLessThanOrEqual(1)
  expect(domAlignment.truncatedValues).toBe(0)

  const domSettingsButton = showcase.getByRole('button', { name: 'Compact DOM settings' })
  await domSettingsButton.click()
  const domSettings = showcase.getByRole('dialog', { name: 'Compact DOM settings' })
  await expect(domSettings).toBeVisible()
  await showcase.getByLabel('Compact DOM price grouping').selectOption('0.5')
  await expect(compactDom).toHaveAttribute('data-price-grouping', '0.5')
  await expect(compactDom.locator(':scope > header')).toContainText('BTC · 0.50 · x2')
  await page.keyboard.press('Escape')
  await expect(domSettings).toBeHidden()
  await expect(domSettingsButton).toBeFocused()

  const compactTape = showcase.locator('.tape--compact')
  await expect(compactTape.locator('.tape-row')).toHaveCount(3)
  const tapeSettingsButton = showcase.getByRole('button', {
    name: 'Compact Time and Sales settings'
  })
  await tapeSettingsButton.click()
  const tapeSettings = showcase.getByRole('dialog', {
    name: 'Compact Time and Sales settings'
  })
  await expect(tapeSettings).toBeVisible()
  await tapeSettings.getByRole('radio', { name: 'Buys only' }).check()
  await expect(compactTape).toHaveAttribute('data-trade-filter', 'buy')
  await expect(compactTape.locator('.tape-row.sell')).toHaveCount(0)
  await expect(compactTape.locator('.tape-row.buy')).not.toHaveCount(0)
  await tapeSettings.getByRole('radio', { name: 'All trades' }).check()
  await expect(compactTape.locator('.tape-row')).toHaveCount(3)
  await page.keyboard.press('Escape')
  await expect(tapeSettings).toBeHidden()
  await expect(tapeSettingsButton).toBeFocused()
  await expect(showcase).not.toContainText('NaN')

  const primitiveRows = showcase.locator('.landing-primitive')
  await expect(primitiveRows.nth(0).locator('.landing-primitive__visual')).toHaveCSS(
    'grid-area',
    'visual'
  )
  await expect(primitiveRows.nth(1)).toHaveCSS('grid-template-areas', '"copy visual"')

  const initialPhase = await showcase.getAttribute('data-phase')
  const initialClose = await showcase.locator('.landing-current-candle').getAttribute('data-close')
  await expect
    .poll(() => showcase.getAttribute('data-phase'), { timeout: 4_000 })
    .not.toBe(initialPhase)
  await expect(showcase.locator('.landing-current-candle')).not.toHaveAttribute(
    'data-close',
    initialClose
  )
  expect(consoleProblems).toEqual([])
  expect(historicalRequests).toEqual([])
})

test('primary landing CTA opens the canonical demo', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Launch demo' }).click()
  await expect(page).toHaveURL(/\/demo$/)
  await expect(page.getByText('APEX TRADER', { exact: true })).toBeVisible()
  await expect(page.getByLabel('candles historical chart')).toBeVisible()
})

test('legacy and unknown paths replace to their canonical destinations', async ({ page }) => {
  const cases = [
    ['/price-chart', '/demo'],
    ['/footprint', '/demo/footprint'],
    ['/step-profile', '/demo/step-profile'],
    ['/not-a-route', '/']
  ]

  for (const [source, destination] of cases) {
    await page.goto(source, { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(new RegExp(`${destination.replaceAll('/', '\\/')}$`))
  }
})

test('mobile landing has no horizontal overflow and honors reduced motion', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const carousel = page.getByRole('region', { name: 'Apex Trader chart modes' })
  await expect(carousel).toHaveAttribute('data-rotation-state', 'static')
  await expect(carousel).toHaveAttribute('data-active-mode', 'candles')

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open demo' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Modes', exact: true })).toBeHidden()

  await page.locator('.landing-primitives-loader').scrollIntoViewIfNeeded()
  const showcase = page.locator('.landing-primitives')
  await expect(showcase).toHaveAttribute('data-animation-state', 'static')
  await expect(showcase).toHaveAttribute('data-phase', '0')
  await expect(showcase.locator('.landing-primitive')).toHaveCount(6)
  await page.locator('.landing-footer').scrollIntoViewIfNeeded()
  const finalDimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }))
  expect(finalDimensions.scrollWidth).toBeLessThanOrEqual(finalDimensions.clientWidth)
})
