#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  GetBucketCorsCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3'
import { createRailwayBucketClient } from '../server/bucketPresigner.mjs'
import { validateMarketDataManifest } from '../server/marketDataManifest.mjs'

const DEFAULT_ROOT = path.resolve('.cache/bybit/compiled')
const DATASET_VERSION_PATTERN = /^v4-[a-f0-9]{16,64}$/
const UPLOAD_CONCURRENCY = 6
const DEFAULT_ALLOWED_ORIGIN = 'https://apex.devsigner.xyz'

export function uploadArgumentsFrom(argv) {
  const options = { root: DEFAULT_ROOT }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument !== '--root') throw new Error(`Unknown option: ${argument}`)
    const root = argv[++index]
    if (!root || root.startsWith('--')) throw new Error('Missing value for --root.')
    options.root = path.resolve(root)
  }
  return options
}

export function resolveInside(root, key) {
  const resolvedRoot = path.resolve(root)
  const resolved = path.resolve(resolvedRoot, ...key.split('/'))
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Asset key escaped the compiled root: ${key}`)
  }
  return resolved
}

export async function sha256(file) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

export async function runPool(items, concurrency, visit) {
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor
        cursor += 1
        await visit(items[index], index)
      }
    })
  )
}

export function createUploadPlan(manifest, root) {
  validateMarketDataManifest(manifest)
  if (!DATASET_VERSION_PATTERN.test(manifest.datasetVersion)) {
    throw new Error(`Unexpected dataset version: ${manifest.datasetVersion}`)
  }
  const prefix = `${manifest.datasetVersion}/`
  const keys = new Set()
  const assets = Object.entries(manifest.assets).map(([assetId, asset]) => {
    if (!asset.key.startsWith(prefix)) {
      throw new Error(`Asset key is outside dataset version: ${assetId}`)
    }
    if (keys.has(asset.key)) throw new Error(`Duplicate asset key: ${asset.key}`)
    keys.add(asset.key)
    return { asset, assetId, file: resolveInside(root, asset.key) }
  })
  return {
    assets,
    manifestKey: `${manifest.datasetVersion}/manifest.json`
  }
}

export function objectMatches(object, { bytes, sha256: expectedSha256 }) {
  return object?.ContentLength === bytes && object?.Metadata?.sha256 === expectedSha256
}

export function isNotFound(error) {
  return error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound'
}

export function marketDataAllowedOrigins(env = process.env) {
  const values = (env.MARKET_DATA_ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  const origins = [...new Set(values)]
  if (!origins.length) throw new Error('MARKET_DATA_ALLOWED_ORIGINS cannot be empty.')
  for (const origin of origins) {
    let parsed
    try {
      parsed = new URL(origin)
    } catch {
      throw new Error(`Invalid market data CORS origin: ${origin}`)
    }
    if (parsed.origin !== origin || parsed.protocol !== 'https:') {
      throw new Error(`Market data CORS origins must be exact HTTPS origins: ${origin}`)
    }
  }
  return origins
}

export async function ensureBucketCors(client, bucket, origins) {
  const rule = {
    AllowedHeaders: ['*'],
    AllowedMethods: ['GET', 'HEAD'],
    AllowedOrigins: origins,
    ExposeHeaders: ['Content-Encoding', 'Content-Length', 'Content-Type', 'ETag'],
    MaxAgeSeconds: 86_400
  }
  await client.send(
    new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: { CORSRules: [rule] } })
  )
  const verified = await client.send(new GetBucketCorsCommand({ Bucket: bucket }))
  const [verifiedRule] = verified.CORSRules ?? []
  const verifiedMethods = Array.isArray(verifiedRule?.AllowedMethods)
    ? [...verifiedRule.AllowedMethods].sort()
    : []
  const verifiedOrigins = Array.isArray(verifiedRule?.AllowedOrigins)
    ? [...verifiedRule.AllowedOrigins].sort()
    : []
  if (
    !verifiedRule ||
    JSON.stringify(verifiedMethods) !== JSON.stringify([...rule.AllowedMethods].sort()) ||
    JSON.stringify(verifiedOrigins) !== JSON.stringify([...rule.AllowedOrigins].sort())
  ) {
    throw new Error('Railway Bucket CORS verification failed.')
  }
}

async function headObject(client, bucket, key) {
  try {
    return await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export async function uploadCompiledMarketData({
  root = DEFAULT_ROOT,
  bucketClient = createRailwayBucketClient(),
  concurrency = UPLOAD_CONCURRENCY,
  env = process.env
} = {}) {
  const manifestPath = path.join(root, 'manifest-v4.json')
  const manifestBytes = await readFile(manifestPath)
  const manifest = validateMarketDataManifest(JSON.parse(manifestBytes))
  const plan = createUploadPlan(manifest, root)
  const { client, config } = bucketClient
  const bucket = config.bucket
  const manifestSha256 = createHash('sha256').update(manifestBytes).digest('hex')
  let uploaded = 0
  let skipped = 0
  let uploadedBytes = 0

  // Validate the complete immutable dataset before making any network request.
  await runPool(plan.assets, concurrency, async ({ asset, assetId, file }) => {
    const info = await stat(file)
    if (!info.isFile() || info.size !== asset.bytes) {
      throw new Error(`Compiled asset size mismatch: ${assetId}`)
    }
    if ((await sha256(file)) !== asset.sha256) {
      throw new Error(`Compiled asset hash mismatch: ${assetId}`)
    }
  })

  await ensureBucketCors(client, bucket, marketDataAllowedOrigins(env))

  await runPool(plan.assets, concurrency, async ({ asset, assetId, file }) => {
    const current = await headObject(client, bucket, asset.key)
    if (objectMatches(current, asset)) {
      skipped += 1
      return
    }
    if (current) {
      throw new Error(`Immutable asset collision: ${assetId}`)
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: asset.key,
        Body: createReadStream(file),
        ContentLength: asset.bytes,
        ContentType: asset.contentType,
        ...(asset.contentEncoding ? { ContentEncoding: asset.contentEncoding } : {}),
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: { sha256: asset.sha256 }
      })
    )
    const verified = await headObject(client, bucket, asset.key)
    if (!objectMatches(verified, asset)) {
      throw new Error(`Uploaded asset verification failed: ${assetId}`)
    }
    uploaded += 1
    uploadedBytes += asset.bytes
  })

  const manifestIdentity = { bytes: manifestBytes.length, sha256: manifestSha256 }
  const currentManifest = await headObject(client, bucket, plan.manifestKey)
  if (!objectMatches(currentManifest, manifestIdentity)) {
    if (currentManifest) throw new Error('Immutable manifest collision.')
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: plan.manifestKey,
        Body: manifestBytes,
        ContentLength: manifestBytes.length,
        ContentType: 'application/json',
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: { sha256: manifestSha256 }
      })
    )
    const manifestHead = await headObject(client, bucket, plan.manifestKey)
    if (!objectMatches(manifestHead, manifestIdentity)) {
      throw new Error('Uploaded manifest verification failed.')
    }
  }

  return {
    assets: plan.assets.length,
    bucket,
    datasetVersion: manifest.datasetVersion,
    manifestKey: plan.manifestKey,
    skipped,
    uploaded,
    uploadedBytes
  }
}

export async function main(argv = process.argv.slice(2)) {
  const result = await uploadCompiledMarketData(uploadArgumentsFrom(argv))
  console.log(JSON.stringify(result))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
