import { useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import Highcharts from 'highcharts/highstock'
import { getChartColors } from '../services/chartColors.js'
import { aggregateChartData } from '../services/chartAggregation.js'

function chartOptions(colors, title) {
  return {
    chart: {
      backgroundColor: 'transparent',
      marginBottom: 16,
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
      align: 'left',
      margin: 8,
      style: {
        color: colors.axis,
        fontSize: '11px',
        fontWeight: '600'
      },
      text: title
    },
    plotOptions: {
      candlestick: {
        color: colors.candlestick,
        lineColor: colors.candlestick,
        maxPointWidth: 12,
        upColor: colors.upCandlestick,
        upLineColor: colors.upCandlestick
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
        labels: {
          style: {
            color: colors.axis
          },
          x: -40
        },
        lineColor: colors.border,
        opposite: true,
        tickColor: colors.border,
        title: {
          text: 'Price'
        }
      },
      {
        gridLineColor: colors.grid,
        labels: {
          style: {
            color: colors.axis
          }
        },
        lineColor: colors.border,
        opposite: true,
        tickColor: colors.border,
        title: {
          text: 'Volume'
        }
      }
    ],
    series: [
      {
        color: colors.candlestick,
        data: [],
        dataGrouping: { enabled: false },
        name: 'BTC-USD',
        type: 'candlestick',
        upColor: colors.upCandlestick
      },
      {
        color: colors.volume,
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
      backgroundColor: colors.surface,
      borderColor: colors.border,
      enabled: true,
      style: {
        color: colors.axis
      }
    }
  }
}

export default function Chart({
  candlesticks,
  selectedPrice,
  sessionDate,
  symbol,
  timeframe,
  volumes
}) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const title = `${symbol} · ${timeframe}m · ${sessionDate}`
  const groupedData = useMemo(
    () => aggregateChartData(candlesticks, volumes, timeframe),
    [candlesticks, timeframe, volumes]
  )

  useEffect(() => {
    if (!containerRef.current) return undefined

    chartRef.current = Highcharts.stockChart(
      containerRef.current,
      chartOptions(getChartColors(), title)
    )

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [title])

  useEffect(() => {
    if (!containerRef.current) return undefined

    const observer = new ResizeObserver(() => chartRef.current?.reflow())
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    chart.series[0].setData(groupedData.candlesticks, false)
    chart.series[1].setData(groupedData.volumes, true)
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

  return (
    <div className="chart-slot price-chart">
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
  sessionDate: PropTypes.string.isRequired,
  symbol: PropTypes.string.isRequired,
  timeframe: PropTypes.oneOf([5, 15, 30, 60]).isRequired,
  volumes: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired
}
