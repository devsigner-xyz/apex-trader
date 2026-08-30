export const terminalViews = [
  ['/demo', 'candles'],
  ['/demo/footprint', 'footprint'],
  ['/demo/step-profile', 'step-profile']
]

export async function expectFooterContract(page, expect) {
  const footer = page.locator('.terminal-footer')
  const link = footer.getByRole('link', { name: 'devsigner.xyz', exact: true })

  await expect(footer).toHaveText('ApexTrader by devsigner.xyz')
  await expect(link).toHaveAttribute('href', /^https:\/\/devsigner\.xyz\/?$/)
  await expect(link).toHaveAttribute('target', '_blank')
  const rel = (await link.getAttribute('rel'))?.split(/\s+/) ?? []
  expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
}

export async function expectInsetSelectChevron(select, expect) {
  const styles = await select.evaluate((node) => {
    const computed = getComputedStyle(node)
    return {
      appearance: computed.appearance,
      backgroundImage: computed.backgroundImage,
      backgroundPosition: computed.backgroundPosition,
      backgroundSize: computed.backgroundSize,
      paddingRight: computed.paddingRight
    }
  })

  expect(styles.appearance).toBe('none')
  expect(styles.backgroundImage).toContain('svg')
  expect(styles.backgroundPosition).toContain('8px')
  expect(styles.backgroundSize).toBe('12px 8px')
  expect(styles.paddingRight).toBe('28px')
}

export async function readChartWindow(chart) {
  return chart.evaluate((node) => ({
    end: node.dataset.windowEnd,
    start: node.dataset.windowStart
  }))
}

export async function readCandleCenter(candle) {
  return candle.evaluate((node) => {
    const line = node.querySelector('line')
    const svg = node.ownerSVGElement
    const point = svg.createSVGPoint()
    point.x = Number(line.getAttribute('x1'))
    point.y = 0
    return point.matrixTransform(line.getScreenCTM()).x
  })
}

export async function moveToCandle(page, chart, candle) {
  const x = await readCandleCenter(candle)
  const chartBounds = await chart.boundingBox()
  await page.mouse.move(x, chartBounds.y + chartBounds.height * 0.45)
}
