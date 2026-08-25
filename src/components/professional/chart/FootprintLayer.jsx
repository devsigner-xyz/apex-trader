/* eslint-disable react/prop-types */
import { deriveFootprintBar, formatFootprintVolume } from '../../../services/footprintPresentation.js'
import { deriveFootprintCellGeometry } from '../../../services/professionalChartGeometry.js'
import { formatNumber as fmt } from '../formatters.js'

export default function FootprintLayer({
  bars,
  centers,
  deltaFontSize,
  domain,
  fontSize,
  plotBounds,
  priceScale,
  settings,
  step,
  tickSize,
  zoomScale
}) {
  const { high, low, range } = domain
  const { bottom, top } = plotBounds
  const y = priceScale.toY

  return bars.map((bar, index) => {
    const center = centers[index]
    const footprintBar = deriveFootprintBar(
      {
        ...bar,
        levels: bar.levels.filter(
          (level) => level.price >= low - tickSize && level.price <= high
        )
      },
      settings
    )
    const levels = footprintBar.levels.filter(
      (level) => level.price + tickSize / 2 >= low && level.price + tickSize / 2 <= high
    )
    const maximum = Math.max(...levels.flatMap((level) => [level.ask, level.bid]), 1)
    const { barWidth, halfWidth, rowHeight } = deriveFootprintCellGeometry({
      plotHeight: bottom - top,
      range,
      step,
      tickSize,
      zoomScale
    })

    return (
      <g className="footprint-bar" key={bar.timestamp}>
        {levels.map((level) => {
          const price = level.price + tickSize / 2
          const bidLabel = formatFootprintVolume(level.bid, 'compact')
          const askLabel = formatFootprintVolume(level.ask, 'compact')
          return (
            <g
              className={`footprint-cell${level.isPoc ? ' is-poc' : ''}`}
              data-ask={level.ask}
              data-bid={level.bid}
              data-price={level.price}
              key={level.price}
            >
              <title>
                {fmt(level.price)}–{fmt(level.price + tickSize)} · Bid {fmt(level.bid, 3)} × Ask{' '}
                {fmt(level.ask, 3)}
              </title>
              <rect
                className="footprint-bid-bg"
                fillOpacity={0.2 + Math.min(1, level.bid / maximum) * 0.72}
                height={rowHeight}
                width={halfWidth}
                x={center - halfWidth}
                y={y(price) - rowHeight / 2}
              />
              <rect
                className="footprint-ask-bg"
                fillOpacity={0.2 + Math.min(1, level.ask / maximum) * 0.72}
                height={rowHeight}
                width={halfWidth}
                x={center}
                y={y(price) - rowHeight / 2}
              />
              <line
                className="footprint-divider"
                x1={center}
                x2={center}
                y1={y(price) - rowHeight / 2}
                y2={y(price) + rowHeight / 2}
              />
              <text
                className={`footprint-cell-value bid${level.bidImbalance ? ' is-imbalance' : ''}`}
                dy="0.075em"
                dominantBaseline="middle"
                style={{ fontSize }}
                textAnchor="end"
                x={center - 3}
                y={y(price)}
              >
                {bidLabel}
              </text>
              <text
                className={`footprint-cell-value ask${level.askImbalance ? ' is-imbalance' : ''}`}
                dy="0.075em"
                dominantBaseline="middle"
                style={{ fontSize }}
                textAnchor="start"
                x={center + 3}
                y={y(price)}
              >
                {askLabel}
              </text>
              {level.isPoc && (
                <rect
                  className="footprint-poc-outline"
                  height={rowHeight}
                  width={barWidth}
                  x={center - halfWidth}
                  y={y(price) - rowHeight / 2}
                />
              )}
            </g>
          )
        })}
        <text
          className={`bar-delta ${bar.delta >= 0 ? 'positive-fill' : 'negative-fill'}`}
          style={{ fontSize: deltaFontSize }}
          textAnchor="middle"
          x={center}
          y={Math.max(top + deltaFontSize, y(bar.high) - 26)}
        >
          Δ {fmt(bar.delta, 3)}
        </text>
      </g>
    )
  })
}
