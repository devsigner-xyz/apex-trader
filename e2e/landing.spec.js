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

  await expect(page.getByRole('link', { name: 'Apex Trader home' }).locator('img')).toHaveAttribute(
    'src',
    '/media/apex-trader.svg'
  )
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.png')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('See beyond the candles.')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Open demo' }).first()).toHaveAttribute(
    'href',
    '/demo'
  )
  await expect(
    page.getByText(
      'Personal portfolio demo by devsigner.xyz - for interface exploration, not live trading.'
    )
  ).toBeVisible()
  const heroDevsignerLink = page.locator('.landing-actions').getByRole('link', {
    name: 'Visit devsigner.xyz'
  })
  await expect(heroDevsignerLink).toHaveAttribute('href', 'https://devsigner.xyz')
  await expect(heroDevsignerLink).toHaveAttribute('target', '_blank')
  await expect(heroDevsignerLink).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(page.getByText('Four prices are not the whole interval.')).toHaveCount(0)
  await expect(page.locator('#blind-spot')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Market views', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Component library', exact: true })).toHaveAttribute(
    'href',
    '/storybook/'
  )
  await expect(page.getByRole('link', { name: /Devsigner/ }).first()).toHaveAttribute(
    'href',
    'https://devsigner.xyz'
  )
  await expect(page.getByText('One market moment, seen from every angle.')).toHaveCount(0)
  await expect(page.getByText('Follow the session, not a highlight.')).toHaveCount(0)
  await expect(page.getByText('Move from overview to execution detail.')).toHaveCount(0)
  await expect(page.getByText('ONE SESSION / THREE MARKET VIEWS', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Visit devsigner.xyz ↗' })).toHaveAttribute(
    'href',
    'https://devsigner.xyz'
  )
  const aiConversation = page.getByRole('region', { name: 'Ask an AI about Apex Trader' })
  await expect(aiConversation.getByRole('heading', { level: 2 })).toHaveText(
    'Ask an AI about Apex Trader.'
  )
  await expect(
    aiConversation.getByText('Candles, Footprint, Step Profile, Volume Profile')
  ).toBeVisible()
  for (const provider of ['ChatGPT', 'Claude', 'Perplexity']) {
    const providerLink = aiConversation.getByRole('link', { name: new RegExp(provider) })
    await expect(providerLink).toHaveAttribute('target', '_blank')
    await expect(providerLink).toHaveAttribute('rel', 'noreferrer nofollow')
  }
  for (const provider of ['Grok', 'Copilot']) {
    await expect(aiConversation.getByRole('button', { name: new RegExp(provider) })).toBeVisible()
  }
  await page.waitForTimeout(250)
  expect(historicalRequests).toEqual([])
  expect(errors).toEqual([])
})

test('every remaining exported product image loads when its section enters the viewport', async ({
  page
}) => {
  await page.goto('/')
  const replay = page.locator('.landing-mode-carousel__video')
  await expect(replay).toHaveCount(1)
  await expect(replay).toHaveAttribute('poster', '/media/hero-terminal-candles.avif')
  await expect(replay.locator('source[type="video/mp4"]')).toHaveAttribute(
    'src',
    '/media/hero-replay.mp4'
  )
  await expect(replay.locator('source[type="video/webm"]')).toHaveAttribute(
    'src',
    '/media/hero-replay.webm'
  )
  await expect
    .poll(() => replay.evaluate((node) => ({ height: node.videoHeight, width: node.videoWidth })))
    .toEqual({ height: 900, width: 1600 })
  await expect(replay).toHaveCSS('object-fit', 'contain')
  await expect(page.locator('.landing-mode-carousel')).toHaveCSS('border-top-width', '1px')
})

test('hero replay uses the compact AVIF poster on mobile', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.goto('/')

  await expect(page.locator('.landing-mode-carousel__video')).toHaveAttribute(
    'poster',
    '/media/hero-terminal-candles-800.avif'
  )
})

