import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { CompactDom } from '../professional/Dom.jsx'
import { formatNumber as fmt } from '../professional/formatters.js'
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
  const centers = [196, 238, 280, 322, 364]
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

function FootprintScene({ bars }) {
  const domain = { high: 21842.5, low: 21839.75, range: 2.75 }
  const scale = priceScale(domain.low, domain.high, 26, 236)
  const [completed, current] = bars
  return (
    <svg aria-label="Completed and updating Footprint candles" role="img" viewBox="0 0 560 260">
      <title>One completed footprint candle followed by one updating candle</title>
      <g className="landing-completed-order-flow" transform="translate(0 6)">
        <FootprintLayer
          bars={[completed]}
          centers={[200]}
          deltaFontSize={13}
          domain={domain}
          fontSize={12}
          plotBounds={{ bottom: 236, top: 26 }}
          priceScale={scale}
          settings={footprintSettings}
          step={150}
          tickSize={marketPrimitiveTickSize}
          zoomScale={2}
        />
      </g>
      <g className="landing-current-order-flow" transform="translate(0 -6)">
        <FootprintLayer
          bars={[current]}
          centers={[360]}
          deltaFontSize={13}
          domain={domain}
          fontSize={12}
          plotBounds={{ bottom: 236, top: 26 }}
          priceScale={scale}
          settings={footprintSettings}
          step={150}
          tickSize={marketPrimitiveTickSize}
          zoomScale={2}
        />
      </g>
    </svg>
  )
}

function StepProfileScene({ bars }) {
  const domain = { high: 21842.5, low: 21839.75, range: 2.75 }
  const scale = priceScale(domain.low, domain.high, 26, 236)
  const [completed, current] = bars
  return (
    <svg aria-label="Completed and updating Step Profile candles" role="img" viewBox="0 0 560 260">
      <title>One completed Step Profile candle followed by one updating candle</title>
      <g className="landing-completed-order-flow" transform="translate(0 6)">
        <StepProfileLayer
          bars={[completed]}
          centers={[180]}
          deltaFontSize={13}
          domain={domain}
          plotBounds={{ bottom: 236, top: 26 }}
          priceScale={scale}
          settings={footprintSettings}
          step={190}
          tickSize={marketPrimitiveTickSize}
          zoomScale={2}
        />
      </g>
      <g className="landing-current-order-flow" transform="translate(0 -6)">
        <StepProfileLayer
          bars={[current]}
          centers={[380]}
          deltaFontSize={13}
          domain={domain}
          plotBounds={{ bottom: 236, top: 26 }}
          priceScale={scale}
          settings={footprintSettings}
          step={190}
          tickSize={marketPrimitiveTickSize}
          zoomScale={2}
        />
      </g>
    </svg>
  )
}

function VolumeProfileScene({ profile }) {
  const maximumVolume = Math.max(...profile.map((level) => level.ask + level.bid), 1)
  const priceAxisX = 456
  const plotRight = 448
  return (
    <svg
      aria-label="Updating visible-range Volume Profile with price scale"
      role="img"
      viewBox="0 0 560 260"
    >
      <title>Volume Profile with point of control, value area and aligned price scale</title>
      <rect
        className="price-axis-bg landing-profile-price-axis-bg"
        height="260"
        width="80"
        x={priceAxisX}
        y="0"
      />
      <g className="session-profile-bars" transform="translate(64 0)">
        {profile.map((level, index) => {
          const geometry = deriveSessionProfileBarGeometry(level, maximumVolume, 384)
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
          <line className={className} x1="24" x2={plotRight} y1={y} y2={y} />
          <text x="24" y={y - 8}>
            {label}
          </text>
        </g>
      ))}
      <g aria-label="Price scale" className="landing-profile-price-axis">
        {profile.map((level, index) => {
          const y = 29.5 + index * 24
          return (
            <g key={level.price}>
              <line
                className="price-tick-mark"
                x1={plotRight}
                x2={priceAxisX}
                y1={y}
                y2={y}
              />
              <text
                className="price-tick landing-profile-price-tick"
                data-price={level.price}
                x={priceAxisX + 8}
                y={y + 4}
              >
                {fmt(level.price)}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function PrimitiveRow({ body, children, eyebrow, heading, id }) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="landing-primitive"
      data-primitive={id}
    >
      <div className="landing-primitive__visual">
        <span aria-hidden="true" className="landing-primitive-grid-backdrop" data-backdrop="grid" />
        {children}
      </div>
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
  bars: PropTypes.arrayOf(barType).isRequired
}

StepProfileScene.propTypes = {
  bars: PropTypes.arrayOf(barType).isRequired
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
        body="Candles make direction, range and pace immediately visible. Use them to spot expansion, rejection and shifts in momentum before opening the order-flow detail."
        eyebrow="SEE DIRECTION AND MOMENTUM"
        heading="Start with the shape of the move"
        id="candles"
      >
        <CandlesScene bars={snapshot.candles} />
      </PrimitiveRow>
      <PrimitiveRow
        body="Footprint separates executed buying and selling at every price. Imbalances and delta reveal where one side became aggressive — and whether price responded."
        eyebrow="SEE WHO TRADED AT EACH PRICE"
        heading="Find the pressure inside the candle"
        id="footprint"
      >
        <FootprintScene bars={snapshot.footprintBars} />
      </PrimitiveRow>
      <PrimitiveRow
        body="Step Profile turns each interval into a volume distribution. Compare where activity clustered, where it thinned out and how that structure changed from one candle to the next."
        eyebrow="SEE WHERE VOLUME CONCENTRATED"
        heading="Read the distribution inside each candle"
        id="step-profile"
      >
        <StepProfileScene bars={snapshot.stepProfileBars} />
      </PrimitiveRow>
      <PrimitiveRow
        body="Volume Profile shows where the market did the most business. POC, VAH and VAL frame the accepted area so you can distinguish balance from an attempted breakout."
        eyebrow="FIND THE PRICES THE MARKET ACCEPTED"
        heading="Map value across the visible session"
        id="volume-profile"
      >
        <VolumeProfileScene profile={snapshot.profile} />
      </PrimitiveRow>
      <PrimitiveRow
        body="The DOM shows resting liquidity above and below the last trade. Use it to see where the next move may meet friction and how quickly depth changes as price approaches."
        eyebrow="WATCH LIQUIDITY FORM AROUND PRICE"
        heading="See where buyers and sellers are waiting"
        id="dom"
      >
        <CompactDom
          currentPrice={snapshot.currentPrice}
          orderbook={snapshot.orderbook}
          sourceTickSize={marketPrimitiveTickSize}
        />
      </PrimitiveRow>
      <PrimitiveRow
        body="Time & Sales reveals the sequence, size and aggressor side of recent trades. Use the pace of prints to judge whether buying or selling pressure is building."
        eyebrow="FOLLOW THE PACE OF EXECUTION"
        heading="See who is crossing the spread"
        id="last-trades"
      >
        <CompactTimeSales trades={snapshot.trades} />
      </PrimitiveRow>
    </div>
  )
}
