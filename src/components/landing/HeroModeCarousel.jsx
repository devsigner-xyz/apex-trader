import { useEffect, useRef, useState } from 'react'

const modeSlides = [
  {
    alt: 'Complete Apex Trader workstation with the Candles chart active.',
    id: 'candles',
    label: 'Candles',
    src: '/media/hero-terminal-candles.png'
  },
  {
    alt: 'Complete Apex Trader workstation with the Footprint chart active.',
    id: 'footprint',
    label: 'Footprint',
    src: '/media/hero-terminal-footprint.png'
  },
  {
    alt: 'Complete Apex Trader workstation with the Step Profile chart active.',
    id: 'step-profile',
    label: 'Step Profile',
    src: '/media/hero-terminal-step-profile.png'
  }
]

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
    if (!isPlaying) return undefined
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % modeSlides.length),
      4_200
    )
    return () => window.clearInterval(timer)
  }, [isPlaying])

  const activeSlide = modeSlides[activeIndex]

  const selectMode = (index) => {
    setActiveIndex(index)
    setUserPaused(true)
  }

  return (
    <section
      aria-label="Apex Trader chart modes"
      aria-roledescription="carousel"
      className="landing-analysis-card landing-mode-carousel"
      data-active-mode={activeSlide.id}
      data-rotation-state={reducedMotion ? 'static' : isPlaying ? 'playing' : 'paused'}
      ref={rootRef}
    >
      <div className="landing-mode-carousel__toolbar">
        <span>APEX / CHART MODES</span>
        <span>
          {String(activeIndex + 1).padStart(2, '0')} / {String(modeSlides.length).padStart(2, '0')}
        </span>
      </div>

      <div className="landing-mode-carousel__stage">
        {modeSlides.map((slide, index) => (
          <figure
            aria-hidden={index !== activeIndex}
            className={`landing-mode-slide${index === activeIndex ? ' is-active' : ''}`}
            key={slide.id}
          >
            <img
              alt={slide.alt}
              decoding="async"
              height="900"
              loading="eager"
              src={slide.src}
              width="1600"
            />
          </figure>
        ))}
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
