/* eslint-disable react/prop-types */
import { deriveSessionProfileBarGeometry } from '../../../services/professionalChartGeometry.js'
import { chartDimensions } from '../config.js'

const { plotRight, profileChartWidth } = chartDimensions

export default function SessionProfileOverlay({ maximumVolume, priceScale, profile }) {
  const y = priceScale.toY
  const originX = plotRight - profileChartWidth

  return (
    <g
      aria-label="Visible range volume profile overlay"
      className="session-profile-overlay"
      role="img"
      transform={`translate(${originX} 0)`}
    >
      <title>Visible range volume profile overlaid on the price chart</title>
      <g className="session-profile-bars">
        {profile.map((level, index) => {
          const geometry = deriveSessionProfileBarGeometry(level, maximumVolume, profileChartWidth)
          return (
            <g key={index}>
              <rect
                className="session-profile-bar session-profile-bar--bid"
                height="8"
                width={geometry.bid.width}
                x={geometry.bid.x}
                y={y(level.price) - 4}
              />
              <rect
                className="session-profile-bar session-profile-bar--ask"
                height="8"
                width={geometry.ask.width}
                x={geometry.ask.x}
                y={y(level.price) - 4}
              />
            </g>
          )
        })}
      </g>
    </g>
  )
}
