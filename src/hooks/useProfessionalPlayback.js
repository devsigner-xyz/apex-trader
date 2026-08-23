import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { chunkIndexFor, deriveProfessionalView, loadPlaybackChunk, loadProfessionalSession } from '../services/proPlayback.js'

export const playbackSpeeds = [1, 10, 60, 300, 1200]

export function useProfessionalPlayback() {
  const [session, setSession] = useState(null)
  const [chunk, setChunk] = useState(null)
  const [timestamp, setTimestamp] = useState(null)
  const [speed, setSpeed] = useState(60)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState(null)
  const tick = useRef(null)

  useEffect(() => {
    loadProfessionalSession().then((next) => {
      setSession(next)
      setTimestamp(Math.min(next.playbackStart + 4 * 60 * 60 * 1000, next.sessionEndExclusive - 1))
    }).catch((reason) => setError(reason.message))
  }, [])

  const chunkIndex = session && timestamp !== null ? chunkIndexFor(timestamp, session.sessionStart) : null
  useEffect(() => {
    if (chunkIndex === null || chunk?.index === chunkIndex) return
    let current = true
    loadPlaybackChunk(chunkIndex).then((next) => { if (current) setChunk(next) }).catch((reason) => setError(reason.message))
    return () => { current = false }
  }, [chunk?.index, chunkIndex])

  useEffect(() => {
    if (!playing || !session) return undefined
    tick.current = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const elapsed = now - tick.current
      tick.current = now
      setTimestamp((value) => {
        const next = value + elapsed * speed
        return next >= session.sessionEndExclusive ? session.playbackStart : next
      })
    }, 50)
    return () => window.clearInterval(timer)
  }, [playing, session, speed])

  const seek = useCallback((next) => setTimestamp(Number(next)), [])
  const view = useMemo(() => session && chunk?.index === chunkIndex && timestamp !== null ? deriveProfessionalView(session, chunk, timestamp) : null, [chunk, chunkIndex, session, timestamp])
  return { error, isLoading: !view && !error, playing, seek, session, setPlaying, setSpeed, speed, timestamp, view }
}
