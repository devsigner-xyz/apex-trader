export function trackEvent(name, data) {
  if (typeof window === 'undefined' || typeof window.umami?.track !== 'function') return

  try {
    void window.umami.track(name, data)
  } catch {
    // Analytics must never affect the product if the external tracker fails.
  }
}
