import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  chunkIndexFor,
  deriveProfessionalView,
  loadPlaybackChunk,
  loadProfessionalSession
} from '../services/proPlayback.js'

export function useProfessionalPlayback() {
  const [session, setSession] = useState(null)
  const [chunk, setChunk] = useState(null)
  const [timestamp, setTimestamp] = useState(null)
  const [playing, setPlaying] = useState(true)
  const [error, setError] = useState(null)
  const tick = useRef(null)
  const lastView = useRef(null)

  useEffect(() => {
    loadProfessionalSession()
      .then((next) => {
        setSession(next)
        setTimestamp(
          Math.min(next.playbackStart + 4 * 60 * 60 * 1000, next.sessionEndExclusive - 1)
        )
      })
      .catch((reason) => setError(reason.message))
  }, [])

  const chunkIndex =
    session && timestamp !== null ? chunkIndexFor(timestamp, session.sessionStart) : null
  useEffect(() => {
    if (chunkIndex === null || chunk?.index === chunkIndex) return
    let current = true
    loadPlaybackChunk(chunkIndex)
      .then((next) => {
        if (current) setChunk(next)
      })
      .catch((reason) => setError(reason.message))
    return () => {
      current = false
    }
  }, [chunk?.index, chunkIndex])

  useEffect(() => {
    if (chunkIndex === null || chunkIndex >= 95) return
    loadPlaybackChunk(chunkIndex + 1).catch(() => undefined)
  }, [chunkIndex])

  useEffect(() => {
    if (!playing || !session || chunk?.index !== chunkIndex) return undefined
    tick.current = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const elapsed = now - tick.current
      tick.current = now
      setTimestamp((value) => {
        const next = value + elapsed
        return next >= session.sessionEndExclusive ? session.playbackStart : next
      })
    }, 50)
    return () => window.clearInterval(timer)
  }, [chunk?.index, chunkIndex, playing, session])

  const seek = useCallback((next) => setTimestamp(Number(next)), [])
  const currentView = useMemo(
    () =>
      session && chunk?.index === chunkIndex && timestamp !== null
        ? deriveProfessionalView(session, chunk, timestamp)
        : null,
    [chunk, chunkIndex, session, timestamp]
  )
  if (currentView) lastView.current = currentView
  const view = currentView ?? lastView.current
  return {
    error,
    isBuffering: Boolean(view && !currentView),
    isLoading: !view && !error,
    playing,
    seek,
    session,
    setPlaying,
    timestamp,
    view
  }
}
