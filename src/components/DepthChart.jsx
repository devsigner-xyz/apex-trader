import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Highcharts from 'highcharts'
import 'highcharts/css/highcharts.css'
import { getChartColors, getDepthChartFillOpacity } from '../services/chartColors.js'

export function calculateCumulativeData(entries) {
  let cumulativeAmount = 0

  return entries.map(({ amount, price }) => {
    cumulativeAmount += amount
    return { x: cumulativeAmount, y: price }
  })
}

function depthChartOptions(name, colors, reversed) {
  return {
    chart: {
      inverted: true,
      margin: 0,
      spacing: [0, 0, 0, 0],
      type: 'area'
    },
    title: {
      text: null
    },
    xAxis: {
      min: 0,
      reversed,
      visible: false
    },
    yAxis: {
      reversed: false,
      visible: false
    },
    plotOptions: {
      area: {
        lineWidth: 1,
        marker: {
          enabled: false
        },
        states: {
          hover: {
            lineWidth: 1
          }
        },
        threshold: null
      }
    },
    series: [
      {
        color: colors.area,
        data: [],
        fillOpacity: getDepthChartFillOpacity(),
        lineColor: colors.line,
        name
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

function updateDepthChart(chart, data) {
  if (!chart) return

  const cumulativeAmounts = data.map(({ x }) => x)
  const prices = data.map(({ y }) => y)

  chart.update(
    {
      series: [{ data }],
      xAxis: {
        max: cumulativeAmounts.length ? Math.max(...cumulativeAmounts) : undefined,
        min: 0
      },
      yAxis: {
        max: prices.length ? Math.max(...prices) : undefined,
        min: prices.length ? Math.min(...prices) : undefined
      }
    },
    true,
    true
  )
}

export default function DepthChart({ asks, bids }) {
  const bidContainerRef = useRef(null)
  const askContainerRef = useRef(null)
  const bidChartRef = useRef(null)
  const askChartRef = useRef(null)

  useEffect(() => {
    if (!bidContainerRef.current || !askContainerRef.current) return undefined

    const colors = getChartColors()

    bidChartRef.current = Highcharts.chart(
      bidContainerRef.current,
      depthChartOptions('Bids', colors.bid, true)
    )
    askChartRef.current = Highcharts.chart(
      askContainerRef.current,
      depthChartOptions('Asks', colors.ask, true)
    )

    return () => {
      bidChartRef.current?.destroy()
      askChartRef.current?.destroy()
      bidChartRef.current = null
      askChartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!bidContainerRef.current || !askContainerRef.current) return undefined

    const observer = new ResizeObserver(() => {
      bidChartRef.current?.reflow()
      askChartRef.current?.reflow()
    })
    observer.observe(bidContainerRef.current)
    observer.observe(askContainerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    updateDepthChart(bidChartRef.current, calculateCumulativeData(bids))
    updateDepthChart(askChartRef.current, calculateCumulativeData(asks))
  }, [asks, bids])

  return (
    <div className="depth-slot depth-chart" data-testid="depth-chart">
      <div className="bid-chart">
        <div
          aria-label="Bid depth chart"
          className="chart-canvas"
          data-testid="bid-depth-chart"
          ref={bidContainerRef}
        />
      </div>
      <div className="ask-chart">
        <div
          aria-label="Ask depth chart"
          className="chart-canvas"
          data-testid="ask-depth-chart"
          ref={askContainerRef}
        />
      </div>
    </div>
  )
}

const depthEntryShape = PropTypes.shape({
  amount: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired
})

DepthChart.propTypes = {
  asks: PropTypes.arrayOf(depthEntryShape).isRequired,
  bids: PropTypes.arrayOf(depthEntryShape).isRequired
}
