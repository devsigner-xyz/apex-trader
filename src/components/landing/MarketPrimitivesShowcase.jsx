import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { CompactDom } from '../professional/Dom.jsx'
import CandlesLayer from '../professional/chart/CandlesLayer.jsx'
import FootprintLayer from '../professional/chart/FootprintLayer.jsx'
import StepProfileLayer from '../professional/chart/StepProfileLayer.jsx'
import { CompactTimeSales } from '../professional/execution/TimeSales.jsx'
import { deriveSessionProfileBarGeometry } from '../../services/professionalChartGeometry.js'
import {
  createMarketPrimitiveSnapshot,
  marketPrimitivePhaseCount,
  marketPrimitiveTickSize
} from './marketPrimitiveFixtures.js'

const footprintSettings = {
  imbalanceRatio: 3,
  minimumVolume: 0,
  stackedImbalanceSize: 3,
  tickSize: marketPrimitiveTickSize
}

const levelType = PropTypes.shape({
  ask: PropTypes.number.isRequired,
  bid: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired
})

const barType = PropTypes.shape({
  close: PropTypes.number.isRequired,
  high: PropTypes.number.isRequired,
  levels: PropTypes.arrayOf(levelType),
  low: PropTypes.number.isRequired,
  open: PropTypes.number.isRequired,
  timestamp: PropTypes.number.isRequired
})

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false)

  useEffect(() => {
    const media = window.matchMedia?.(query)
    if (!media) return undefined
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

function usePrimitiveClock(rootRef) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [phase, setPhase] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return undefined
    }
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: '180px 0px',
      threshold: 0.05
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [rootRef])

  useEffect(() => {
    const onVisibilityChange = () => setDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (reducedMotion || !isVisible || !documentVisible) return undefined
    const timer = window.setInterval(
      () => setPhase((current) => (current + 1) % marketPrimitivePhaseCount),
      1_400
    )
    return () => window.clearInterval(timer)
  }, [documentVisible, isVisible, reducedMotion])

  return { phase, reducedMotion, running: isVisible && documentVisible && !reducedMotion }
}

function priceScale(low, high, top = 24, bottom = 236) {
  const range = high - low
  return {
    toY: (price) => top + ((high - price) / range) * (bottom - top)
  }
}

function CandlesScene({ bars }) {
  const scale = priceScale(21830, 21857, 28, 232)
  const centers = [58, 168, 278, 388, 498]
  const completed = bars.slice(0, -1)
  const current = bars.at(-1)

  return (
    <svg aria-label="Five candle price sequence" role="img" viewBox="0 0 560 260">
      <title>Four completed candles and one updating candle</title>
      {[56, 130, 204].map((y) => (
        <line className="landing-primitive-grid" key={y} x1="24" x2="536" y1={y} y2={y} />
      ))}
      <CandlesLayer bars={completed} centers={centers.slice(0, 4)} priceScale={scale} width={30} />
      <g className="landing-current-candle" data-close={current.close}>
        <CandlesLayer bars={[current]} centers={[centers.at(-1)]} priceScale={scale} width={30} />
      </g>
    </svg>
  )
}

function FootprintScene({ bar }) {
  const domain = { high: 21842.5, low: 21839.75, range: 2.75 }
  const scale = priceScale(domain.low, domain.high, 26, 236)
  return (
    <svg aria-label="Single updating Footprint candle" role="img" viewBox="0 0 560 260">
      <title>One footprint candle with bid and ask volume at price</title>
      <FootprintLayer
        bars={[bar]}
        centers={[280]}
        deltaFontSize={13}
        domain={domain}
        fontSize={12}
        plotBounds={{ bottom: 236, top: 26 }}
        priceScale={scale}
        settings={footprintSettings}
        step={196}
        tickSize={marketPrimitiveTickSize}
        zoomScale={2}
      />
    </svg>
  )
}

function StepProfileScene({ bar }) {
  const domain = { high: 21842.5, low: 21839.75, range: 2.75 }
  const scale = priceScale(domain.low, domain.high, 26, 236)
  return (
    <svg aria-label="Single updating Step Profile candle" role="img" viewBox="0 0 560 260">
      <title>One Step Profile candle with an updating distribution</title>
      <StepProfileLayer
        bars={[bar]}
        centers={[280]}
        deltaFontSize={13}
        domain={domain}
        plotBounds={{ bottom: 236, top: 26 }}
        priceScale={scale}
        settings={footprintSettings}
        step={310}
        tickSize={marketPrimitiveTickSize}
        zoomScale={2}
      />
    </svg>
  )
}

