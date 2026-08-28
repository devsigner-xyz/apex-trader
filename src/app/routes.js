export const demoModes = ['candles', 'footprint', 'step-profile']

const canonicalPathByMode = {
  candles: '/demo',
  footprint: '/demo/footprint',
  'step-profile': '/demo/step-profile'
}

const demoModeByPath = Object.fromEntries(
  Object.entries(canonicalPathByMode).map(([mode, path]) => [path, mode])
)

const legacyCanonicalPath = {
  '/price-chart': '/demo',
  '/footprint': '/demo/footprint',
  '/step-profile': '/demo/step-profile'
}

function normalizePathname(pathname) {
  if (typeof pathname !== 'string' || pathname.length === 0) return '/'
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '') || '/'
}

export function demoPathForMode(mode) {
  return canonicalPathByMode[mode] ?? canonicalPathByMode.candles
}

export function resolveRoute(pathname) {
  const path = normalizePathname(pathname)

  if (path === '/') return { canonicalPath: '/', kind: 'landing' }

  const canonicalMode = demoModeByPath[path]
  if (canonicalMode) return { canonicalPath: path, kind: 'demo', mode: canonicalMode }

  const legacyPath = legacyCanonicalPath[path]
  if (legacyPath)
    return {
      canonicalPath: legacyPath,
      kind: 'demo',
      mode: demoModeByPath[legacyPath],
      replace: true
    }

  return { canonicalPath: '/', kind: 'landing', replace: true }
}
