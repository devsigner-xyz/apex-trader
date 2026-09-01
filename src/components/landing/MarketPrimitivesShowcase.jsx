import { useEffect, useMemo, useRef, useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import PropTypes from 'prop-types'
import { CompactDom } from '../professional/Dom.jsx'
import CandlesLayer from '../professional/chart/CandlesLayer.jsx'
import FootprintLayer from '../professional/chart/FootprintLayer.jsx'
import StepProfileLayer from '../professional/chart/StepProfileLayer.jsx'
import { CompactTimeSales } from '../professional/execution/TimeSales.jsx'
import { LiquidityIntensityControl } from '../professional/chart/ChartSettingsPopover.jsx'
import { deriveSessionProfileBarGeometry } from '../../services/professionalChartGeometry.js'
import { useSettingsPopoverFocus } from '../../hooks/useSettingsPopoverFocus.js'
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
  const plotRight = 536
  return (
    <svg
      aria-label="Updating visible-range Volume Profile"
      role="img"
      viewBox="0 0 560 260"
    >
      <title>Volume Profile with point of control and value area</title>
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
    </svg>
  )
}

function heatmapStrength(value) {
  if (value >= 0.72) return 'strong'
  if (value >= 0.5) return 'medium'
  if (value >= 0.28) return 'soft'
  return 'base'
}

function LiquidityHeatmapScene({ heatmap }) {
  const sceneRef = useRef(null)
  const settingsPopoverRef = useRef(null)
  const settingsTriggerRef = useRef(null)
  const [intensity, setIntensity] = useState(0.75)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const plotLeft = 18
  const plotRight = 542
  const cellWidth = (plotRight - plotLeft) / heatmap[0].length
  const cellHeight = (202 - 20) / heatmap.length
  const { handleTriggerClick } = useSettingsPopoverFocus({
    containerRef: sceneRef,
    isOpen: settingsOpen,
    popoverRef: settingsPopoverRef,
    setIsOpen: setSettingsOpen,
    triggerRef: settingsTriggerRef
  })

  return (
    <div
      className="landing-heatmap-scene"
      data-intensity={Math.round(intensity * 100)}
      ref={sceneRef}
    >
      <header className="landing-heatmap-header">
        <span>BTC · LIQUIDITY</span>
        <button
          aria-controls="landing-heatmap-settings"
          aria-expanded={settingsOpen}
          aria-label="Liquidity heatmap settings"
          className="chart-settings-button landing-heatmap-settings-button"
          onClick={handleTriggerClick}
          ref={settingsTriggerRef}
          title="Liquidity heatmap settings"
          type="button"
        >
          <SettingsIcon aria-hidden="true" size={16} strokeWidth={2} />
        </button>
      </header>
      <div className="landing-heatmap-plot">
        <svg aria-label="Liquidity heatmap by price and time" role="img" viewBox="0 0 560 228">
          <title>Resting liquidity by price and time</title>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((row) =>
            heatmap[row].map((value, column) => (
              <line
                className={`landing-heatmap-liquidity-line landing-heatmap-liquidity-line--${heatmapStrength(value)}`}
                data-column={column}
                data-row={row}
                key={`${row}-${column}`}
                opacity={0.18 + value * 0.72 * intensity}
                x1={plotLeft + column * cellWidth}
                x2={plotLeft + (column + 1) * cellWidth}
                y1={20 + row * cellHeight + cellHeight / 2}
                y2={20 + row * cellHeight + cellHeight / 2}
              />
            ))
          )}
        </svg>
      </div>
      {settingsOpen && (
        <aside
          aria-label="Liquidity heatmap settings"
          className="dom-settings-popover landing-heatmap-settings-popover"
          id="landing-heatmap-settings"
          ref={settingsPopoverRef}
          role="dialog"
        >
          <strong>HEATMAP SETTINGS</strong>
          <LiquidityIntensityControl enabled intensity={intensity} onChange={setIntensity} />
        </aside>
      )}
    </div>
  )
}

function PrimitiveRow({ body, children, eyebrow, heading, id }) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="landing-primitive"
      data-primitive={id}
    >
      <span aria-hidden="true" className="landing-primitive-grid-backdrop" data-backdrop="grid" />
      <div className="landing-primitive__visual">
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

LiquidityHeatmapScene.propTypes = {
  heatmap: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number.isRequired)).isRequired
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
        body="Footprint separates executed buying and selling at every price. Imbalances and delta reveal where one side became aggressive - and whether price responded."
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
        body="The liquidity heatmap shows resting orders before price reaches them. Adjust intensity to separate a quiet background from the levels most likely to create friction or support."
        eyebrow="SEE LIQUIDITY BEFORE PRICE ARRIVES"
        heading="Spot resting orders before they matter"
        id="liquidity-heatmap"
      >
        <LiquidityHeatmapScene heatmap={snapshot.heatmap} />
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
