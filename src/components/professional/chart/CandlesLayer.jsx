/* eslint-disable react/prop-types */
import { deriveCandleGeometry } from '../../../services/professionalChartGeometry.js'

export default function CandlesLayer({ bars, centers, priceScale, width }) {
  return bars.map((bar, index) => {
    const center = centers[index]
    const { body, rising, wick } = deriveCandleGeometry(bar, center, width, priceScale)
    return (
      <g className={rising ? 'up' : 'down'} key={bar.timestamp}>
        <line x1={center} x2={center} y1={wick.highY} y2={wick.lowY} />
        <rect height={body.height} width={body.width} x={body.x} y={body.y} />
      </g>
    )
  })
}
