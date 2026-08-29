import { expect, test } from '@playwright/test'

test.use({ viewport: { height: 1080, width: 1920 } })

const settingsPanels = [
  {
    dialogName: 'Markets columns',
    disabledControls: ['Show SYM column', 'Show LAST column'],
    firstControl: 'Show BID column',
    lastControl: 'Show VOL column',
    triggerName: 'Markets settings'
  },
  {
    dialogName: 'Chart settings',
    disabledControls: [],
    firstControl: 'Show visible range volume profile',
    lastControl: 'Liquidity heatmap intensity',
    triggerName: 'Chart settings'
  },
  {
    dialogName: 'DOM settings',
    disabledControls: [],
    firstControl: 'DOM price grouping',
    lastControl: 'DOM price grouping',
    triggerName: 'DOM settings'
  },
  {
    dialogName: 'Time and Sales settings',
    disabledControls: [],
    firstControl: 'All trades',
    lastControl: 'Sells only',
    triggerName: 'Time and Sales settings'
  }
]

async function openWithKeyboard(page, trigger, dialog) {
  await trigger.focus()
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(trigger).toBeFocused()
}

async function expectActivityState(page, activeName) {
  const tabs = page.getByRole('tab')
  const activeTab = page.getByRole('tab', { name: activeName })
  const states = await tabs.evaluateAll((nodes) =>
    nodes.map((node) => ({
      controls: node.getAttribute('aria-controls'),
      id: node.id,
      selected: node.getAttribute('aria-selected'),
      tabIndex: node.getAttribute('tabindex')
    }))
  )

  expect(states.filter((state) => state.tabIndex === '0')).toHaveLength(1)
  expect(states.find((state) => state.selected === 'true')?.id).toBe(await activeTab.getAttribute('id'))
  expect(states.every((state) => state.controls === 'activity-panel')).toBe(true)
  await expect(activeTab).toBeFocused()
  await expect(activeTab).toHaveAttribute('aria-selected', 'true')
  await expect(activeTab).toHaveAttribute('tabindex', '0')
  await expect(page.getByRole('tabpanel')).toHaveAttribute(
    'aria-labelledby',
    await activeTab.getAttribute('id')
  )
}

async function expectSettingsPopoverScope(page, panel) {
  const pointerDestination = page.getByRole('tab', { name: /ORDERS/ })
  const trigger = page.getByRole('button', { name: panel.triggerName })
  const dialog = page.getByRole('dialog', { name: panel.dialogName })
  const firstControl = page.getByLabel(panel.firstControl)
  const lastControl = page.getByLabel(panel.lastControl)

  await openWithKeyboard(page, trigger, dialog)
  for (const name of panel.disabledControls) await expect(page.getByLabel(name)).toBeDisabled()

  await page.keyboard.press('Tab')
  await expect(firstControl).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(lastControl).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(trigger).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(firstControl).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toBeFocused()

  await openWithKeyboard(page, trigger, dialog)
  await page.keyboard.press('Enter')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()

  await openWithKeyboard(page, trigger, dialog)
  await pointerDestination.click()
  await expect(dialog).toBeHidden()
  await expect(pointerDestination).toBeFocused()
}

for (const panel of settingsPanels) {
  test(`${panel.triggerName} retains focus within its explicit keyboard scope`, async ({ page }) => {
    await page.goto('/demo')
    await expectSettingsPopoverScope(page, panel)
  })
}

test('Chart settings exclude a disabled range from the keyboard scope', async ({ page }) => {
  await page.goto('/demo')
  const trigger = page.getByRole('button', { name: 'Chart settings' })
  const dialog = page.getByRole('dialog', { name: 'Chart settings' })
  const heatmap = page.getByLabel('Show liquidity heatmap')
  const intensity = page.getByLabel('Liquidity heatmap intensity')

  await openWithKeyboard(page, trigger, dialog)
  await heatmap.focus()
  await page.keyboard.press('Space')
  await expect(intensity).toBeDisabled()
  await page.keyboard.press('Tab')
  await expect(trigger).toBeFocused()
})

test('Activity tabs use roving tabindex and select the focused tab', async ({ page }) => {
  await page.goto('/demo')
  const positions = page.getByRole('tab', { name: /POSITIONS/ })
  const orders = page.getByRole('tab', { name: /ORDERS/ })
  const accountRisk = page.getByRole('tab', { name: 'ACCOUNT & RISK' })

  await positions.focus()
  await expectActivityState(page, /POSITIONS/)
  await page.keyboard.press('ArrowLeft')
  await expectActivityState(page, 'ACCOUNT & RISK')
  await page.keyboard.press('ArrowRight')
  await expectActivityState(page, /POSITIONS/)
  await page.keyboard.press('End')
  await expectActivityState(page, 'ACCOUNT & RISK')
  await page.keyboard.press('Home')
  await expectActivityState(page, /POSITIONS/)

  await page.keyboard.press('Enter')
  await expectActivityState(page, /POSITIONS/)
  await page.keyboard.press('Space')
  await expectActivityState(page, /POSITIONS/)
  await orders.click()
  await expectActivityState(page, /ORDERS/)
  await expect(accountRisk).toHaveAttribute('tabindex', '-1')
})
