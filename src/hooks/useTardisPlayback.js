import { useEffect, useMemo, useRef, useState } from 'react'
import {
  advancePlaybackTime,
  derivePlaybackView,
  loadTardisSession
} from '../services/tardisPlayback.js'

export const playbackSpeeds = [60, 300, 1200, 3600]
const DEFAULT_PLAYBACK_SPEED = 60

export function useTardisPlayback() {
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [speed, setSpeed] = useState(DEFAULT_PLAYBACK_SPEED)
  const [timestamp, setTimestamp] = useState(null)
  const lastTickRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    loadTardisSession()
      .then((nextSession) => {
        if (cancelled) return
        setSession(nextSession)
        setTimestamp(nextSession.playbackStart)
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
        advancePlaybackTime(currentTimestamp ?? session.playbackStart, elapsedMs, speed, session)
      )
    }, 250)

    return () => window.clearInterval(timer)
  }, [session, speed])

  const view = useMemo(
    () => (session && timestamp !== null ? derivePlaybackView(session, timestamp) : null),
    [session, timestamp]
  )

  return {
    error,
    isLoading: !session && !error,
    session,
    setSpeed,
    speed,
    view
  }
}
