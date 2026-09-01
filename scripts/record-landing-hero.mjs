import { execFile } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { chromium } from '@playwright/test'

const execFileAsync = promisify(execFile)
const baseUrl = process.env.APEX_BASE_URL ?? 'http://127.0.0.1:5190'
const rawDirectory = path.resolve('output/playwright/landing-hero-video')
const outputDirectory = path.resolve('public/media')

await mkdir(rawDirectory, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  recordVideo: { dir: rawDirectory, size: { height: 900, width: 1600 } },
  viewport: { height: 900, width: 1600 }
})
const page = await context.newPage()
const video = page.video()

await page.goto(`${baseUrl}/demo`, { waitUntil: 'networkidle' })
await page.getByLabel('candles historical chart').waitFor({ state: 'visible' })
await page.waitForTimeout(4_000)
await page.getByLabel('Chart mode').selectOption('footprint')
await page.getByLabel('footprint historical chart').waitFor({ state: 'visible' })
await page.waitForTimeout(4_200)
await page.getByLabel('Chart mode').selectOption('step-profile')
await page.getByLabel('step-profile historical chart').waitFor({ state: 'visible' })
await page.waitForTimeout(4_200)

await context.close()
if (!video) throw new Error('Playwright did not expose the recorded video')
const rawPath = await video.path()
await browser.close()
const outputs = [
  ['hero-replay.mp4', ['-c:v', 'libx264', '-preset', 'medium', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']],
  ['hero-replay.webm', ['-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-deadline', 'good', '-cpu-used', '4']]
]

for (const [filename, codecArguments] of outputs) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-ss',
    '4',
    '-i',
    rawPath,
    '-t',
    '12.1',
    '-an',
    ...codecArguments,
    path.join(outputDirectory, filename)
  ])
}

console.log(`Generated ${path.join(outputDirectory, 'hero-replay.mp4')} and hero-replay.webm`)
