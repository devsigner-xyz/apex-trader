const { test, expect } = require('@playwright/test')

test.describe('Orderbook Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('playback-controls')).toBeVisible()
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

  test('switches the candle timeframe without extending the page beyond the viewport', async ({
    page
  }) => {
    await page.goto('/')

    await page.getByRole('button', { name: '15m' }).click()
    await expect(page.getByRole('button', { name: '15m' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.highcharts-title').first()).toContainText('15m')

    const dimensions = await page.evaluate(() => ({
      documentHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight
    }))
    expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight)
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

    const firstBid = page.locator('[data-test="bid-row"]').first()
    await firstBid.focus()
    await firstBid.press('Enter')
    await expect(page.getByLabel('Price (EUR)')).not.toHaveValue('')
    expect(consoleErrors).toEqual([])
  })

  test('shows advanced order controls without demo or execution messaging', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText(/DEMO UI ONLY/i)).toHaveCount(0)
    await page.getByLabel('Order type').selectOption('stopLimit')
    await expect(page.getByLabel('Trigger price (USD)')).toBeVisible()
    await expect(page.getByLabel('Price (USD)', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Review configuration' }).click()
    await expect(page.getByRole('alert')).toContainText('Review the highlighted fields')
    await expect(page.getByLabel('Trigger price (USD)')).toHaveAttribute('aria-invalid', 'true')

    await page.getByLabel('Trigger price (USD)').fill('101000')
    await page.getByLabel('Price (USD)', { exact: true }).fill('101100')
    await page.getByLabel('Quantity (BTC)').fill('0.01')
    await page.getByRole('button', { name: 'Review configuration' }).click()
    await expect(page.getByText('Configuration is complete.', { exact: true })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/demo|simulat|no ejecutable/i)

    await page.getByLabel('Order type').selectOption('iceberg')
    await expect(page.getByLabel('Visible quantity (BTC)')).toBeVisible()
    await expect(page.getByLabel('Post only (display only)')).toBeVisible()

    const dimensions = await page.evaluate(() => ({
      documentHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight
    }))
    expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight)
  })
})

test.describe('Historical Tardis playback', () => {
  test('renders the local BTCUSDT session and keeps playback views synchronized', async ({
    page
  }) => {
    const consoleErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => consoleErrors.push(error.message))

    await page.goto('/')
    await expect(page.getByTestId('playback-controls')).toBeVisible()
    await expect(page.getByTestId('price-chart').locator('svg')).toBeVisible()
    const clock = page.getByTestId('playback-clock')
    const initialClock = await clock.textContent()
    await page.getByLabel('Playback speed').selectOption('3600')

    await page.getByRole('button', { name: 'Footprint' }).click()

    await expect(page.getByTestId('footprint-chart')).toBeVisible()
    await expect(
      page.getByText(/HISTÓRICO — trades reales de Binance Spot BTCUSDT agregados desde Tardis/)
    ).toBeVisible()
    await expect(page.getByTestId('footprint-inspector')).toBeVisible()
    await expect(page.getByTestId('cvd-panel')).toBeVisible()
    await expect(clock).not.toHaveText(initialClock ?? '')
    await page.getByRole('button', { name: 'Precio', exact: true }).click()
    await expect(page.getByTestId('price-chart').locator('svg')).toBeVisible()
    expect(consoleErrors).toEqual([])
  })

  test('persists footprint controls and exposes exact diagonal detail to keyboard users', async ({
    page
  }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
    await expect(page.getByTestId('playback-controls')).toBeVisible()
    await page.getByRole('button', { name: 'Footprint' }).click()

    await page.getByLabel('Modo de footprint').selectOption('delta')
    await page.getByLabel('Tick size').fill('10')
    await page.getByLabel('Ratio de imbalance').fill('2.5')
    await page.getByLabel('Volumen mínimo').fill('1')
    await page.getByLabel('Escala de intensidad').selectOption('logarithmic')
    await page.getByLabel('Formato de volumen').selectOption('precise')
    await page.getByLabel('Tamaño de imbalance apilado').selectOption('2')

    await expect(page.locator('.footprint-cell-text').first()).toHaveText(/^Δ /)
    const firstCell = page.locator('[data-cell-id]').first()
    await firstCell.focus()
    await expect(page.getByTestId('footprint-tooltip')).toContainText('Ask diagonal')
    await firstCell.press('ArrowUp')
    await expect(page.getByTestId('footprint-tooltip')).toContainText('umbral 2.5× / mínimo 1')

    await page.reload()
    await page.getByRole('button', { name: 'Footprint' }).click()
    await expect(page.getByLabel('Modo de footprint')).toHaveValue('delta')
    await expect(page.getByLabel('Tick size')).toHaveValue('10')
    await expect(page.getByLabel('Ratio de imbalance')).toHaveValue('2.5')
    await expect(page.getByLabel('Volumen mínimo')).toHaveValue('1')
    await expect(page.getByLabel('Escala de intensidad')).toHaveValue('logarithmic')
    await expect(page.getByLabel('Formato de volumen')).toHaveValue('precise')
    await expect(page.getByLabel('Tamaño de imbalance apilado')).toHaveValue('2')
  })

  test('filters executed Time & Sales and synchronizes its selection with footprint and CVD', async ({
    page
  }) => {
    await page.goto('/')
    const tape = page.getByTestId('time-and-sales')
    await expect(tape).toBeVisible()
    await page.getByLabel('Lado de Time and Sales').selectOption('buy')
    await page.getByLabel('Agrupación de Time and Sales').selectOption('price')
    const selectedRow = tape.getByTestId('time-sales-row').first()
    await selectedRow.press('Enter')
    await expect(selectedRow).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Footprint' }).click()
    await expect(page.getByTestId('cvd-panel')).toBeVisible()
    await expect(page.locator('.footprint-chart g.is-cross-selected')).toHaveCount(1)
    await page.getByLabel('Reset de CVD').selectOption('window')
    await page.getByLabel('Barras de ventana CVD').fill('2')
    await expect(page.getByLabel('Contribución delta por barra').getByRole('button')).toHaveCount(2)
    await page.getByRole('button', { name: 'Resetear en barra seleccionada' }).click()
    await expect(page.getByLabel('Reset de CVD')).toHaveValue('manual')
  })
})
