/* eslint-disable react/prop-types */
import { clamp, deriveVolumeBarGeometry } from '../../../services/professionalChartGeometry.js'
import { chartDimensions, chartPanelSizeLimits } from '../config.js'
import PanelResizer from '../PanelResizer.jsx'

const { chartWidth, plotLeft, plotRight, volumeBottom, volumeChartHeight, volumeTop } =
  chartDimensions
const plotWidth = plotRight - plotLeft

export default function VolumePanel({
  bars,
  centers,
  maximumVolume,
  setPanelSizes,
  timeIndexes,
  width
}) {
  return (
    <>
      <PanelResizer
        axis="y"
        className="chart-volume-resizer"
        label="Resize volume panel"
        onResize={(delta) =>
          setPanelSizes((current) => ({
            ...current,
            volume: clamp(
              current.volume - delta,
              chartPanelSizeLimits.volume[0],
              chartPanelSizeLimits.volume[1]
            )
          }))
        }
      />
      <div className="volume-chart-panel">
        <svg
          aria-label="Volume panel"
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${chartWidth} ${volumeChartHeight}`}
        >
          <rect width={chartWidth} height={volumeChartHeight} fill="#0b0f12" />
          <defs>
            <clipPath id="market-chart-volume-plot-clip">
              <rect height={volumeChartHeight} width={plotWidth} x={plotLeft} y="0" />
            </clipPath>
          </defs>
          <g clipPath="url(#market-chart-volume-plot-clip)">
            {timeIndexes.map((index) => (
              <line
                className="gridline faint"
                key={`volume-grid-${bars[index]?.timestamp}`}
                x1={centers[index]}
                x2={centers[index]}
                y1="0"
                y2={volumeChartHeight}
              />
            ))}
            {bars.map((bar, index) => {
              const geometry = deriveVolumeBarGeometry(
                bar,
                centers[index],
                width,
                maximumVolume,
                volumeTop,
                volumeBottom
              )
              return (
                <rect
                  className={`volume-bar ${geometry.rising ? 'volume-up' : 'volume-down'}`}
                  height={geometry.height}
                  key={`volume-${bar.timestamp}`}
                  width={geometry.width}
                  x={geometry.x}
                  y={geometry.y}
                />
              )
            })}
          </g>
        </svg>
      </div>
    </>
  )
}
