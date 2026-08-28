import {
  chartLiquidityDefaults,
  chartPanelSizeDefaults,
  chartPanelSizeLimits,
  chartPanelVisibilityDefaults,
  optionalWatchlistColumns,
  panelSizeDefaults,
  panelSizeLimits
} from '../components/professional/config.js'

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function normalizeSizes(candidate, defaults, limits) {
  return Object.fromEntries(
    Object.entries(defaults).map(([panel, fallback]) => {
      const value = Number(candidate?.[panel])
      const [minimum, maximum] = limits[panel]
      return [panel, Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback]
    })
  )
}

export function normalizePanelSizes(candidate) {
  return normalizeSizes(candidate, panelSizeDefaults, panelSizeLimits)
}

export function normalizeChartPanelSizes(candidate) {
  return normalizeSizes(candidate, chartPanelSizeDefaults, chartPanelSizeLimits)
}

export function normalizeChartPanelVisibility(candidate) {
  return Object.fromEntries(
    Object.entries(chartPanelVisibilityDefaults).map(([panel, fallback]) => [
      panel,
      typeof candidate?.[panel] === 'boolean' ? candidate[panel] : fallback
    ])
  )
}

export function normalizeChartLiquidity(candidate) {
  const intensity = Number(candidate?.intensity)
  return {
    enabled:
      typeof candidate?.enabled === 'boolean' ? candidate.enabled : chartLiquidityDefaults.enabled,
    intensity: Number.isFinite(intensity)
      ? clamp(intensity, 0.2, 1)
      : chartLiquidityDefaults.intensity
  }
}

export function normalizeWatchlistColumns(candidate) {
  if (!Array.isArray(candidate)) return [...optionalWatchlistColumns]
  return optionalWatchlistColumns.filter((column) => candidate.includes(column))
}

export function readPersistentValue(storage, key, normalize) {
  try {
    return normalize(JSON.parse(storage?.getItem(key)))
  } catch {
    return normalize(undefined)
  }
}

export function writePersistentValue(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value))
    return Boolean(storage)
  } catch {
    return false
  }
}
