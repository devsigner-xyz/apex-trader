import { useEffect, useMemo, useRef, useState } from 'react'
import {
  advancePlaybackTime,
  derivePlaybackView,
  loadTardisSession
} from '../services/tardisPlayback.js'

const INITIAL_HISTORY_MS = 4 * 60 * 60 * 1000

export function useTardisPlayback() {
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [timestamp, setTimestamp] = useState(null)
  const lastTickRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    loadTardisSession()
      .then((nextSession) => {
        if (cancelled) return
        setSession(nextSession)
        setTimestamp(
          Math.min(
            nextSession.playbackStart + INITIAL_HISTORY_MS,
            nextSession.sessionEndExclusive - 1
          )
        )
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!session) return undefined

    lastTickRef.current = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const elapsedMs = now - lastTickRef.current
      lastTickRef.current = now
      setTimestamp((currentTimestamp) =>
        advancePlaybackTime(currentTimestamp ?? session.playbackStart, elapsedMs, session)
      )
    }, 250)

    return () => window.clearInterval(timer)
  }, [session])

  const view = useMemo(
    () => (session && timestamp !== null ? derivePlaybackView(session, timestamp) : null),
    [session, timestamp]
  )

  return {
    error,
    isLoading: !session && !error,
    session,
    view
  }
}
