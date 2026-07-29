import { useEffect, useMemo, useRef } from 'react'
import PropTypes from 'prop-types'
import Highcharts from 'highcharts/highstock'
import { getChartColors } from '../services/chartColors.js'
import { aggregateChartData } from '../services/chartAggregation.js'

function chartOptions(colors, title) {
  return {
    chart: {
      marginBottom: 16,
      spacing: [0, 0, 0, 0],
      type: 'stock'
    },
    rangeSelector: {
      inputPosition: {
        align: 'right'
      },
      selected: 2
    },
    navigator: {
      enabled: true
    },
    title: {
      style: {
        color: colors.axis
      },
      text: title
    },
    plotOptions: {
      candlestick: {
        color: colors.candlestick,
        lineColor: colors.candlestick,
        upColor: colors.upCandlestick,
        upLineColor: colors.upCandlestick
      }
    },
    xAxis: {
      labels: {
        style: {
          color: colors.axis
        }
      },
      type: 'datetime'
    },
    yAxis: [
      {
        labels: {
          style: {
            color: colors.axis
          },
          x: -40
        },
        opposite: true,
        title: {
          text: 'Price'
        }
      },
      {
        labels: {
          style: {
            color: colors.axis
          }
        },
        opposite: true,
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
      enabled: true
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
  const title = `${symbol} Price · ${timeframe}m (Binance Spot, ${sessionDate} UTC)`
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
