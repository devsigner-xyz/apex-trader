import { useEffect } from 'react'
import { useTradingActions, useTradingViewModel } from './app/tradingState.jsx'
import Grid from './components/Grid.jsx'
import PairSelector from './components/PairSelector.jsx'
import Settings from './components/Settings.jsx'

export default function App() {
  const {
    closePanel,
    openPanel,
    selectPair,
    selectPrice,
    selectTab,
    setBaseCurrency,
    setChartMode,
    toggleFavorite
  } = useTradingActions()
  const {
    activePanel,
    asset,
    baseCurrency,
    chartMode,
    favorites,
    market,
    markets,
    orderbook,
    selectedPrice,
    selectedTab,
    timeframe,
    trades
  } = useTradingViewModel()

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closePanel])

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
          chartMode,
          market,
          orderbook,
          selectedPrice,
          selectedTab,
          timeframe,
          trades
        }}
        onChartModeChange={setChartMode}
        onOpenMarkets={() => openPanel('markets')}
        onOpenSettings={() => openPanel('settings')}
        onOrderSubmit={() => {}}
        onSelectPrice={selectPrice}
        onSelectTab={selectTab}
      />
    </main>
  )
}
