import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart
} from 'lightweight-charts'
import { getChartColors } from '../services/chartColors.js'
import { aggregateChartData } from '../services/chartAggregation.js'
import {
  createCandlestickData,
  createHeikinAshiData,
  createLineData,
  createSmaData,
  createVolumeData
} from '../services/chartTransforms.js'

const SMA_PERIOD = 20

function formatValue(value) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const INITIAL_VOLUME_PANE_RATIO = 0.28

function getPriceSeriesData(candlesticks, chartType) {
  if (chartType === 'line') return createLineData(candlesticks)
  if (chartType === 'heikinAshi') return createHeikinAshiData(candlesticks)
  return createCandlestickData(candlesticks)
}

function createPriceSeries(chart, chartType, colors) {
  if (chartType === 'line') {
    return chart.addSeries(LineSeries, {
      color: colors.upCandlestick,
      crosshairMarkerBorderColor: colors.upCandlestick,
      crosshairMarkerBackgroundColor: colors.surface,
      lastValueVisible: false,
      lineWidth: 2,
      priceLineVisible: false
    })
  }

  return chart.addSeries(CandlestickSeries, {
    borderDownColor: colors.candlestick,
    borderUpColor: colors.upCandlestick,
    downColor: colors.candlestick,
    lastValueVisible: false,
    priceLineVisible: false,
    upColor: colors.upCandlestick,
    wickDownColor: colors.candlestick,
    wickUpColor: colors.upCandlestick
  })
}

function createChartInstance(container, colors) {
  return createChart(container, {
    autoSize: true,
    crosshair: {
      horzLine: { labelBackgroundColor: colors.surface },
      mode: CrosshairMode.Normal,
      vertLine: { labelBackgroundColor: colors.surface }
    },
    grid: {
      horzLines: { color: colors.grid },
      vertLines: { color: colors.grid }
    },
    layout: {
      background: { color: 'transparent', type: ColorType.Solid },
      panes: { separatorColor: colors.border, separatorHoverColor: colors.border },
      textColor: colors.axis
    },
    rightPriceScale: {
      borderColor: colors.border,
      minimumWidth: 68
    },
    timeScale: {
      borderColor: colors.border,
      timeVisible: true
    }
  })
}

