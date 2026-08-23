import { expect, test } from '@playwright/test'

const views = [
  ['/price-chart', 'candles'],
  ['/footprint', 'footprint'],
  ['/step-profile', 'step-profile']
]

test.use({ viewport: { height: 1080, width: 1920 } })

for (const [route, mode] of views) {
  test(`${mode} matches the professional terminal contract`, async ({ page }) => {
    const errors = []
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(route)
    await expect(page.getByText('APEX TRADER', { exact: true })).toBeVisible()
    await expect(page.getByLabel(`${mode} historical chart`)).toBeVisible()
    await expect(page.getByText('TARDIS HISTORICAL')).toBeVisible()
    await expect(page.getByText('DOM', { exact: true })).toBeVisible()
    await expect(page.getByText('TIME & SALES')).toBeVisible()
    await page.screenshot({ fullPage: false, path: `output/playwright/${mode}-1920x1080.png` })
    expect(errors).toEqual([])
  })
}

test('playback, settings and keyboard controls remain coherent', async ({ page }) => {
  await page.goto('/price-chart')
  const clock = page.locator('.playback-dock output')
  const before = await clock.textContent()
  await page.keyboard.press('Tab')
  await expect(page.locator(':focus')).toBeVisible()
  await page.getByLabel('Playback speed').selectOption('1200')
  await page.getByRole('button', { name: 'PLAY' }).click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'PAUSE' }).click()
  expect(await clock.textContent()).not.toBe(before)
  await page.getByRole('button', { name: /Layout 01/ }).click()
  await expect(page.getByRole('dialog', { name: 'Workspace settings' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Workspace settings' })).toBeHidden()
  await page.getByLabel('Chart mode').selectOption('footprint')
  await expect(page).toHaveURL(/\/footprint$/)
  await expect(page.getByLabel('footprint historical chart')).toBeVisible()
})
