import { useEffect } from 'react'
import { useTradingActions, useTradingViewModel } from './app/tradingState.jsx'
import Grid from './components/Grid.jsx'
import PairSelector from './components/PairSelector.jsx'
import Settings from './components/Settings.jsx'
import { useTardisPlayback } from './hooks/useTardisPlayback.js'

export default function App() {
  const {
    error: playbackError,
    isLoading: isPlaybackLoading,
    session,
    setSpeed,
    speed,
    view: playback
  } = useTardisPlayback()
  const {
    closePanel,
    openPanel,
    selectPair,
    selectPrice,
    selectTab,
    setBaseCurrency,
    setChartMode,
    setChartTimeframe,
    toggleFavorite
  } = useTradingActions()
  const {
    activePanel,
    asset,
    baseCurrency,
    chartMode,
    chartTimeframe,
    favorites,
    market,
    markets,
    selectedPrice,
    selectedTab,
    timeframe
  } = useTradingViewModel()

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closePanel])

  if (isPlaybackLoading) {
    return (
      <main aria-label="ApexTrader" className="app-shell">
        Cargando sesión histórica BTCUSDT…
      </main>
    )
  }

  if (playbackError || !playback || !session) {
    return (
      <main aria-label="ApexTrader" className="app-shell">
        <p role="alert">No se pudo cargar la sesión histórica: {playbackError}</p>
      </main>
    )
  }

  const sessionOpen = playback.candlesticks[0][1]
  const playbackMarket = {
    ...market,
    price: {
      change: Number(((playback.currentBar.close / sessionOpen - 1) * 100).toFixed(2)),
      value: playback.currentBar.close
    }
  }

  return (
    <main aria-label="ApexTrader" className="app-shell">
      <PairSelector
        asset={asset}
        counterpart={baseCurrency}
        favorites={new Set(favorites)}
        isOpen={activePanel === 'markets'}
        markets={markets}
        onClose={closePanel}
        onSelectPair={selectPair}
        onToggleFavorite={toggleFavorite}
        timeframe={timeframe}
      />
      <Settings
        baseCurrency={baseCurrency}
        isOpen={activePanel === 'settings'}
        onClose={closePanel}
        onCurrencyChange={setBaseCurrency}
      />
      <Grid
        appState={{
          asset,
          baseCurrency,
          candlesticks: playback.candlesticks,
          chartMode,
          chartTimeframe,
          cvd: playback.cvd,
          cvdBars: playback.cvdBars,
          footprintBars: playback.footprintBars,
          market: playbackMarket,
          orderbook: playback.orderbook,
          playbackSpeed: speed,
          playbackTimestamp: playback.currentTimestamp,
          profile: playback.profile,
          barDurationMs: session.barDurationMs,
          selectedPrice,
          selectedTab,
          sessionDate: session.date,
          sessionSymbol: session.symbol,
          timeframe,
          tickSize: session.tickSize,
          trades: playback.executedTrades,
          volumes: playback.volumes
        }}
        onChartModeChange={setChartMode}
        onChartTimeframeChange={setChartTimeframe}
        onOpenMarkets={() => openPanel('markets')}
        onOpenSettings={() => openPanel('settings')}
        onPlaybackSpeedChange={setSpeed}
        onSelectPrice={selectPrice}
        onSelectTab={selectTab}
      />
    </main>
  )
}
