import { expect, test } from '@playwright/test'

const desktopViewport = { height: 1080, width: 1920 }
const screenshotOptions = {
  animations: 'disabled',
  caret: 'hide',
  maxDiffPixels: 0,
  scale: 'css'
}

async function freezeReplayClock(page) {
  await page.addInitScript(() => {
    Object.defineProperty(Performance.prototype, 'now', {
      configurable: true,
      value: () => 0
    })
  })
}

async function gotoStablePage(page, path, viewport = desktopViewport) {
  await page.setViewportSize(viewport)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await freezeReplayClock(page)
  await page.goto(path)
  await page.evaluate(() => document.fonts?.ready)
}

test('Candles chart initial visual contract', async ({ page }) => {
  await gotoStablePage(page, '/demo')
  const chart = page.getByLabel('candles historical chart')
  await expect(chart).toBeVisible()
  await expect(chart).toHaveScreenshot('candles-initial.png', screenshotOptions)
})

test('Footprint chart initial visual contract', async ({ page }) => {
  await gotoStablePage(page, '/demo/footprint')
  const chart = page.getByLabel('footprint historical chart')
  await expect(chart).toBeVisible()
  await expect(chart).toHaveScreenshot('footprint-initial.png', screenshotOptions)
})

test('Step Profile chart initial visual contract', async ({ page }) => {
  await gotoStablePage(page, '/demo/step-profile')
  const chart = page.getByLabel('step-profile historical chart')
  await expect(chart).toBeVisible()
  await expect(chart).toHaveScreenshot('step-profile-initial.png', screenshotOptions)
})

test('chart settings visual contract', async ({ page }) => {
  await gotoStablePage(page, '/demo')
  await page.getByRole('button', { name: 'Chart settings' }).click()
  const chart = page.locator('.market-chart')
  await expect(page.getByRole('dialog', { name: 'Chart settings' })).toBeVisible()
  await expect(chart).toHaveScreenshot('chart-settings-open.png', screenshotOptions)
})

test('resized volume panel visual contract', async ({ page }) => {
  await gotoStablePage(page, '/demo/footprint')
  await page.getByLabel('Resize volume panel').focus()
  await page.keyboard.press('ArrowUp')
  const stack = page.locator('.chart-stack')
  await expect(page.getByRole('img', { name: 'Volume panel', exact: true })).toBeVisible()
  await expect(stack).toHaveScreenshot('volume-panel-resized.png', screenshotOptions)
})

test('Account and Risk summary visual contract', async ({ page }) => {
  await gotoStablePage(page, '/demo')
  await page.getByRole('tab', { name: 'ACCOUNT & RISK' }).click()
  const activity = page.getByLabel('Orders and positions')
  await expect(page.getByRole('button', { name: 'VIEW MORE' })).toBeVisible()
  await expect(activity).toHaveScreenshot('account-risk-summary.png', screenshotOptions)
})

test('Account and Risk details visual contract', async ({ page }) => {
  await gotoStablePage(page, '/demo')
  await page.getByRole('tab', { name: 'ACCOUNT & RISK' }).click()
  await page.getByRole('button', { name: 'VIEW MORE' }).click()
  await expect(page.getByRole('dialog', { name: 'ACCOUNT & RISK DETAILS' })).toBeVisible()
  await expect(page).toHaveScreenshot('account-risk-details.png', screenshotOptions)
})

test('mobile workstation notice visual contract', async ({ page }) => {
  await gotoStablePage(page, '/demo', { height: 844, width: 390 })
  await expect(
    page.getByRole('dialog', { name: 'APEX TRADER ESTÁ PENSADO PARA ESCRITORIO' })
  ).toBeVisible()
  await expect(page).toHaveScreenshot('demo-mobile-workstation-notice.png', screenshotOptions)
})

test('landing desktop visual contract', async ({ page }) => {
  await gotoStablePage(page, '/')
  const landing = page.locator('main')
  await expect(landing).toBeVisible()
  await expect(landing).toHaveScreenshot('landing-desktop.png', screenshotOptions)
})

test('landing mobile visual contract', async ({ page }) => {
  await gotoStablePage(page, '/', { height: 844, width: 390 })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).toHaveScreenshot('landing-mobile-390x844.png', screenshotOptions)
})