test('hero replay rotates through the three chart modes and supports manual control', async ({
  page
}) => {
  await page.goto('/')
  const carousel = page.getByRole('region', { name: 'Apex Trader workstation replay' })
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

  await expect(showcase.locator('.landing-primitive')).toHaveCount(7)
  await expect(showcase.locator('.landing-primitive__sequence')).toHaveCount(0)
  await expect(showcase.locator('.landing-primitive-grid-backdrop')).toHaveCount(7)
  for (const valueMessage of [
    'SEE DIRECTION AND MOMENTUM',
    'SEE WHO TRADED AT EACH PRICE',
    'SEE WHERE VOLUME CONCENTRATED',
    'FIND THE PRICES THE MARKET ACCEPTED',
    'SEE LIQUIDITY BEFORE PRICE ARRIVES',
    'WATCH LIQUIDITY FORM AROUND PRICE',
    'FOLLOW THE PACE OF EXECUTION'
  ]) {
    await expect(showcase.getByText(valueMessage, { exact: true })).toBeVisible()
  }
  for (const implementationMessage of [
    'LATEST BAR UPDATES',
    'CURRENT VALUES UPDATE',
    'CURRENT DISTRIBUTION UPDATES',
    'BARS UPDATE',
    'DEPTH UPDATES',
    'STREAM UPDATES'
  ]) {
    await expect(showcase.getByText(implementationMessage, { exact: false })).toHaveCount(0)
  }
  await expect(showcase.locator('.market-chart')).toHaveCount(0)
  await expect(showcase.getByRole('button')).toHaveCount(3)
  await expect(
    showcase.locator('[data-primitive="candles"] g.up, [data-primitive="candles"] g.down')
  ).toHaveCount(5)
  await expect(showcase.locator('[data-primitive="footprint"] .footprint-bar')).toHaveCount(2)
  await expect(showcase.locator('[data-primitive="step-profile"] .step-profile-bar')).toHaveCount(2)
  const volumeProfile = showcase.locator('[data-primitive="volume-profile"]')
  await expect(
    volumeProfile.getByRole('img', { name: 'Updating visible-range Volume Profile' })
  ).toBeVisible()
  await expect(volumeProfile.locator('.session-profile-bars > g')).toHaveCount(9)
  await expect(volumeProfile.locator('.landing-profile-marker')).toHaveCount(3)
  await expect(volumeProfile.locator('.landing-profile-price-axis')).toHaveCount(0)
  const heatmap = showcase.locator('[data-primitive="liquidity-heatmap"]')
  await expect(heatmap.locator('.landing-heatmap-liquidity-line')).toHaveCount(96)
  await expect(
    heatmap.getByRole('img', { name: 'Liquidity heatmap by price and time' })
  ).toBeVisible()
  await expect(heatmap.locator('.landing-heatmap-candles')).toHaveCount(0)
  await expect(heatmap.locator('.landing-heatmap-price-tick')).toHaveCount(0)
  await expect(heatmap.locator('.landing-heatmap-price-axis-bg')).toHaveCount(0)
  await expect(heatmap.getByText('TIME', { exact: true })).toHaveCount(0)
  await expect(heatmap.locator('.landing-heatmap-header')).toContainText('BTC · LIQUIDITY')
  const heatmapScene = heatmap.locator('.landing-heatmap-scene')
  await expect(heatmapScene).toHaveAttribute('data-intensity', '75')
  await heatmap.getByRole('button', { name: 'Liquidity heatmap settings' }).click()
  const heatmapSettings = heatmap.getByRole('dialog', { name: 'Liquidity heatmap settings' })
  await expect(heatmapSettings).toBeVisible()
  const heatmapIntensity = heatmapSettings.getByLabel('Liquidity heatmap intensity')
  await expect(heatmapIntensity).toHaveValue('75')
  await expect(heatmapIntensity).toHaveAttribute('min', '20')
  await expect(heatmapIntensity).toHaveAttribute('max', '100')
  await expect(heatmapIntensity).toHaveAttribute('step', '5')
  await heatmapIntensity.fill('40')
  await expect(heatmapScene).toHaveAttribute('data-intensity', '40')
  await page.keyboard.press('Escape')
  await expect(heatmapSettings).toBeHidden()
  for (const primitive of [
    'candles',
    'footprint',
    'step-profile',
    'volume-profile',
    'liquidity-heatmap',
    'dom',
    'last-trades'
  ]) {
    const row = showcase.locator(`[data-primitive="${primitive}"]`)
    const backdrop = row.locator('.landing-primitive-grid-backdrop')
    await expect(backdrop).toHaveAttribute('data-backdrop', 'grid')
    await expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    await expect(backdrop).toHaveCSS('background-image', /linear-gradient/)
    await expect(backdrop).toHaveCSS('mask-image', 'none')
    await expect(backdrop).toHaveCSS('animation-name', 'none')
    await expect(row).toHaveCSS('box-shadow', 'rgba(0, 0, 0, 0.28) 0px 14px 28px 0px')
    await expect(row).toHaveCSS('border-top-width', '1px')
    await expect(row).toHaveCSS('border-radius', '16px')
    await expect(row).toHaveCSS('background-color', 'rgb(20, 26, 31)')
    await expect(row.locator('.landing-primitive__visual')).toHaveCSS('box-shadow', 'none')
    await expect(row.locator('.landing-primitive__visual')).toHaveCSS('border-top-width', '0px')
    await expect(row.locator('.landing-primitive__visual')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)'
    )
  }
  await expect(showcase).toHaveAttribute('data-animation-state', 'running')
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
  const domSpreadRow = compactDom.locator('.dom-spread-row')
  await expect(domSpreadRow).toHaveCount(1)
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
  const initialDomPrice = await domSpreadRow.getAttribute('data-price')
  const initialDomSpread = await domSpreadRow.getAttribute('data-spread')
  await expect
    .poll(() => domSpreadRow.getAttribute('data-price'), { timeout: 4_000 })
    .not.toBe(initialDomPrice)
  await expect
    .poll(() => domSpreadRow.getAttribute('data-spread'), { timeout: 4_000 })
    .not.toBe(initialDomSpread)

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
  await expect(compactTape.locator('.tape-row')).toHaveCount(6)
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
  await expect(compactTape.locator('.tape-row')).toHaveCount(6)
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
  await page.getByRole('link', { name: 'Open demo' }).first().click()
  await expect(page).toHaveURL(/\/demo$/)
  await expect(page.getByRole('img', { name: 'Apex Trader' })).toBeVisible()
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

  const carousel = page.getByRole('region', { name: 'Apex Trader workstation replay' })
  await expect(carousel).toHaveAttribute('data-rotation-state', 'static')
  await expect(carousel).toHaveAttribute('data-active-mode', 'candles')

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open demo' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Market views', exact: true })).toHaveCount(0)

  await page.locator('.landing-primitives-loader').scrollIntoViewIfNeeded()
  const showcase = page.locator('.landing-primitives')
  await expect(showcase).toHaveAttribute('data-animation-state', 'static')
  await expect(showcase).toHaveAttribute('data-phase', '0')
  await expect(showcase.locator('.landing-primitive')).toHaveCount(7)
  await expect(showcase.locator('.landing-primitive-grid-backdrop').first()).toHaveCSS(
    'animation-name',
    'none'
  )
  await page.locator('.landing-footer').scrollIntoViewIfNeeded()
  const finalDimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }))
  expect(finalDimensions.scrollWidth).toBeLessThanOrEqual(finalDimensions.clientWidth)
})
