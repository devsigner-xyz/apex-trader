import { expect, test } from '@playwright/test'

test.use({ viewport: { height: 1080, width: 1920 } })

test('orders and positions remain visible at a smaller desktop viewport', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 })
  await page.goto('/demo/step-profile')

  const activity = page.getByLabel('Orders and positions')
  const footer = page.locator('.terminal-footer')
  const marketHeader = page.locator('.market-header')
  const ticket = page.locator('.ticket')
  const tape = page.locator('.tape')
  const dom = page.locator('.dom')
  const ladder = page.locator('.dom-ladder')
  await expect(activity).toBeVisible()

  const activityBox = await activity.boundingBox()
  const footerBox = await footer.boundingBox()
  const marketHeaderBox = await marketHeader.boundingBox()
  const ticketBox = await ticket.boundingBox()
  const tapeBox = await tape.boundingBox()
  const domBox = await dom.boundingBox()
  const ladderBox = await ladder.boundingBox()
  expect(activityBox.height).toBeGreaterThanOrEqual(200)
  expect(activityBox.y + activityBox.height).toBeLessThanOrEqual(footerBox.y)
  expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(900)
  expect(footerBox.x).toBe(0)
  expect(footerBox.width).toBe(marketHeaderBox.width)
  expect(footerBox.width).toBeGreaterThanOrEqual(1440)
  expect(ticketBox.y + ticketBox.height).toBeLessThanOrEqual(tapeBox.y + 1)
  expect(tapeBox.height).toBeGreaterThan(190)
  expect(domBox.height).toBeGreaterThanOrEqual(750)
  expect(ladderBox.height).toBeGreaterThan(580)
})

test('mobile demo shows the desktop workstation notice and project CTA', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.goto('/demo')

  const notice = page.getByRole('dialog', { name: 'APEX TRADER ESTÁ PENSADO PARA ESCRITORIO' })
  await expect(notice).toBeVisible()
  await expect(notice.locator('video')).toHaveAttribute(
    'poster',
    '/media/hero-terminal-candles-800.avif'
  )
  const projectLink = notice.getByRole('link', { name: 'VER DETALLE DEL PROYECTO' })
  await expect(projectLink).toHaveAttribute(
    'href',
    'https://www.devsigner.xyz/proyectos/apextrader/'
  )
  await expect(projectLink).toHaveAttribute('target', '_blank')
})
