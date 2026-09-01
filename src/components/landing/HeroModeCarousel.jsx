import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '../../services/analytics.js'

const modeSlides = [
  {
    id: 'candles',
    label: 'Candles',
    start: 0
  },
  {
    id: 'footprint',
    label: 'Footprint',
    start: 4.2
  },
  {
    id: 'step-profile',
    label: 'Step Profile',
    start: 8.4
  }
]

const replayDuration = 12.12

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return undefined
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return reducedMotion
}

export default function HeroModeCarousel() {
  const rootRef = useRef(null)
  const videoRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden)
  const [userPaused, setUserPaused] = useState(false)
  const isPlaying = !reducedMotion && !userPaused && isVisible && documentVisible

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: '120px 0px',
      threshold: 0.08
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => setDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    if (!isPlaying) {
      video.pause()
      return undefined
    }
    void video.play().catch(() => undefined)
    return undefined
  }, [isPlaying])

  const activeSlide = modeSlides[activeIndex]

  const updateActiveMode = (event) => {
    const currentTime = event.currentTarget.currentTime % replayDuration
    const nextIndex = modeSlides.reduce(
      (selected, slide, index) => (currentTime >= slide.start ? index : selected),
      0
    )
    setActiveIndex(nextIndex)
  }

  const selectMode = (index) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = modeSlides[index].start
      video.pause()
    }
    setActiveIndex(index)
    setUserPaused(true)
    trackEvent('select_hero_mode', { mode: modeSlides[index].id })
  }

  return (
    <section
      aria-label="Apex Trader workstation replay"
      aria-roledescription="carousel"
      className="landing-analysis-card landing-mode-carousel"
      data-active-mode={activeSlide.id}
      data-rotation-state={reducedMotion ? 'static' : isPlaying ? 'playing' : 'paused'}
      ref={rootRef}
    >
      <div className="landing-mode-carousel__stage">
        <video
          aria-label="Apex Trader workstation replay cycling through Candles, Footprint and Step Profile charts."
          autoPlay={!reducedMotion}
          className="landing-mode-carousel__video"
          loop
          muted
          onTimeUpdate={updateActiveMode}
          playsInline
          poster="/media/hero-terminal-candles.png"
          preload="metadata"
          ref={videoRef}
        >
          <source src="/media/hero-replay.mp4" type="video/mp4" />
          <source src="/media/hero-replay.webm" type="video/webm" />
        </video>
      </div>

      <div className="landing-mode-carousel__controls">
        <div aria-label="Choose chart mode" className="landing-mode-carousel__modes" role="group">
          {modeSlides.map((slide, index) => (
            <button
              aria-pressed={index === activeIndex}
              className={index === activeIndex ? 'is-active' : undefined}
              key={slide.id}
              onClick={() => selectMode(index)}
              type="button"
            >
              <span aria-hidden="true" />
              {slide.label}
            </button>
          ))}
        </div>
        {!reducedMotion && (
          <button
            className="landing-mode-carousel__playback"
            onClick={() => setUserPaused((paused) => !paused)}
            type="button"
          >
            {userPaused ? 'Resume rotation' : 'Pause rotation'}
          </button>
        )}
      </div>
    </section>
  )
}