function VolumeProfileScene({ profile }) {
  const maximumVolume = Math.max(...profile.map((level) => level.ask + level.bid), 1)
  return (
    <svg aria-label="Updating visible-range Volume Profile" role="img" viewBox="0 0 560 260">
      <title>Volume Profile with point of control and value area</title>
      <g className="session-profile-bars" transform="translate(72 0)">
        {profile.map((level, index) => {
          const geometry = deriveSessionProfileBarGeometry(level, maximumVolume, 416)
          return (
            <g data-price={level.price} key={level.price}>
              <rect
                className="session-profile-bar session-profile-bar--bid"
                height="15"
                width={geometry.bid.width}
                x={geometry.bid.x}
                y={22 + index * 24}
              />
              <rect
                className="session-profile-bar session-profile-bar--ask"
                height="15"
                width={geometry.ask.width}
                x={geometry.ask.x}
                y={22 + index * 24}
              />
            </g>
          )
        })}
      </g>
      {[
        ['VAH', 58, 'value-line'],
        ['POC', 130, 'poc-line'],
        ['VAL', 202, 'value-line']
      ].map(([label, y, className]) => (
        <g className="landing-profile-marker" key={label}>
          <line className={className} x1="24" x2="536" y1={y} y2={y} />
          <text x="24" y={y - 8}>
            {label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function PrimitiveRow({ body, children, eyebrow, heading, id }) {
  return (
    <section aria-labelledby={`${id}-title`} className="landing-primitive" data-primitive={id}>
      <div className="landing-primitive__visual">{children}</div>
      <div className="landing-primitive__copy">
        <p>{eyebrow}</p>
        <h3 id={`${id}-title`}>{heading}</h3>
        <p>{body}</p>
      </div>
    </section>
  )
}

CandlesScene.propTypes = {
  bars: PropTypes.arrayOf(barType).isRequired
}

FootprintScene.propTypes = {
  bar: barType.isRequired
}

StepProfileScene.propTypes = {
  bar: barType.isRequired
}

VolumeProfileScene.propTypes = {
  profile: PropTypes.arrayOf(levelType).isRequired
}

PrimitiveRow.propTypes = {
  body: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  eyebrow: PropTypes.string.isRequired,
  heading: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired
}

export default function MarketPrimitivesShowcase() {
  const rootRef = useRef(null)
  const { phase, reducedMotion, running } = usePrimitiveClock(rootRef)
  const snapshot = useMemo(() => createMarketPrimitiveSnapshot(phase), [phase])

  return (
    <div
      className="landing-primitives"
      data-animation-state={reducedMotion ? 'static' : running ? 'running' : 'paused'}
      data-phase={phase}
      ref={rootRef}
    >
      <PrimitiveRow
        body="Four completed candles establish direction. Only the latest candle updates its high, low and close, making the current interval legible without surrounding terminal controls."
        eyebrow="CANDLES · 5 BARS · LATEST BAR UPDATES"
        heading="Price over time"
        id="candles"
      >
        <CandlesScene bars={snapshot.candles} />
      </PrimitiveRow>
      <PrimitiveRow
        body="One Footprint candle exposes bid volume on the left and ask volume on the right. Updating figures reveal where aggressive buying and selling meet inside the interval."
        eyebrow="FOOTPRINT · 1 BAR · VALUES UPDATE"
        heading="Executed volume at price"
        id="footprint"
      >
        <FootprintScene bar={snapshot.footprintBar} />
      </PrimitiveRow>
      <PrimitiveRow
        body="A single Step Profile candle turns traded volume into a stepped silhouette. As values refresh, the shape makes concentration, imbalance and rejection immediately visible."
        eyebrow="STEP PROFILE · 1 BAR · DISTRIBUTION UPDATES"
        heading="Distribution inside one interval"
        id="step-profile"
      >
        <StepProfileScene bar={snapshot.stepProfileBar} />
      </PrimitiveRow>
      <PrimitiveRow
        body="Horizontal bars show participation at each price. The profile updates as the visible session evolves, while POC, VAH and VAL keep the dominant area easy to read."
        eyebrow="VOLUME PROFILE · POC / VAH / VAL · BARS UPDATE"
        heading="Where the session traded"
        id="volume-profile"
      >
        <VolumeProfileScene profile={snapshot.profile} />
      </PrimitiveRow>
      <PrimitiveRow
        body="Three ask levels, the last traded price and three bid levels are enough to explain the ladder. Quantities and depth bars update without exposing the rest of the workstation."
        eyebrow="DOM · 3 ASKS + LAST + 3 BIDS · DEPTH UPDATES"
        heading="Liquidity around the last price"
        id="dom"
      >
        <CompactDom currentPrice={snapshot.currentPrice} orderbook={snapshot.orderbook} />
      </PrimitiveRow>
      <PrimitiveRow
        body="Three recent prints communicate pace and aggressor side without a full table. New trades enter at the top while price, size and time remain tied to the same market clock."
        eyebrow="LAST TRADES · 3 EXECUTIONS · STREAM UPDATES"
        heading="The latest executions"
        id="last-trades"
      >
        <CompactTimeSales trades={snapshot.trades} />
      </PrimitiveRow>
    </div>
  )
}
