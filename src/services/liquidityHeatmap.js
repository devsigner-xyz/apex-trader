const EXPECTED_TILE_SCHEMA = 'apextrader.liquidity-tile/v1'

export function decodeLiquidityValues(encoded, expectedLength) {
  if (typeof encoded !== 'string') throw new TypeError('Liquidity values must be base64 encoded.')
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
  if (bytes.byteLength !== expectedLength * 2)
    throw new TypeError('Liquidity tile byte length does not match its geometry.')
  const values = new Uint16Array(expectedLength)
  const view = new DataView(bytes.buffer)
  for (let index = 0; index < expectedLength; index += 1)
    values[index] = view.getUint16(index * 2, true)
  return values
}

export function normalizeLiquidityTile(raw, normalizationMaxAmount) {
  if (
    raw?.schema !== EXPECTED_TILE_SCHEMA ||
    !Number.isInteger(raw.priceCount) ||
    raw.priceCount < 1 ||
    !Number.isInteger(raw.sampleCount) ||
    raw.sampleCount < 1 ||
    !Number.isFinite(raw.priceMin) ||
    !Number.isFinite(raw.priceStep) ||
    raw.priceStep <= 0 ||
    !Number.isFinite(raw.sampleDurationMs) ||
    raw.sampleDurationMs <= 0 ||
    !Number.isFinite(raw.chunkStart) ||
    !Number.isFinite(raw.amountScale) ||
    raw.amountScale <= 0
  )
    throw new TypeError('Unexpected liquidity tile.')

  return {
    ...raw,
    normalizationMaxAmount,
    values: decodeLiquidityValues(raw.values, raw.priceCount * raw.sampleCount)
  }
}

export function liquidityTileValue(tile, sampleIndex, priceIndex) {
  if (
    sampleIndex < 0 ||
    sampleIndex >= tile.sampleCount ||
    priceIndex < 0 ||
    priceIndex >= tile.priceCount
  )
    return 0
  return tile.values[sampleIndex * tile.priceCount + priceIndex] / tile.amountScale
}

export function createLiquidityColorLut({ amountScale, intensity, normalizationMaxAmount }) {
  const safeIntensity = Math.min(Math.max(Number(intensity) || 0, 0), 1)
  const safeMaximum = Math.max(Number(normalizationMaxAmount) || 1, 1)
  const denominator = Math.log1p(safeMaximum)
  const lut = new Uint8ClampedArray(65_536 * 4)

  for (let raw = 1; raw < 65_536; raw += 1) {
    const strength = Math.min(Math.log1p(raw / amountScale) / denominator, 1)
    let start
    let end
    let phase
    if (strength < 0.45) {
      start = [10, 48, 72]
      end = [21, 132, 157]
      phase = strength / 0.45
    } else if (strength < 0.76) {
      start = [21, 132, 157]
      end = [220, 193, 68]
      phase = (strength - 0.45) / 0.31
    } else {
      start = [220, 193, 68]
      end = [224, 103, 45]
      phase = (strength - 0.76) / 0.24
    }
    const offset = raw * 4
    lut[offset] = Math.round(start[0] + (end[0] - start[0]) * phase)
    lut[offset + 1] = Math.round(start[1] + (end[1] - start[1]) * phase)
    lut[offset + 2] = Math.round(start[2] + (end[2] - start[2]) * phase)
    lut[offset + 3] = Math.round((0.04 + strength * 0.82) * safeIntensity * 255)
  }
  return lut
}

export function liquiditySampleAt(tile, timestamp, price) {
  const sampleIndex = Math.floor((timestamp - tile.chunkStart) / tile.sampleDurationMs)
  const priceIndex = Math.floor((price - tile.priceMin) / tile.priceStep)
  if (
    sampleIndex < 0 ||
    sampleIndex >= tile.sampleCount ||
    priceIndex < 0 ||
    priceIndex >= tile.priceCount
  )
    return 0
  return tile.values[sampleIndex * tile.priceCount + priceIndex]
}

export const liquidityTileSchema = EXPECTED_TILE_SCHEMA
