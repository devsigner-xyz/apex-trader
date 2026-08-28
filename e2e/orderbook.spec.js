const { expect, test } = require('@playwright/test')

test.use({ viewport: { height: 1080, width: 1920 } })

test.describe('Professional historical order flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo')
    await expect(page.locator('.replay-status')).toHaveCount(0)
    const footer = page.locator('.terminal-footer')
    const link = footer.getByRole('link', { name: 'devsigner.xyz', exact: true })
    await expect(footer).toHaveText('ApexTrader by devsigner.xyz')
    await expect(link).toHaveAttribute('href', /^https:\/\/devsigner\.xyz\/?$/)
    await expect(link).toHaveAttribute('target', '_blank')
    const rel = (await link.getAttribute('rel'))?.split(/\s+/) ?? []
    expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
    await expect(page.locator('.window-label')).toHaveCount(0)
  })

  test('renders the reconstructed DOM with a balanced visible ladder', async ({ page }) => {
    const rows = page.locator('.dom-row')
    expect(await rows.count()).toBeGreaterThan(34)
    expect(await page.locator('.dom-row.ask').count()).toBeGreaterThan(17)
    expect(await page.locator('.dom-row.bid').count()).toBeGreaterThan(17)
    const spreadRow = page.locator('.dom-spread-row')
    await expect(spreadRow).toHaveCount(1)
    await expect(spreadRow).toContainText('LAST')
    await expect(spreadRow).toContainText('SPREAD')
    await expect(page.getByText(/Exact groups applied/)).toHaveCount(0)
    await expect(page.locator('.dom footer')).toHaveCount(0)
    await expect(page.getByText(/LADDER|D42|CUM/)).toHaveCount(0)

    const separator = await page.locator('.dom-ladder').evaluate((ladder) => {
      const asks = ladder.querySelector('.dom-book-side--asks')
      const bids = ladder.querySelector('.dom-book-side--bids')
      const spread = ladder.querySelector('.dom-spread-row')
      return {
        askBeforeSpread: asks.nextElementSibling === spread,
        askScrollTop: asks.scrollTop,
        askScrollable: asks.scrollHeight > asks.clientHeight,
        bidAfterSpread: spread.nextElementSibling === bids,
        bidScrollTop: bids.scrollTop,
        bidScrollable: bids.scrollHeight > bids.clientHeight,
        spread: Number(spread.dataset.spread)
      }
    })
    expect(separator.askBeforeSpread).toBe(true)
    expect(separator.askScrollTop).toBeGreaterThan(0)
    expect(separator.askScrollable).toBe(true)
    expect(separator.bidAfterSpread).toBe(true)
    expect(separator.bidScrollTop).toBe(0)
    expect(separator.bidScrollable).toBe(true)
    expect(separator.spread).toBeGreaterThan(0)

    const askLevels = page.getByLabel('Ask price levels')
    const bidLevels = page.getByLabel('Bid price levels')
    const spreadBeforeScroll = await spreadRow.boundingBox()
    const initialAskScroll = await askLevels.evaluate((node) => node.scrollTop)
    await askLevels.evaluate((node) => {
      node.scrollTop = Math.max(0, node.scrollTop - 120)
      node.dispatchEvent(new Event('scroll'))
    })
    const scrolledAsk = await askLevels.evaluate((node) => node.scrollTop)
    const unchangedBid = await bidLevels.evaluate((node) => node.scrollTop)
    expect(scrolledAsk).toBeLessThan(initialAskScroll)
    expect(unchangedBid).toBe(0)

    await bidLevels.evaluate((node) => {
      node.scrollTop = 120
      node.dispatchEvent(new Event('scroll'))
    })
    const scrolledBid = await bidLevels.evaluate((node) => node.scrollTop)
    const unchangedAsk = await askLevels.evaluate((node) => node.scrollTop)
    const spreadAfterScroll = await spreadRow.boundingBox()
    expect(scrolledBid).toBeGreaterThan(0)
    expect(unchangedAsk).toBe(scrolledAsk)
    expect(spreadAfterScroll.y).toBeCloseTo(spreadBeforeScroll.y, 0)
    await page.screenshot({
      fullPage: false,
      path: 'output/playwright/dom-independent-scroll-1920x1080.png'
    })

    const dimensions = await page.locator('.dom').evaluate((dom) => {
      const ladder = dom.querySelector('.dom-ladder')
      return {
        domBottom: dom.getBoundingClientRect().bottom,
        ladderBottom: ladder.getBoundingClientRect().bottom,
        ladderHeight: ladder.getBoundingClientRect().height
      }
    })
    expect(dimensions.ladderHeight).toBeGreaterThan(700)
    expect(Math.abs(dimensions.domBottom - dimensions.ladderBottom)).toBeLessThanOrEqual(1)
  })

  test('sends a selected real DOM price to the execution ticket', async ({ page }) => {
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Promise((resolve) => {
              const row = document.querySelector('.dom-row.bid')
              const input = document.querySelector('[aria-label="Limit price"]')
              if (!row?.dataset.price || !input) {
                resolve(false)
                return
              }
              const expected = Number(row.dataset.price).toFixed(2)
              row.click()
              requestAnimationFrame(() => resolve(input.value === expected))
            })
        )
      )
      .toBe(true)
  })

  test('groups real DOM levels into configurable price increments', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: 'DOM settings' })
    await expect(settingsButton).toBeVisible()
    await settingsButton.click()

    const settings = page.getByRole('dialog', { name: 'DOM settings' })
    const grouping = page.getByLabel('DOM price grouping')
    await expect(settings).toBeVisible()
    await expect(grouping.locator('option')).toHaveText([
      '0.01 USDT · x1',
      '0.05 USDT · x5',
      '0.10 USDT · x10',
      '0.50 USDT · x50',
      '1.00 USDT · x100',
      '5.00 USDT · x500'
    ])

    await grouping.selectOption('0.1')
    await expect(page.locator('.dom')).toHaveAttribute('data-price-grouping', '0.1')
    await expect(page.locator('.dom > header')).toContainText('BTC · 0.10 · x10')

    const groupedRows = await page
      .locator('.dom-row')
      .evaluateAll((rows) => rows.map((row) => Number(row.dataset.price)))
    expect(groupedRows.length).toBeGreaterThan(2)
    expect(groupedRows.every((price) => Math.abs(price * 10 - Math.round(price * 10)) < 1e-8)).toBe(
      true
    )

    const ladder = await page.locator('.dom-ladder').evaluate((node) => ({
      childCount: node.children.length,
      spreadIndex: [...node.children].indexOf(node.querySelector('.dom-spread-row'))
    }))
    expect(ladder).toEqual({ childCount: 3, spreadIndex: 1 })

    await page.screenshot({
      fullPage: false,
      path: 'output/playwright/dom-settings-price-grouping-1920x1080.png'
    })
    await page.keyboard.press('Escape')
    await expect(settings).toBeHidden()
  })

  test('keeps DOM, Time and Sales and chart on the shared historical clock', async ({ page }) => {
    const countdown = page.locator('.current-price-countdown')
    const countdownBefore = await countdown.textContent()
    const firstTradeBefore = await page.locator('.tape > button').first().textContent()
    const groupsBefore = Number(await page.locator('.dom').getAttribute('data-groups-applied'))

    await expect(countdown).not.toHaveText(countdownBefore)
    await expect(page.locator('.tape > button').first()).not.toHaveText(firstTradeBefore, {
      timeout: 10_000
    })
    await expect
      .poll(async () => Number(await page.locator('.dom').getAttribute('data-groups-applied')), {
        timeout: 10_000
      })
      .toBeGreaterThan(groupsBefore)
  })

  test('filters Time and Sales by aggressor from its settings', async ({ page }) => {
    const tape = page.locator('.tape')
    const settingsButton = page.getByRole('button', { name: 'Time and Sales settings' })

    await expect(tape.locator(':scope > header')).toContainText('BTC · Showing all')
    await settingsButton.click()

    const settings = page.getByRole('dialog', { name: 'Time and Sales settings' })
    await expect(settings).toBeVisible()
    await page.getByRole('radio', { name: 'Buys only' }).check()
    await expect(tape.locator(':scope > header')).toContainText('BTC · Showing buys')
    await expect(tape.locator(':scope > button.buy')).not.toHaveCount(0)
    await expect(tape.locator(':scope > button.sell')).toHaveCount(0)

    await page.getByRole('radio', { name: 'Sells only' }).check()
    await expect(tape.locator(':scope > header')).toContainText('BTC · Showing sells')
    await expect(tape.locator(':scope > button.sell')).not.toHaveCount(0)
    await expect(tape.locator(':scope > button.buy')).toHaveCount(0)
  })

  test('aggregates the retained five-minute market bars into selectable intervals', async ({
    page
  }) => {
    const timeframe = page.getByLabel('Timeframe')
    const visibleBars = page.locator(
      '.market-chart .chart-data-layer > g.up, .market-chart .chart-data-layer > g.down'
    )

    await timeframe.selectOption('5')
    await expect(visibleBars).toHaveCount(34)
    await timeframe.selectOption('15')
    await expect(timeframe).toHaveValue('15')
    const fifteenMinuteBars = await visibleBars.count()
    expect(fifteenMinuteBars).toBeGreaterThan(10)
    expect(fifteenMinuteBars).toBeLessThan(34)
    await timeframe.selectOption('60')
    await expect(timeframe).toHaveValue('60')
    const hourlyBars = await visibleBars.count()
    expect(hourlyBars).toBeGreaterThan(1)
    expect(hourlyBars).toBeLessThan(fifteenMinuteBars)
  })
})
