import {
  clamp,
  niceDisplayStep,
  selectTimeTickIndexes
} from '../../../services/professionalChartGeometry.js'
import { chartDefaults } from '../config.js'

export function deriveProfileMarkers(visibleProfile) {
  if (!Number.isFinite(visibleProfile.poc)) return []
  return [
    { label: 'VAH', price: visibleProfile.vah, tone: 'value-area' },
    { label: 'POC', price: visibleProfile.poc, tone: 'poc' },
    { label: 'VAL', price: visibleProfile.val, tone: 'value-area' }
  ]
}

export function deriveChartLayerPresentation({
  range,
  sourceTickSize,
  step,
  visible,
  visibleCount
}) {
  const candleWidth = clamp(step * 0.58, 4, 16)
  const volumeWidth = clamp(step * 0.48, 5, 18)
  const maximumVisibleVolume = Math.max(...visible.map((bar) => bar.volume), 1)
  const footprintZoomScale = clamp(chartDefaults.footprint / visibleCount, 1, 1.6)
  const footprintFontSize = clamp(10 + (footprintZoomScale - 1) * 7, 10, 14)
  const footprintDeltaFontSize = clamp(11 + (footprintZoomScale - 1) * 5, 11, 14)
  const stepZoomScale = clamp(chartDefaults['step-profile'] / visibleCount, 1, 9)
  const stepDeltaFontSize = clamp(13 + (stepZoomScale - 1) * 1.25, 13, 19)
  const footprintTickSize = niceDisplayStep((range / 28) * footprintZoomScale, sourceTickSize)
  const stepProfileTickSize = niceDisplayStep(
    (range / 64) * Math.sqrt(stepZoomScale),
    sourceTickSize
  )
  const footprintSettings = {
    format: 'compact',
    imbalanceRatio: 3,
    minimumVolume: 0,
    mode: 'bidAsk',
    scale: 'linear',
    stackedImbalanceSize: 3,
    tickSize: footprintTickSize
  }

  return {
    candleWidth,
    footprintDeltaFontSize,
    footprintFontSize,
    footprintSettings,
    footprintTickSize,
    footprintZoomScale,
    maximumVisibleVolume,
    stepDeltaFontSize,
    stepProfileSettings: { ...footprintSettings, tickSize: stepProfileTickSize },
    stepProfileTickSize,
    stepZoomScale,
    volumeWidth
  }
}

export function selectVisibleTimeTickIndexes(positions, plotLeft, plotRight) {
  return selectTimeTickIndexes(positions).filter((index) => {
    const position = positions[index]
    return position >= plotLeft + 24 && position <= plotRight - 24
  })
}

export function deriveChartPanelStyle(panelSizes, panelVisibility) {
  return {
    '--volume-panel-height': panelVisibility.volume ? `${panelSizes.volume}px` : '0px',
    '--volume-resizer-height': panelVisibility.volume ? '7px' : '0px'
  }
}
