/* eslint-disable react/prop-types */
import { deriveSessionProfileBarGeometry } from '../../../services/professionalChartGeometry.js'
import { chartDimensions } from '../config.js'
import { formatNumber as fmt } from '../formatters.js'

const { plotRight, profileChartWidth } = chartDimensions

export default function SessionProfileOverlay({ markers, maximumVolume, priceScale, profile }) {
  const y = priceScale.toY
  const originX = plotRight - profileChartWidth

  return (
    <g
      aria-label="Session volume profile overlay"
      className="session-profile-overlay"
      role="img"
      transform={`translate(${originX} 0)`}
    >
      <title>Session volume profile overlaid on the price chart</title>
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
      {markers.map(({ label, price, tone }) => (
        <g
          className={`session-profile-marker session-profile-marker--${tone}`}
          key={label}
          transform={`translate(0 ${y(price)})`}
        >
          <title>{`${label} ${fmt(price)}`}</title>
          <line x1="0" x2={profileChartWidth} y1="0" y2="0" />
          <rect height="16" rx="2" width="38" x="4" y="-8" />
          <text textAnchor="middle" x="23" y="3">
            {label}
          </text>
        </g>
      ))}
    </g>
  )
}
