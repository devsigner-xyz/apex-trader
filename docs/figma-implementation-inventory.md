# Apex Trader Figma implementation inventory

Source file: `Ze9eGnPaNDj8u0oB1iUt3C`, page `00 · Current UI`. Figma is read-only for this implementation.

## Current versus legacy

The implementation targets the three supplied `Professional … v2 · Desktop 1920` frames. They share the same reusable shell and are the most recent named variants exposed by the supplied entry points. The older top-level `Current UI` frames (`3:2`, `20:2`, `20:18`) are retained in Figma as explorations and are not implementation references.

| Figma frame                               | Route           | View state     | Status |
| ----------------------------------------- | --------------- | -------------- | ------ |
| `62:1697` · Professional Price Chart v2   | `/price-chart`  | `candles`      | Target |
| `61:2` · Professional Footprint v2        | `/footprint`    | `footprint`    | Target |
| `169:4796` · Professional Step Profile v2 | `/step-profile` | `step-profile` | Target |

All frames are 1920 × 1080. At narrower viewports the workspace keeps its trading-terminal density and becomes horizontally scrollable; panels are not silently removed or rearranged.

## Shared shell mapping

| Figma node                                                | Dimensions | Implementation responsibility       | Visible states and behavior                                                                 |
| --------------------------------------------------------- | ---------: | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `61:3` / equivalent · Global Market Header                |  1920 × 40 | `MarketHeader`                      | BTCUSDT identity, real last/change, historical session clock, feed and fixture account      |
| `61:14` / equivalent · Workspace Toolbar                  |  1920 × 40 | `WorkspaceToolbar`                  | symbol, timeframe, chart-mode and tick selectors; studies; layout/settings triggers         |
| `113:2114` / equivalent · Watchlist                       | 288 × 1000 | `Watchlist`                         | selected BTCUSDT row, hover/focus rows, category select; non-BTC rows are labelled fixtures |
| `113:2745`, `113:5681`, `169:4821` · MarketChart variants | 1188 × 810 | `MarketWorkspace` + chart renderers | Candles, Footprint, Step Profile; volume, CVD, session VP, POC/VAH/VAL, VWAP/EMA            |
| `113:4047` / equivalent · ActivityBlotter                 | 1188 × 190 | `ActivityBlotter`                   | Positions, Orders, Fills, Activity, Account & Risk; fixture trading/account rows            |
| `113:4170` / equivalent · OrderBook                       | 184 × 1000 | `DomLadder`                         | reconstructed real L2, selected price, bid/ask depth, live-at-history-clock footer          |
| `113:5231` / equivalent · ExecutionPanel                  | 260 × 1000 | `ExecutionPanel` + `TimeAndSales`   | buy/sell, order fields, disabled/active submit states, real market tape                     |

## Chart contracts

### Price Chart (`62:1697`)

- Candles and volume are derived from all Binance Spot BTCUSDT trades in the active interval.
- VWAP, EMA20, session profile, POC, VAH and VAL share the playback clock.
- The reference uses a dense canvas with a 56 px price scale and a right-aligned split buy/sell profile.

### Footprint (`61:2`)

- `Chart/FootprintCell` (`57:61`) is a 34 × 16 bid/ask cell with low/mid/high intensity plus imbalance and POC emphasis.
- Aggressor `buy` volume maps to ask; aggressor `sell` maps to bid.
- Per-bar volume, delta, CVD, footprint levels and session profile come from the same complete trade stream.

### Step Profile (`169:4796`)

- Each interval renders an irregular bid/ask distribution, local POC, high/low spine and totals.
- Session VP, VWAP/EMA, volume and CVD remain aligned with the same interval and playback clock.

## Interaction and overlay inventory

| Control           | Default                                                | Hover/focus              | Active/open                                         | Disabled                                   |
| ----------------- | ------------------------------------------------------ | ------------------------ | --------------------------------------------------- | ------------------------------------------ |
| Compact selects   | inset surface                                          | strong border/focus ring | native list, selected value reflected in route/view | unavailable option muted                   |
| Chart mode routes | current view selected                                  | accent text/border       | History API transition without reload               | n/a                                        |
| Playback          | playing at fixed 1× from the initial historical window | focus ring               | play/pause and seek update one clock                | controls disabled while data loads         |
| DOM row           | neutral                                                | selected background      | clicking copies the real price into execution limit | no liquidity row omitted                   |
| Buy/Sell          | Buy default                                            | semantic hover           | active side changes submit label/color              | submit disabled for invalid quantity/price |
| Activity tabs     | Positions default                                      | raised surface           | tab body and counts change                          | n/a                                        |
| Settings          | closed                                                 | trigger focus            | modal overlay with close/Escape                     | n/a                                        |

## Data provenance boundary

- Real market data: BTCUSDT last price, OHLC, volume, footprint, delta, CVD, VWAP, EMA, profiles, DOM and Time & Sales.
- Fixtures: account identifier, buying power, positions/orders/fills, PnL, fees, execution narrative and non-BTC watchlist instruments. Fixture surfaces are labelled `SIM` or `DEMO` and must not be presented as live market feeds.
- Historical clock: UTC session 2019-12-01; every market module resolves from that clock for fixed 1× playback, pause and seek.
