import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function required(value, name) {
  if (!value) throw new Error(`Missing Railway Bucket configuration: ${name}`)
  return value
}

export function railwayBucketConfig(env = process.env) {
  const endpoint = env.AWS_ENDPOINT_URL ?? env.BUCKET_ENDPOINT ?? env.ENDPOINT
  const accessKeyId = env.AWS_ACCESS_KEY_ID ?? env.BUCKET_ACCESS_KEY_ID ?? env.ACCESS_KEY_ID
  const secretAccessKey =
    env.AWS_SECRET_ACCESS_KEY ?? env.BUCKET_SECRET_ACCESS_KEY ?? env.SECRET_ACCESS_KEY
  const bucket = env.AWS_S3_BUCKET_NAME ?? env.BUCKET_NAME ?? env.BUCKET
  const region = env.AWS_DEFAULT_REGION ?? env.BUCKET_REGION ?? env.REGION ?? 'auto'
  const urlStyle = env.AWS_S3_URL_STYLE ?? env.BUCKET_URL_STYLE ?? 'virtual'

  return {
    endpoint: required(endpoint, 'endpoint'),
    accessKeyId: required(accessKeyId, 'access key'),
    secretAccessKey: required(secretAccessKey, 'secret key'),
    bucket: required(bucket, 'bucket'),
    region,
    forcePathStyle: urlStyle === 'path'
  }
}

export function createRailwayBucketClient({ env = process.env } = {}) {
  const config = railwayBucketConfig(env)
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  })
  return { client, config }
}

export function createRailwayBucketPresigner({ env = process.env, expiresIn = 300 } = {}) {
  const { client, config } = createRailwayBucketClient({ env })

  return async ({ key, contentType, contentEncoding }) =>
    getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ResponseContentType: contentType,
        ...(contentEncoding ? { ResponseContentEncoding: contentEncoding } : {})
      }),
      { expiresIn }
    )
}

export function createRailwayBucketManifestLoader({
  env = process.env,
  cacheDurationMs = 60_000,
  now = Date.now,
  bucketClient
} = {}) {
  const key = required(env.MARKET_DATA_MANIFEST_KEY, 'MARKET_DATA_MANIFEST_KEY')
  const { client, config } = bucketClient ?? createRailwayBucketClient({ env })
  let cached
  let expiresAt = 0

  return async () => {
    const currentTime = now()
    if (cached && currentTime < expiresAt) return cached
    try {
      const object = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }))
      if (!object.Body?.transformToString)
        throw new Error('Railway Bucket returned an empty manifest.')
      cached = JSON.parse(await object.Body.transformToString('utf-8'))
      expiresAt = currentTime + cacheDurationMs
      return cached
    } catch (error) {
      if (cached) return cached
      throw error
    }
  }
}
