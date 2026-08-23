const { expect, test } = require('@playwright/test')

test.use({ viewport: { height: 1080, width: 1920 } })

test.describe('Professional historical order flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/price-chart')
    await expect(page.getByText(/TARDIS (REPLAYING|PAUSED|BUFFERING)/)).toBeVisible()
  })

  test('renders the reconstructed DOM with a balanced visible ladder', async ({ page }) => {
    const rows = page.locator('.dom-row')
    await expect(rows).toHaveCount(34)
    await expect(page.locator('.dom-row.ask')).toHaveCount(17)
    await expect(page.locator('.dom-row.bid')).toHaveCount(17)
    const spreadRow = page.locator('.dom-spread-row')
    await expect(spreadRow).toHaveCount(1)
    await expect(spreadRow).toContainText('LAST')
    await expect(spreadRow).toContainText('SPREAD')
    await expect(page.getByText(/Exact groups applied/)).toHaveCount(0)
    await expect(page.locator('.dom footer')).toContainText(/BID .* ASK/)
    await expect(page.getByText(/LADDER|D42|CUM/)).toHaveCount(0)

    const separator = await page.locator('.dom-ladder').evaluate((ladder) => {
      const asks = [...ladder.querySelectorAll('.dom-row.ask')]
      const bids = [...ladder.querySelectorAll('.dom-row.bid')]
      const spread = ladder.querySelector('.dom-spread-row')
      return {
        askBeforeSpread: asks.at(-1).nextElementSibling === spread,
        bidAfterSpread: spread.nextElementSibling === bids[0],
        spread: Number(spread.dataset.spread)
      }
    })
    expect(separator.askBeforeSpread).toBe(true)
    expect(separator.bidAfterSpread).toBe(true)
    expect(separator.spread).toBeGreaterThan(0)

    const dimensions = await page.locator('.dom').evaluate((dom) => {
      const ladder = dom.querySelector('.dom-ladder')
      const footer = dom.querySelector('footer')
      return {
        domBottom: dom.getBoundingClientRect().bottom,
        footerBottom: footer.getBoundingClientRect().bottom,
        ladderHeight: ladder.getBoundingClientRect().height
      }
    })
    expect(dimensions.ladderHeight).toBeGreaterThan(700)
    expect(Math.abs(dimensions.domBottom - dimensions.footerBottom)).toBeLessThanOrEqual(1)
  })

  test('sends a selected real DOM price to the execution ticket', async ({ page }) => {
    await page.getByRole('button', { name: 'PAUSE' }).click()
    const row = page.locator('.dom-row.bid').first()
    const price = await row.getAttribute('data-price')
    await row.click()
    await expect(page.getByLabel('Limit price')).toHaveValue(Number(price).toFixed(2))
  })

  test('keeps DOM, Time and Sales and chart on the shared historical clock', async ({ page }) => {
    const timeline = page.getByLabel('Historical time')
    const before = Number(await timeline.inputValue())
    const firstTradeBefore = await page.locator('.tape button').first().textContent()
    const groupsBefore = Number(await page.locator('.dom').getAttribute('data-groups-applied'))

    await page.waitForTimeout(1000)

    expect(Number(await timeline.inputValue())).toBeGreaterThan(before)
    await expect(page.locator('.tape button').first()).not.toHaveText(firstTradeBefore)
    const groupsAfter = Number(await page.locator('.dom').getAttribute('data-groups-applied'))
    expect(groupsAfter).toBeGreaterThan(groupsBefore)
  })

  test('aggregates the retained five-minute market bars into selectable intervals', async ({
    page
  }) => {
    await page.getByRole('button', { name: 'PAUSE' }).click()
    const timeframe = page.getByLabel('Timeframe')
    const visibleBars = page.getByLabel('Visible bars')

    await timeframe.selectOption('5')
    expect(Number.parseInt(await visibleBars.textContent(), 10)).toBe(34)
    await timeframe.selectOption('15')
    await expect(page.locator('.quiet').first()).toContainText('15M')
    const fifteenMinuteBars = Number.parseInt(await visibleBars.textContent(), 10)
    expect(fifteenMinuteBars).toBeGreaterThan(10)
    expect(fifteenMinuteBars).toBeLessThan(34)
    await timeframe.selectOption('60')
    await expect(page.locator('.quiet').first()).toContainText('1H')
    const hourlyBars = Number.parseInt(await visibleBars.textContent(), 10)
    expect(hourlyBars).toBeGreaterThan(1)
    expect(hourlyBars).toBeLessThan(fifteenMinuteBars)
  })
})
