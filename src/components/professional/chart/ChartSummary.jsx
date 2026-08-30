/* eslint-disable react/prop-types */
import { formatNumber as fmt } from '../formatters.js'

export default function ChartSummary({ bar }) {
  return (
    <div className="chart-summary">
      <span>
        O {fmt(bar.open)} · H {fmt(bar.high)} · L {fmt(bar.low)} · C {fmt(bar.close)} · Δ{' '}
        {fmt(bar.delta)} · V {fmt(bar.volume)}
      </span>
    </div>
  )
}
