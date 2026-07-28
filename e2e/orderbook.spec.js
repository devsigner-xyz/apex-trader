const { test, expect } = require('@playwright/test')

test.describe('Orderbook Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display bid and ask rows', async ({ page }) => {
    const bidRows = page.locator('[data-test="bid-row"]')
    const askRows = page.locator('[data-test="ask-row"]')

    expect(await bidRows.count()).toBeGreaterThan(0)
    expect(await askRows.count()).toBeGreaterThan(0)
  })

  test('should calculate and display bid and ask sums correctly', async ({ page }) => {
    const bidRows = page.locator('[data-test="bid-row"]')
    const askRows = page.locator('[data-test="ask-row"]')

    const lastBidSum = bidRows.last().locator('[data-test="bid-sum"]')
    const lastAskSum = askRows.last().locator('[data-test="ask-sum"]')

    await expect(lastBidSum).toHaveText(/^[1-9]\d*\.\d$/)
    await expect(lastAskSum).toHaveText(/^[1-9]\d*\.\d$/)
  })
})

test.describe('Charts', () => {
  test('renders the price and bid/ask depth charts from static data', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('price-chart').locator('svg')).toBeVisible()
    await expect(page.getByTestId('bid-depth-chart').locator('svg')).toBeVisible()
    await expect(page.getByTestId('ask-depth-chart').locator('svg')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})

test.describe('React trading flows', () => {
  test('opens panels, changes the pair, and sends an orderbook price to the form without console errors', async ({
    page
  }) => {
    const consoleErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => consoleErrors.push(error.message))

    await page.goto('/')
    await expect(page.getByTestId('price-chart').locator('svg')).toBeVisible()

    await page.getByRole('button', { name: 'BTC-USD' }).click()
    const markets = page.getByRole('dialog', { name: 'Markets' })
    await expect(markets).toBeVisible()
    await markets.getByRole('button', { name: 'Select ETH-USD' }).click()
    await expect(markets).toBeHidden()
    await expect(page.getByRole('button', { name: 'ETH-USD' })).toBeVisible()

    await page.getByRole('button', { name: 'Open settings' }).click()
    const settings = page.getByRole('dialog', { name: 'Settings' })
    await expect(settings).toBeVisible()
    await settings.getByLabel('Base currency').selectOption('EUR')
    await settings.getByRole('button', { name: 'Close settings' }).click()
    await expect(settings).toBeHidden()
    await expect(page.getByRole('button', { name: 'ETH-EUR' })).toBeVisible()

    await page.locator('[data-test="bid-row"]').first().click()
    await expect(page.getByLabel('Price (EUR)')).not.toHaveValue('')
    expect(consoleErrors).toEqual([])
  })
})

test.describe('Footprint demo', () => {
  test('switches to the local synthetic footprint simulation and changes scenarios', async ({
    page
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Footprint' }).click()

    await expect(page.getByTestId('footprint-chart')).toBeVisible()
    await expect(
      page.getByText(
        'DEMO — datos sintéticos generados localmente. No son cotizaciones, no son ejecutables y no representan actividad de mercado.'
      )
    ).toBeVisible()
    await expect(page.getByTestId('footprint-inspector')).toBeVisible()

    await page.getByLabel('Escenario').selectOption('breakout')
    await expect(page.getByText('Bid × Ask · Δ = Ask − Bid · SIMULADO')).toBeVisible()
    await page.getByRole('button', { name: 'Precio' }).click()
    await expect(page.getByTestId('price-chart').locator('svg')).toBeVisible()
  })
})
