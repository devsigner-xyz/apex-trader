# Apex Trader Figma implementation inventory

Source file: `Ze9eGnPaNDj8u0oB1iUt3C`, page `01 · Proposed UI`.

The original rebuild objective treated Figma as read-only. Later user instructions explicitly authorized synchronizing the current web layout back into the three target frames. Those writes are limited to the Apex Trader file and are recorded below.

## Current versus legacy

The implementation targets the three supplied `Professional … v2 · Desktop 1920` frames. They share the same reusable shell and are the most recent named variants exposed by the supplied entry points. The older top-level `Current UI` frames (`3:2`, `20:2`, `20:18`) are retained in Figma as explorations and are not implementation references.

| Figma frame                               | Route           | View state     | Status |
| ----------------------------------------- | --------------- | -------------- | ------ |
| `62:1697` · Professional Price Chart v2   | `/price-chart`  | `candles`      | Target |
| `61:2` · Professional Footprint v2        | `/footprint`    | `footprint`    | Target |
| `169:4796` · Professional Step Profile v2 | `/step-profile` | `step-profile` | Target |

All frames are 1920 × 1080. At narrower viewports the workspace keeps its trading-terminal density and becomes horizontally scrollable; panels are not silently removed or rearranged.

## Shared shell mapping

| Figma node                                                | Geometry at 1920 × 1080 | Implementation responsibility | Visible states and behavior                                                                 |
| --------------------------------------------------------- | ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| `61:3` / equivalent · Global Market Header                | `x0 y0 w1920 h44`       | `MarketHeader`                | BTCUSDT identity, real last/change, historical session clock and feed state                 |
| `61:14` / equivalent · Workspace Toolbar                  | `x365 y44 w1047 h44`    | workspace toolbar             | symbol, 5/15/30/60-minute timeframe, chart mode, tick and settings                          |
| `113:2114` / equivalent · Watchlist                       | `x0 y44 w360 h982`      | `Watchlist`                   | reaches the global header; selected BTCUSDT row; other instruments are explicit demo rows   |
| `113:2745`, `113:5681`, `169:4821` · MarketChart variants | `x365 y88 w1047 h728`   | `MarketChart` renderers       | Candles, Footprint, Step Profile; price scale, volume, CVD, profiles and chart interaction  |
| `113:4047` / equivalent · ActivityBlotter                 | `x365 y816 w1047 h210`  | `Activity`                    | functional Positions, Orders, Fills, Activity, Account & Risk tabs; explicit `DEMO DATA`    |
| `113:4170` / equivalent · OrderBook                       | `x1417 y44 w218 h982`   | `Dom`                         | reconstructed real L2, stable last-price/spread separator, selected price and 20 Hz replay  |
| `113:5231` / equivalent · ExecutionPanel                  | `x1640 y44 w280 h982`   | `Execution` + `TimeSales`     | buy/sell, controlled order type, local non-transmitted staging message and real market tape |
| `303:2` · `Trading/PlaybackDock` + three screen instances | `x510 y1030 w900 h46`   | playback dock                 | fixed 1× play/pause, whole-session seek, UTC timestamp and replay state; no speed controls  |

The three vertical resize handles are 5 px wide. The workspace ends at `y=1026`; the remaining 54 px is the playback row. The shared Activity master is 1047 × 210 with 10 px labels and BTCUSDT demo positions.

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
| DOM separator     | last price and best ask-minus-bid spread               | n/a                      | stable boundary between asks and bids               | falls back to `0.00` only without a book   |
| Buy/Sell          | Buy default                                            | semantic hover           | active side changes submit label/color              | submit disabled for invalid quantity/price |
| Activity tabs     | Positions default                                      | raised surface           | tab body and counts change                          | n/a                                        |
| Settings          | closed                                                 | trigger focus            | modal overlay with close/Escape                     | n/a                                        |

## Data provenance boundary

- Real market data: BTCUSDT last price, OHLC, volume, footprint, delta, CVD, VWAP, EMA, profiles, DOM and Time & Sales.
- Fixtures: buying power, positions/orders/fills, PnL, fees, execution narrative and non-BTC watchlist instruments. Fixture surfaces are labelled `SIM`, `DEMO` or `DEMO DATA` and must not be presented as live market feeds.
- Historical clock: UTC session 2019-12-01; every market module resolves from that clock for fixed 1× playback, pause and seek.