export default function Chart({
  candlesticks,
  chartType,
  selectedPrice,
  showSma,
  timeframe,
  volumes
}) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const priceSeriesRef = useRef(null)
  const priceLineRef = useRef(null)
  const rawCandlesByTimeRef = useRef(new Map())
  const volumeSeriesRef = useRef(null)
  const smaSeriesRef = useRef(null)
  const previousTimeframeRef = useRef(null)
  const [readout, setReadout] = useState(null)
  const groupedData = useMemo(
    () => aggregateChartData(candlesticks, volumes, timeframe),
    [candlesticks, timeframe, volumes]
  )

  useEffect(() => {
    const chart = chartRef.current
    const priceSeries = priceSeriesRef.current
    const volumeSeries = volumeSeriesRef.current
    if (!chart || !priceSeries || !volumeSeries) return

    const colors = getChartColors()
    const rawCandlesByTime = new Map(
      groupedData.candlesticks.map(([timestamp, open, high, low, close]) => [
        Math.floor(timestamp / 1000),
        { close, high, low, open, volume: 0 }
      ])
    )
    groupedData.volumePoints.forEach(({ timestamp, volume }) => {
      const candle = rawCandlesByTime.get(Math.floor(timestamp / 1000))
      if (candle) candle.volume = volume
    })
    rawCandlesByTimeRef.current = rawCandlesByTime

    priceSeries.setData(getPriceSeriesData(groupedData.candlesticks, chartType))
    volumeSeries.setData(
      createVolumeData(groupedData.volumePoints, {
        down: colors.volumeDown,
        up: colors.volumeUp
      })
    )
    if (showSma) smaSeriesRef.current?.setData(createSmaData(groupedData.candlesticks, SMA_PERIOD))

    const latest = rawCandlesByTime.get(Math.floor(groupedData.candlesticks.at(-1)?.[0] / 1000))
    if (latest) setReadout(latest)

    if (previousTimeframeRef.current !== timeframe) {
      chart.timeScale().fitContent()
      previousTimeframeRef.current = timeframe
    }
  }, [chartType, groupedData, showSma, timeframe])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const colors = getChartColors()
    const chart = createChartInstance(container, colors)
    const priceSeries = createPriceSeries(chart, chartType, colors)
    const volumePane = chart.addPane()
    const volumeSeries = chart.addSeries(
      HistogramSeries,
      {
        lastValueVisible: false,
        priceFormat: { type: 'volume' },
        priceLineVisible: false
      },
      volumePane.paneIndex()
    )
    const smaSeries = showSma
      ? chart.addSeries(LineSeries, {
          color: '#f5c542',
          lastValueVisible: false,
          lineWidth: 1,
          priceLineVisible: false,
          title: `SMA ${SMA_PERIOD}`
        })
      : null

    chartRef.current = chart
    priceSeriesRef.current = priceSeries
    volumeSeriesRef.current = volumeSeries
    smaSeriesRef.current = smaSeries
    previousTimeframeRef.current = timeframe

    const rawCandlesByTime = new Map(
      groupedData.candlesticks.map(([timestamp, open, high, low, close]) => [
        Math.floor(timestamp / 1000),
        { close, high, low, open, volume: 0 }
      ])
    )
    groupedData.volumePoints.forEach(({ timestamp, volume }) => {
      const candle = rawCandlesByTime.get(Math.floor(timestamp / 1000))
      if (candle) candle.volume = volume
    })
    rawCandlesByTimeRef.current = rawCandlesByTime
    priceSeries.setData(getPriceSeriesData(groupedData.candlesticks, chartType))
    volumeSeries.setData(
      createVolumeData(groupedData.volumePoints, { down: colors.volumeDown, up: colors.volumeUp })
    )
    if (smaSeries) smaSeries.setData(createSmaData(groupedData.candlesticks, SMA_PERIOD))
    const latest = rawCandlesByTime.get(Math.floor(groupedData.candlesticks.at(-1)?.[0] / 1000))
    if (latest) setReadout(latest)
    chart.timeScale().fitContent()
    volumePane.setHeight(Math.round(container.clientHeight * INITIAL_VOLUME_PANE_RATIO))

    const onCrosshairMove = (parameter) => {
      if (parameter.time === undefined) return
      const candle = rawCandlesByTimeRef.current.get(Number(parameter.time))
      if (candle) setReadout(candle)
    }
    chart.subscribeCrosshairMove(onCrosshairMove)

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove)
      chart.remove()
      chartRef.current = null
      priceSeriesRef.current = null
      volumeSeriesRef.current = null
      smaSeriesRef.current = null
      priceLineRef.current = null
    }
  }, [chartType, showSma])


  useEffect(() => {
    const priceSeries = priceSeriesRef.current
    if (!priceSeries) return

    if (priceLineRef.current) priceSeries.removePriceLine(priceLineRef.current)
    priceLineRef.current = null
    if (Number.isFinite(selectedPrice)) {
      priceLineRef.current = priceSeries.createPriceLine({
        axisLabelVisible: true,
        color: '#f5c542',
        lineVisible: true,
        lineWidth: 1,
        price: selectedPrice,
        title: 'Ejecutado'
      })
    }
  }, [chartType, selectedPrice])

  const direction = readout && readout.close >= readout.open ? 'up' : 'down'

  return (
    <div className="chart-slot price-chart">
      {readout && (
        <div
          aria-live="polite"
          className={`price-chart__readout price-chart__readout--${direction}`}
          data-testid="price-chart-readout"
        >
          <span>O {formatValue(readout.open)}</span>
          <span>H {formatValue(readout.high)}</span>
          <span>L {formatValue(readout.low)}</span>
          <span>C {formatValue(readout.close)}</span>
          <span>V {formatValue(readout.volume)}</span>
        </div>
      )}
      <div
        aria-label="Price chart"
        className="price-chart__canvas"
        data-testid="price-chart"
        ref={containerRef}
      />
    </div>
  )
}

Chart.propTypes = {
  candlesticks: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  chartType: PropTypes.oneOf(['candlestick', 'line', 'heikinAshi']).isRequired,
  selectedPrice: PropTypes.number,
  showSma: PropTypes.bool.isRequired,
  timeframe: PropTypes.oneOf([5, 15, 30, 60]).isRequired,
  volumes: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired
}
