import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import FootprintInspector from './FootprintInspector.jsx'
import { demoOrderFlowScenarios, generateDemoOrderFlow } from '../services/demoOrderFlow.js'

const VIEWBOX_WIDTH = 1080
const VIEWBOX_HEIGHT = 520
const PADDING = { top: 42, right: 18, bottom: 50, left: 18 }

function intensity(level, maximum) {
  return 0.12 + (level.total / Math.max(maximum, 1)) * 0.62
}

export default function FootprintChart({ baseCurrency }) {
  const [scenario, setScenario] = useState('balance')
  const [seed, setSeed] = useState(20260727)
  const [selectedId, setSelectedId] = useState(null)
  const data = useMemo(() => generateDemoOrderFlow({ scenario, seed }), [scenario, seed])
  const selectedBar =
    data.bars.find((bar) => bar.id === selectedId) ?? data.bars[data.bars.length - 1]
  const maximumLevel = Math.max(
    ...data.bars.flatMap((bar) => bar.levels.map((level) => level.total))
  )
  const chartWidth = VIEWBOX_WIDTH - PADDING.left - PADDING.right
  const chartHeight = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom
  const barWidth = chartWidth / data.bars.length
  const maxPrice = Math.max(...data.bars.map((bar) => bar.high))
  const minPrice = Math.min(...data.bars.map((bar) => bar.low))
  const yForPrice = (price) =>
    PADDING.top + ((maxPrice - price) / (maxPrice - minPrice + data.tickSize)) * chartHeight

  return (
    <section
      aria-label="Footprint chart simulation"
      className="footprint-chart chart-slot"
      data-testid="footprint-chart"
    >
      <div className="footprint-toolbar">
        <label htmlFor="footprint-scenario">Escenario</label>
        <select
          id="footprint-scenario"
          onChange={(event) => {
            setScenario(event.target.value)
            setSelectedId(null)
          }}
          value={scenario}
        >
          {demoOrderFlowScenarios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button className="ui-button" onClick={() => setSeed((value) => value + 1)} type="button">
          Cambiar semilla
        </button>
      </div>
      <p className="footprint-disclaimer">
        DEMO — datos sintéticos generados localmente. No son cotizaciones, no son ejecutables y no
        representan actividad de mercado.
      </p>
      <p className="footprint-legend">Bid × Ask · Δ = Ask − Bid · SIMULADO</p>
      <svg
        aria-label="Footprint order flow simulation"
        className="footprint-chart__svg"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        {data.bars.map((bar, barIndex) => {
          const x = PADDING.left + barIndex * barWidth
          const rowHeight = chartHeight / data.bars[0].levels.length
          return (
            <g
              aria-label={`Footprint bar ${barIndex + 1}`}
              className={selectedBar.id === bar.id ? 'is-selected' : ''}
              key={bar.id}
              onClick={() => setSelectedId(bar.id)}
              role="button"
              tabIndex="0"
            >
              <rect
                className="footprint-bar-outline"
                height={Math.max(3, yForPrice(bar.low) - yForPrice(bar.high))}
                width={barWidth - 4}
                x={x + 2}
                y={yForPrice(bar.high)}
              />
              {bar.levels.map((level, levelIndex) => {
                const y = PADDING.top + levelIndex * rowHeight
                const fill =
                  level.delta >= 0 ? 'var(--color-footprint-buy)' : 'var(--color-footprint-sell)'
                return (
                  <g key={level.price}>
                    <rect
                      fill={fill}
                      fillOpacity={intensity(level, maximumLevel)}
                      height={rowHeight - 1}
                      width={barWidth - 5}
                      x={x + 2.5}
                      y={y}
                    />
                    {level.isPoc && (
                      <rect
                        className="footprint-poc"
                        height={rowHeight - 2}
                        width="2"
                        x={x + 2.5}
                        y={y + 1}
                      />
                    )}
                    {(level.askImbalance || level.bidImbalance) && (
                      <circle
                        className="footprint-imbalance"
                        cx={x + barWidth - 7}
                        cy={y + rowHeight / 2}
                        r="2"
                      />
                    )}
                    <text
                      className="footprint-cell-text"
                      textAnchor="middle"
                      x={x + barWidth / 2}
                      y={y + rowHeight * 0.66}
                    >
                      {level.bid} × {level.ask}
                    </text>
                  </g>
                )
              })}
              <text
                className="footprint-bar-total"
                textAnchor="middle"
                x={x + barWidth / 2}
                y={VIEWBOX_HEIGHT - 25}
              >
                Δ {bar.delta >= 0 ? '+' : ''}
                {bar.delta}
              </text>
            </g>
          )
        })}
      </svg>
      <FootprintInspector bar={selectedBar} />
      <span className="footprint-currency">{baseCurrency}</span>
    </section>
  )
}

FootprintChart.propTypes = { baseCurrency: PropTypes.string.isRequired }
