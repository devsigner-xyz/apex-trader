import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMarketDataMiddleware } from './marketDataMiddleware.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const port = Number.parseInt(process.env.PORT ?? '3000', 10)
const marketData = createMarketDataMiddleware()

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
}

function resolveStatic(pathname) {
  const decoded = decodeURIComponent(pathname)
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '')
  const resolved = path.resolve(distDir, relative)
  return resolved.startsWith(`${distDir}${path.sep}`) ? resolved : null
}

async function serveStatic(req, res) {
  let pathname
  try {
    pathname = new URL(req.url, 'http://localhost').pathname
  } catch {
    res.writeHead(400).end()
    return
  }
  let filePath
  try {
    filePath = resolveStatic(pathname)
  } catch {
    res.writeHead(400).end()
    return
  }
  if (!filePath) {
    res.writeHead(404).end()
    return
  }
  try {
    const info = await stat(filePath)
    if (!info.isFile()) throw new Error('Not a file')
  } catch {
    filePath = path.join(distDir, 'index.html')
  }
  const extension = path.extname(filePath)
  const immutable = filePath.includes(`${path.sep}assets${path.sep}`)
  res.writeHead(200, {
    'Content-Type': TYPES[extension] ?? 'application/octet-stream',
    'Cache-Control': immutable
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff'
  })
  if (req.method === 'HEAD') return res.end()
  createReadStream(filePath).pipe(res)
}

const server = createServer((req, res) => {
  marketData(req, res, () => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' })
      return res.end()
    }
    return serveStatic(req, res)
  }).catch(() => {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal server error.' }))
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Apex Trader listening on port ${port}.`)
})
