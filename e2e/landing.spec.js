import { expect, test } from '@playwright/test'

test('landing renders its product thesis without loading historical data', async ({ page }) => {
  const errors = []
  const historicalRequests = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.url().includes('/api/market-data/')) historicalRequests.push(request.url())
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Candles show the result. They hide the behavior.'
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Launch demo' })).toHaveAttribute('href', '/demo')
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
  await expect(page.getByRole('link', { name: /Devsigner/ }).first()).toHaveAttribute(
    'href',
    'https://devsigner.xyz'
  )
  await expect(page.getByText('481,468', { exact: true })).toBeVisible()
  await page.waitForTimeout(250)
  expect(historicalRequests).toEqual([])
  expect(errors).toEqual([])
})

test('every exported product image loads when its section enters the viewport', async ({
  page
}) => {
  await page.goto('/')
  const images = page.locator('main img')
  await expect(images).toHaveCount(8)

  for (let index = 0; index < (await images.count()); index += 1) {
    const image = images.nth(index)
    await image.scrollIntoViewIfNeeded()
    await expect.poll(() => image.evaluate((node) => node.naturalWidth)).toBeGreaterThan(0)
    await expect(image).not.toHaveAttribute('alt', '')
  }
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

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open demo' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Modes', exact: true })).toBeHidden()
})
