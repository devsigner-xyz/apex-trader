import { expect, test } from '@playwright/test'

const CHUNK_MS = 15 * 60 * 1000

test.use({ viewport: { height: 1080, width: 1920 } })

test('initial historical loading stays pending through a recoverable 503', async ({ page }) => {
  let releaseRetry
  let signalRetry
  let requests = 0
  const retryStarted = new Promise((resolve) => {
    signalRetry = resolve
  })
  const retryGate = new Promise((resolve) => {
    releaseRetry = resolve
  })

  await page.route('**/book-066.json.gz', async (route) => {
    requests += 1
    if (requests === 1) {
      await route.fulfill({ status: 503 })
      return
    }
    signalRetry()
    await retryGate
    await route.continue()
  })

  await page.goto('/demo')
  await retryStarted
  await expect(page.getByText('Loading the real BTCUSDT session…')).toBeVisible()
  await expect(page.getByText(/Historical session unavailable/)).toHaveCount(0)

  releaseRetry()
  await expect(page.getByLabel('candles historical chart')).toBeVisible()
  expect(requests).toBe(2)
})

test('failed prefetch is non-fatal and a later current chunk retry preserves the terminal', async ({
  page
}) => {
  await page.addInitScript(() => {
    const realNow = Performance.prototype.now
    let offset = 0
    Performance.prototype.now = function shiftedNow() {
      return realNow.call(this) + offset
    }
    window.__advanceHistoricalReplay = (elapsed) => {
      offset += elapsed
    }
  })

  let releaseRecovery
  let signalRecovery
  let requests = 0
  const recoveryStarted = new Promise((resolve) => {
    signalRecovery = resolve
  })
  const recoveryGate = new Promise((resolve) => {
    releaseRecovery = resolve
  })

  await page.route('**/book-067.json.gz', async (route) => {
    requests += 1
    if (requests <= 4) {
      await route.fulfill({ status: 503 })
      return
    }
    signalRecovery()
    await recoveryGate
    await route.continue()
  })

  await page.goto('/demo')
  const chart = page.getByLabel('candles historical chart')
  const dom = page.locator('.dom')
  await expect(chart).toBeVisible()
  await chart.evaluate((node) => {
    window.__historicalChartNode = node
  })
  await expect.poll(() => requests).toBe(3)
  await expect(page.getByText(/Historical session unavailable/)).toHaveCount(0)

  await page.evaluate((elapsed) => window.__advanceHistoricalReplay(elapsed), CHUNK_MS + 1000)
  await recoveryStarted
  const bufferedGroups = await dom.getAttribute('data-groups-applied')
  await expect(chart).toBeVisible()
  await expect(page.getByText(/Historical session unavailable/)).toHaveCount(0)
  expect(await chart.evaluate((node) => node === window.__historicalChartNode)).toBe(true)
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
  await expect(dom).toHaveAttribute('data-groups-applied', bufferedGroups)

  releaseRecovery()
  await expect.poll(() => dom.getAttribute('data-groups-applied')).not.toBe(bufferedGroups)
  await expect(chart).toBeVisible()
  await expect(page.getByText(/Historical session unavailable/)).toHaveCount(0)
  expect(requests).toBe(5)
})
