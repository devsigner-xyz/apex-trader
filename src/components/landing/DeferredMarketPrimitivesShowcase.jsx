import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const MarketPrimitivesShowcase = lazy(() => import('./MarketPrimitivesShowcase.jsx'))

export default function DeferredMarketPrimitivesShowcase() {
  const rootRef = useRef(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root || shouldLoad) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: '500px 0px', threshold: 0 }
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div className="landing-primitives-loader" data-showcase-loaded={shouldLoad} ref={rootRef}>
      {shouldLoad ? (
        <Suspense
          fallback={
            <div className="landing-primitives-fallback" role="status">
              Preparing the interactive market views…
            </div>
          }
        >
          <MarketPrimitivesShowcase />
        </Suspense>
      ) : (
        <div className="landing-primitives-fallback" role="status">
          Preparing the interactive market views…
        </div>
      )}
    </div>
  )
}
