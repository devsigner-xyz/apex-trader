/* eslint-disable react/prop-types */
import { deriveFootprintBar, formatFootprintVolume } from '../../../services/footprintPresentation.js'
import { deriveStepProfileCellGeometry } from '../../../services/professionalChartGeometry.js'
import { formatNumber as fmt } from '../formatters.js'

export default function StepProfileLayer({
  bars,
  centers,
  deltaFontSize,
  domain,
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
    const stepProfileBar = deriveFootprintBar(
      {
        ...bar,
        levels: bar.levels.filter(
          (level) => level.price >= low - tickSize && level.price <= high
        )
      },
      settings
    )
    const levels = stepProfileBar.levels.filter(
      (level) => level.price + tickSize / 2 >= low && level.price + tickSize / 2 <= high
    )
    const maximumSide = Math.max(...levels.flatMap((level) => [level.ask, level.bid]), 1)
    const { cellWidth, maximumSideWidth, rowHeight, sideHeight, valueFontSize } =
      deriveStepProfileCellGeometry({
        plotHeight: bottom - top,
        range,
        step,
        tickSize,
        zoomScale
      })

    return (
      <g className="step-profile-bar" key={bar.timestamp}>
        <line
          className="profile-spine"
          x1={center}
          x2={center}
          y1={y(bar.high)}
          y2={y(bar.low)}
        />
        {levels.map((level) => {
          const price = level.price + tickSize / 2
          const bidWidth = (level.bid / maximumSide) * maximumSideWidth
          const askWidth = (level.ask / maximumSide) * maximumSideWidth
          const cellX = center - cellWidth / 2
          const bidLabel = formatFootprintVolume(level.bid, 'compact')
          const askLabel = formatFootprintVolume(level.ask, 'compact')
          return (
            <g
              className={`step-profile-level${level.isPoc ? ' is-poc' : ''}`}
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
                className="step-profile-bid"
                height={sideHeight}
                width={bidWidth}
                x={cellX - bidWidth}
                y={y(price) - sideHeight / 2}
              />
              <rect
                className="step-profile-ask"
                height={sideHeight}
                width={askWidth}
                x={cellX + cellWidth}
                y={y(price) - sideHeight / 2}
              />
              <rect
                className={`step-profile-cell-bg${level.isPoc ? ' is-poc' : ''}`}
                height={rowHeight}
                width={cellWidth}
                x={cellX}
                y={y(price) - rowHeight / 2}
              />
              <text
                className="step-profile-value"
                dominantBaseline="middle"
                dy="0.075em"
                style={{ fontSize: valueFontSize }}
                textAnchor="middle"
                x={center}
                y={y(price)}
              >
                {bidLabel}×{askLabel}
              </text>
              {level.isPoc && (
                <rect
                  className="step-profile-poc-outline"
                  height={rowHeight}
                  width={cellWidth}
                  x={cellX}
                  y={y(price) - rowHeight / 2}
                />
              )}
            </g>
          )
        })}
        <text
          className={`bar-delta step-delta ${
            bar.delta >= 0 ? 'positive-fill' : 'negative-fill'
          }`}
          style={{ fontSize: deltaFontSize }}
          textAnchor="middle"
          x={center}
          y={Math.max(top + deltaFontSize, y(bar.high) - 26)}
        >
          Δ {fmt(bar.delta, 2)}
        </text>
      </g>
    )
  })
}
