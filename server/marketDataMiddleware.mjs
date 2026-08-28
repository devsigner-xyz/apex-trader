import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import {
  createRailwayBucketManifestLoader,
  createRailwayBucketPresigner
} from './bucketPresigner.mjs'
import { toPublicMarketDataManifest, validateMarketDataManifest } from './marketDataManifest.mjs'

const API_ROOT = '/api/market-data'
const ASSET_ROOT = `${API_ROOT}/assets/`
const DEFAULT_LOCAL_ROOT = path.resolve('.cache/bybit/compiled')

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  })
  res.end(JSON.stringify(body))
}

function configuredOrigins(env) {
  return new Set(
    (env.MARKET_DATA_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  )
}

function corsHeaders(req, env) {
  const origin = req.headers.origin
  if (!origin) return { Vary: 'Origin' }
  const requestOrigin = `${req.headers['x-forwarded-proto'] ?? 'http'}://${req.headers.host}`
  const allowed = origin === requestOrigin || configuredOrigins(env).has(origin)
  return allowed
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : { Vary: 'Origin', forbidden: true }
}

function resolveInside(root, key) {
  const resolvedRoot = path.resolve(root)
  const resolved = path.resolve(resolvedRoot, ...key.split('/'))
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error('Asset key escaped its configured root.')
  }
  return resolved
}

function createManifestStore({ manifestPath }) {
  let cached
  let modifiedAt = -1
  return async () => {
    const info = await stat(manifestPath)
    if (!cached || info.mtimeMs !== modifiedAt) {
      cached = validateMarketDataManifest(JSON.parse(await readFile(manifestPath, 'utf8')))
      modifiedAt = info.mtimeMs
    }
    return cached
  }
}

function defaultConfig(env) {
  const localRoot = path.resolve(env.MARKET_DATA_LOCAL_ROOT ?? DEFAULT_LOCAL_ROOT)
  return {
    localRoot,
    manifestPath: path.resolve(
      env.MARKET_DATA_MANIFEST_PATH ?? path.join(localRoot, 'manifest-v4.json')
    ),
    useLocalAssets: Boolean(env.MARKET_DATA_LOCAL_ROOT) || !env.MARKET_DATA_MANIFEST_KEY
  }
}

export function createMarketDataMiddleware(options = {}) {
  const env = options.env ?? process.env
  const defaults = defaultConfig(env)
  const manifestPath = options.manifestPath ?? defaults.manifestPath
  const localRoot = options.localRoot ?? defaults.localRoot
  const useLocalAssets = options.useLocalAssets ?? defaults.useLocalAssets
  const rawManifestLoader =
    options.loadManifest ??
    (useLocalAssets
      ? createManifestStore({ manifestPath })
      : createRailwayBucketManifestLoader({ env }))
  const loadManifest = async () => validateMarketDataManifest(await rawManifestLoader())
  let presignAsset = options.presignAsset

  async function signer() {
    if (!presignAsset) presignAsset = createRailwayBucketPresigner({ env })
    return presignAsset
  }

  return async function marketDataMiddleware(req, res, next = () => {}) {
    let pathname
    try {
      pathname = new URL(req.url, 'http://localhost').pathname
    } catch {
      return json(res, 400, { error: 'Bad request.' })
    }
    if (pathname !== `${API_ROOT}/manifest` && !pathname.startsWith(ASSET_ROOT)) return next()

    const cors = corsHeaders(req, env)
    if (cors.forbidden) return json(res, 403, { error: 'Origin not allowed.' }, cors)
    delete cors.forbidden
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...cors,
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Accept, Content-Type',
        'Access-Control-Max-Age': '86400'
      })
      return res.end()
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return json(
        res,
        405,
        { error: 'Method not allowed.' },
        { ...cors, Allow: 'GET, HEAD, OPTIONS' }
      )
    }

    let manifest
    try {
      manifest = await loadManifest()
    } catch {
      return json(
        res,
        503,
        { error: 'Market data is unavailable.' },
        { ...cors, 'Cache-Control': 'no-store' }
      )
    }

    if (pathname === `${API_ROOT}/manifest`) {
      const publicManifest = toPublicMarketDataManifest(
        manifest,
        (assetId) => `${ASSET_ROOT}${encodeURIComponent(assetId)}`
      )
      if (req.method === 'HEAD') {
        res.writeHead(200, {
          ...cors,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate',
          'X-Content-Type-Options': 'nosniff'
        })
        return res.end()
      }
      return json(res, 200, publicManifest, {
        ...cors,
        'Cache-Control': 'public, max-age=0, must-revalidate'
      })
    }

    let assetId
    try {
      assetId = decodeURIComponent(pathname.slice(ASSET_ROOT.length))
    } catch {
      return json(res, 400, { error: 'Bad asset id.' }, cors)
    }
    const asset = manifest.assets[assetId]
    if (!asset || assetId.includes('/')) {
      return json(res, 404, { error: 'Asset not found.' }, { ...cors, 'Cache-Control': 'no-store' })
    }

    if (useLocalAssets) {
      let filePath
      try {
        filePath = resolveInside(localRoot, asset.key)
        const info = await stat(filePath)
        if (!info.isFile() || info.size !== asset.bytes) throw new Error('Unexpected asset file.')
      } catch {
        return json(
          res,
          404,
          { error: 'Asset not found.' },
          { ...cors, 'Cache-Control': 'no-store' }
        )
      }
      res.writeHead(200, {
        ...cors,
        'Content-Type': asset.contentType,
        ...(asset.contentEncoding ? { 'Content-Encoding': asset.contentEncoding } : {}),
        'Content-Length': asset.bytes,
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: `"sha256-${asset.sha256}"`,
        'X-Content-Type-Options': 'nosniff'
      })
      if (req.method === 'HEAD') return res.end()
      return createReadStream(filePath).pipe(res)
    }

    try {
      const location = await (await signer())(asset)
      res.writeHead(302, {
        ...cors,
        Location: location,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff'
      })
      return res.end()
    } catch {
      return json(
        res,
        502,
        { error: 'Market data asset is temporarily unavailable.' },
        { ...cors, 'Cache-Control': 'no-store' }
      )
    }
  }
}
