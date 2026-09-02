import { expect, test } from '@playwright/test'
import { expectFooterContract, readChartWindow } from './support/professionalTerminal.js'

test.use({ viewport: { height: 1080, width: 1920 } })

test('historical synchronization, settings and keyboard controls remain coherent', async ({
  page
}) => {
  await page.goto('/demo')
  const countdown = page.locator('.current-price-countdown')
  const countdownBefore = await countdown.textContent()
  await expect(countdown).not.toHaveText(countdownBefore)
  await expectFooterContract(page, expect)
  await expect(page.locator('.window-label')).toHaveCount(0)
  await expect(page.getByLabel('Historical time')).toHaveCount(0)
  await expect(page.getByLabel('Playback speed')).toHaveCount(0)
  await expect(page.getByText(/REPLAYING|BUFFERING|PAUSED/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^(PLAY|PAUSE)$/ })).toHaveCount(0)

  const timeframe = page.getByLabel('Timeframe')
  await expect(timeframe).toHaveValue('30')
  await expect(timeframe.locator('option')).toHaveCount(4)
  await expect(page.getByLabel('candles historical chart')).toHaveAttribute(
    'data-window-end',
    String(Date.UTC(2019, 11, 1, 16, 30))
  )
  await expect(
    page.locator('.market-chart .chart-data-layer > g.up, .market-chart .chart-data-layer > g.down')
  ).toHaveCount(Math.ceil(34 * (1 - 0.3)))
  await timeframe.selectOption('15')
  await expect(timeframe).toHaveValue('15')
  await expect(countdown).toHaveText(/CLOSE 1[0-4]:\d{2}/)
  await timeframe.selectOption('60')
  await expect(timeframe).toHaveValue('60')
  await expect(countdown).toHaveText(/CLOSE \d{2}:\d{2}/)
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
})
