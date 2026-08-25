/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { usePersistentState } from '../hooks/usePersistentState.js'
import { clamp } from '../services/professionalChartGeometry.js'
import { normalizePanelSizes } from '../services/professionalTerminalPersistence.js'
import Activity from './professional/Activity.jsx'
import MarketChart from './professional/chart/MarketChart.jsx'
import { storageKeys } from './professional/config.js'
import Dom from './professional/Dom.jsx'
import Execution from './professional/execution/Execution.jsx'
import PanelResizer from './professional/PanelResizer.jsx'
import Watchlist from './professional/Watchlist.jsx'

const { panelSizes: panelSizesStorageKey } = storageKeys

export default function ProfessionalTerminal({ mode, onMode, playback }) {
  const { session, view } = playback
  const [price, setPrice] = useState(Number(view.current.close).toFixed(2))
  const [timeframe, setTimeframe] = useState(() => (mode === 'footprint' ? 60 : 5))
  const [columns, setColumns] = usePersistentState(panelSizesStorageKey, normalizePanelSizes)

  useEffect(() => {
    if (mode === 'footprint' && timeframe < 60) setTimeframe(60)
  }, [mode, timeframe])

  const routeMode = (next) => {
    if (next === 'footprint') setTimeframe((current) => Math.max(current, 60))
    onMode(next)
    history.pushState({}, '', next === 'candles' ? '/price-chart' : `/${next}`)
  }
  const workspaceStyle = {
    '--dom-width': `${columns.dom}px`,
    '--execution-width': `${columns.execution}px`,
    '--watch-width': `${columns.watch}px`
  }

  return (
    <div className="pro-terminal">
      <header className="market-header">
        <strong>APEX TRADER</strong>
      </header>
      <div className="terminal-workspace" style={workspaceStyle}>
        <Watchlist />
        <PanelResizer
          className="watch-resizer"
          label="Resize watchlist"
          onResize={(delta) =>
            setColumns((current) => ({ ...current, watch: clamp(current.watch + delta, 340, 460) }))
          }
        />
        <div className="chart-stack">
          <MarketChart
            mode={mode}
            onMode={routeMode}
            onTimeframe={setTimeframe}
            sourceTickSize={session.tickSize}
            timeframe={timeframe}
            view={view}
          />
          <Activity />
        </div>
        <PanelResizer
          className="dom-resizer"
          label="Resize DOM"
          onResize={(delta) =>
            setColumns((current) => ({ ...current, dom: clamp(current.dom - delta, 218, 340) }))
          }
        />
        <Dom
          currentPrice={view.current.close}
          onPrice={(next) => setPrice(Number(next).toFixed(2))}
          orderbook={view.orderbook}
          sourceTickSize={session.tickSize}
        />
        <PanelResizer
          className="execution-resizer"
          label="Resize execution panel"
          onResize={(delta) =>
            setColumns((current) => ({
              ...current,
              dom: clamp(current.dom + delta, 218, 340),
              execution: clamp(current.execution - delta, 250, 380)
            }))
          }
        />
        <Execution price={price} setPrice={setPrice} trades={view.trades} />
      </div>
      <footer className="terminal-footer">ApexTrader by devsigner.xyz</footer>
    </div>
  )
}

ProfessionalTerminal.propTypes = {
  mode: PropTypes.oneOf(['candles', 'footprint', 'step-profile']).isRequired,
  onMode: PropTypes.func.isRequired,
  playback: PropTypes.object.isRequired
}
