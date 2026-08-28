import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { demoPathForMode, resolveRoute } from './app/routes.js'
import LandingPage from './pages/LandingPage.jsx'

const DemoPage = lazy(() => import('./pages/DemoPage.jsx'))

function currentRoute() {
  return resolveRoute(window.location.pathname)
}

export default function App() {
  const [route, setRoute] = useState(currentRoute)

  const syncRoute = useCallback(() => {
    const nextRoute = currentRoute()
    if (nextRoute.replace)
      window.history.replaceState({}, '', `${nextRoute.canonicalPath}${window.location.search}`)
    setRoute({ ...nextRoute, replace: false })
  }, [])

  useEffect(() => {
    syncRoute()
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [syncRoute])

  const navigateMode = useCallback((mode) => {
    const path = demoPathForMode(mode)
    window.history.pushState({}, '', path)
    setRoute(resolveRoute(path))
  }, [])

  if (route.kind === 'landing') return <LandingPage />

  return (
    <Suspense fallback={<main className="pro-status">Loading Apex Trader…</main>}>
      <DemoPage mode={route.mode} onMode={navigateMode} />
    </Suspense>
  )
}
