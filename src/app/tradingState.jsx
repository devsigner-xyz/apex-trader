import PropTypes from 'prop-types'
import { createContext, useContext, useMemo, useReducer } from 'react'
import { markets } from '../data/markets.js'
import { orderbook } from '../data/orderbook.js'
import { trades } from '../data/trades.js'

const AppStateContext = createContext(null)
const AppDispatchContext = createContext(null)

const currencies = ['USD', 'EUR']
const timeframe = 24
const initialFavorites = markets.filter((market) => market.favorite).map((market) => market.ticker)

export const tradingActionTypes = {
  closePanel: 'closePanel',
  openPanel: 'openPanel',
  selectPair: 'selectPair',
  selectPrice: 'selectPrice',
  selectTab: 'selectTab',
  setBaseCurrency: 'setBaseCurrency',
  setChartMode: 'setChartMode',
  toggleFavorite: 'toggleFavorite'
}

function createInitialState() {
  return {
    activePanel: null,
    asset: 'BTC',
    baseCurrency: 'USD',
    chartMode: 'price',
    favorites: initialFavorites,
    selectedPrice: null,
    selectedTab: 'buy'
  }
}

export function tradingReducer(state, action) {
  switch (action.type) {
    case tradingActionTypes.closePanel:
      return { ...state, activePanel: null }
    case tradingActionTypes.openPanel:
      return { ...state, activePanel: action.panel }
    case tradingActionTypes.selectPair:
      return { ...state, activePanel: null, asset: action.asset }
    case tradingActionTypes.selectPrice:
      return { ...state, selectedPrice: action.price }
    case tradingActionTypes.selectTab:
      return { ...state, selectedTab: action.tab }
    case tradingActionTypes.setBaseCurrency:
      return { ...state, baseCurrency: action.currency }
    case tradingActionTypes.setChartMode:
      return { ...state, chartMode: action.chartMode }
    case tradingActionTypes.toggleFavorite:
      return {
        ...state,
        favorites: state.favorites.includes(action.asset)
          ? state.favorites.filter((asset) => asset !== action.asset)
          : [...state.favorites, action.asset]
      }
    default:
      return state
  }
}

export function TradingStateProvider({ children }) {
  const [state, dispatch] = useReducer(tradingReducer, undefined, createInitialState)

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}

TradingStateProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export function useTradingState() {
  const state = useContext(AppStateContext)

  if (state === null) {
    throw new Error('useTradingState must be used within a TradingStateProvider')
  }

  return state
}

function useTradingDispatch() {
  const dispatch = useContext(AppDispatchContext)

  if (dispatch === null) {
    throw new Error('useTradingActions must be used within a TradingStateProvider')
  }

  return dispatch
}

export function useTradingActions() {
  const dispatch = useTradingDispatch()

  return useMemo(
    () => ({
      closePanel: () => dispatch({ type: tradingActionTypes.closePanel }),
      openPanel: (panel) => dispatch({ type: tradingActionTypes.openPanel, panel }),
      selectPair: (asset) => dispatch({ type: tradingActionTypes.selectPair, asset }),
      selectPrice: (price) => dispatch({ type: tradingActionTypes.selectPrice, price }),
      selectTab: (tab) => dispatch({ type: tradingActionTypes.selectTab, tab }),
      setBaseCurrency: (currency) =>
        dispatch({ type: tradingActionTypes.setBaseCurrency, currency }),
      setChartMode: (chartMode) => dispatch({ type: tradingActionTypes.setChartMode, chartMode }),
      toggleFavorite: (asset) => dispatch({ type: tradingActionTypes.toggleFavorite, asset })
    }),
    [dispatch]
  )
}

export function selectActiveMarket(state) {
  return markets.find((market) => market.ticker === state.asset) ?? markets[0]
}

export function useTradingViewModel() {
  const state = useTradingState()

  return useMemo(
    () => ({
      ...state,
      currencies,
      market: selectActiveMarket(state),
      markets,
      orderbook,
      timeframe,
      trades
    }),
    [state]
  )
}
