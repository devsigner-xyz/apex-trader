import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Highcharts from 'highcharts/highstock'
import { getChartColors } from '../services/chartColors.js'
import { aggregateChartData } from '../services/chartAggregation.js'

function paneLayout(volumeHeight) {
  const gap = 4
  const priceHeight = 100 - volumeHeight - gap

  return {
    priceHeight: `${priceHeight}%`,
    volumeHeight: `${volumeHeight}%`,
    volumeTop: `${priceHeight + gap}%`
  }
}

function formatValue(value) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function chartOptions(colors, volumeHeight, onPointHover) {
  const panes = paneLayout(volumeHeight)

  return {
    chart: {
      backgroundColor: 'transparent',
      marginBottom: 24,
      marginRight: 72,
      spacing: [0, 0, 0, 0],
      type: 'stock'
    },
    navigator: {
      enabled: false
    },
    rangeSelector: {
      enabled: false
    },
    scrollbar: {
      enabled: false
    },
    title: {
      text: null
    },
    plotOptions: {
      candlestick: {
        color: colors.candlestick,
        lineColor: colors.candlestick,
        maxPointWidth: 12,
        point: {
          events: {
            mouseOver() {
              onPointHover(this)
            }
          }
        },
        upColor: colors.upCandlestick,
        upLineColor: colors.upCandlestick
      },
      column: {
        borderColor: 'transparent',
        borderWidth: 0,
        groupPadding: 0.08,
        pointPadding: 0.04
      }
    },
    xAxis: {
      gridLineWidth: 0,
      labels: {
        style: {
          color: colors.axis
        }
      },
      lineColor: colors.border,
      tickColor: colors.border,
      type: 'datetime'
    },
    yAxis: [
      {
        gridLineColor: colors.grid,
        gridLineDashStyle: 'ShortDot',
        height: panes.priceHeight,
        labels: {
          style: {
            color: colors.axis
          },
          x: 8
        },
        lineColor: colors.border,
        opposite: true,
        tickColor: colors.border,
        title: {
          text: null
        },
        top: '0%'
      },
      {
        gridLineColor: colors.grid,
        height: panes.volumeHeight,
        labels: {
          style: {
            color: colors.axis
          },
          x: 8
        },
        lineColor: colors.border,
        opposite: true,
        tickColor: colors.border,
        title: {
          text: null
        },
        top: panes.volumeTop
      }
    ],
    series: [
      {
        color: colors.candlestick,
        data: [],
        dataGrouping: { enabled: false },
        name: 'BTC-USD',
        type: 'candlestick',
        upColor: colors.upCandlestick,
        yAxis: 0
      },
      {
        borderWidth: 0,
        data: [],
        dataGrouping: { enabled: false },
        name: 'Volume',
        type: 'column',
        yAxis: 1
      }
    ],
    accessibility: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    legend: {
      enabled: false
    },
    tooltip: {
      enabled: false
    }
  }
}

export default function Chart({ candlesticks, selectedPrice, timeframe, volumeHeight, volumes }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const pointHoverRef = useRef(null)
  const [readout, setReadout] = useState(null)
  const groupedData = useMemo(
    () => aggregateChartData(candlesticks, volumes, timeframe),
    [candlesticks, timeframe, volumes]
  )

  pointHoverRef.current = (point) => {
    setReadout({
      close: point.close,
      high: point.high,
      low: point.low,
      open: point.open,
      volume: point.options.custom.volume
    })
  }

  useEffect(() => {
    if (!containerRef.current) return undefined

    chartRef.current = Highcharts.stockChart(
      containerRef.current,
      chartOptions(getChartColors(), volumeHeight, (point) => pointHoverRef.current?.(point))
    )

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const panes = paneLayout(volumeHeight)
    chart.yAxis[0].update({ height: panes.priceHeight, top: '0%' }, false)
    chart.yAxis[1].update({ height: panes.volumeHeight, top: panes.volumeTop }, false)
    chart.redraw()
  }, [volumeHeight])

  useEffect(() => {
    if (!containerRef.current) return undefined

    const observer = new ResizeObserver(() => chartRef.current?.reflow())
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const colors = getChartColors()
    const volumesByTimestamp = new Map(
      groupedData.volumePoints.map(({ timestamp, volume }) => [timestamp, volume])
    )
    const chartCandlesticks = groupedData.candlesticks.map(([x, open, high, low, close]) => ({
      close,
      custom: { volume: volumesByTimestamp.get(x) ?? 0 },
      high,
      low,
      open,
      x
    }))
    const latestCandle = chartCandlesticks.at(-1)

    chart.series[0].setData(chartCandlesticks, false)
    chart.series[1].setData(
      groupedData.volumePoints.map(({ direction, timestamp, volume }) => ({
        color: direction === 'up' ? colors.volumeUp : colors.volumeDown,
        x: timestamp,
        y: volume
      })),
      true
    )
    if (latestCandle) {
      setReadout({
        close: latestCandle.close,
        high: latestCandle.high,
        low: latestCandle.low,
        open: latestCandle.open,
        volume: latestCandle.custom.volume
      })
    }
  }, [groupedData])

  useEffect(() => {
    const axis = chartRef.current?.yAxis[0]
    if (!axis) return

    axis.removePlotLine('selected-execution-price')
    if (Number.isFinite(selectedPrice)) {
      axis.addPlotLine({
        color: '#f5c542',
        id: 'selected-execution-price',
        label: { text: `Ejecutado ${selectedPrice.toLocaleString('en-US')}` },
        value: selectedPrice,
        width: 1
      })
    }
  }, [selectedPrice])

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
  selectedPrice: PropTypes.number,
  timeframe: PropTypes.oneOf([5, 15, 30, 60, 240, 1440]).isRequired,
  volumeHeight: PropTypes.number.isRequired,
  volumes: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired
}
