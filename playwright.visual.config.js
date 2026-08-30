const baseConfig = require('./playwright.config.js')

const chromium = baseConfig.projects.find(({ name }) => name === 'chromium')

module.exports = {
  ...baseConfig,
  expect: {
    ...baseConfig.expect,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixels: 0,
      scale: 'css'
    }
  },
  projects: [chromium],
  testMatch: /visual-regression\.visual\.js/
}
