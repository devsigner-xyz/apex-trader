import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Highcharts from 'highcharts/highstock'
import { loadPriceChartData } from '../services/priceChartData.js'
import { getChartColors } from '../services/chartColors.js'

function chartOptions(colors) {
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
      text: 'BTC-USD Price (Kraken)'
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
      max: Date.UTC(2023, 0, 15),
      min: Date.UTC(2023, 0, 15) - 60 * 24 * 3600 * 1000,
      minRange: 30 * 24 * 3600 * 1000,
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
        dataGrouping: {
          units: [
            ['week', [1]],
            ['month', [1, 2, 3, 4, 6]]
          ]
        },
        name: 'BTC-USD',
        type: 'candlestick',
        upColor: colors.upCandlestick
      },
      {
        color: colors.volume,
        data: [],
        dataGrouping: {
          units: [
            ['week', [1]],
            ['month', [1, 2, 3, 4, 6]]
          ]
        },
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

export default function Chart({ asset, baseCurrency }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    chartRef.current = Highcharts.stockChart(containerRef.current, chartOptions(getChartColors()))

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    loadPriceChartData()
      .then((nextData) => {
        if (!cancelled) setData(nextData)
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    chart.setTitle({ text: `${asset}-${baseCurrency} Price (Kraken)` })
    chart.series[0].update({ name: `${asset}-${baseCurrency}` }, false)
    chart.redraw()
  }, [asset, baseCurrency])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !data) return

    chart.series[0].setData(data.candlesticks, false)
    chart.series[1].setData(data.volumes, true)
  }, [data])

  return (
    <div className="chart-slot price-chart">
      <div
        aria-label="Price chart"
        className="price-chart__canvas"
        data-testid="price-chart"
        ref={containerRef}
      />
      {error && (
        <p className="chart-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

Chart.propTypes = {
  asset: PropTypes.string.isRequired,
  baseCurrency: PropTypes.string.isRequired
}
