# Apex Trader v2 implementation and verification report

Date: 2026-08-23. Scope: the Apex Trader repository and the explicitly authorized DOM-controls correction in the Apex Trader Figma file.

## Implemented routes and interactions

- `/price-chart`: candles, volume, CVD, session profile, POC/VAH/VAL and historical tape.
- `/footprint`: real bid/ask footprint, delta, imbalances by intensity, volume, CVD and session profile.
- `/step-profile`: interval bid/ask distributions, local POC, high/low spine, volume, CVD and session profile.
- Shared shell: market header, toolbar, watchlist, DOM, execution ticket, Time & Sales, activity blotter, playback dock and settings modal.
- Working controls: mode route transition, real 5/15/30/60-minute aggregation, chart zoom/pan/reset, fixed 1× play/pause, whole-session seek, DOM-price selection, buy/sell, order fields, activity tabs, panel resizing, settings and Escape close. Variable-speed controls were removed from UI and playback state.
- The nonfunctional `LADDER / AUTO / D42 / CUM` row was removed from the web UI and from the existing `Trading/OrderBook` Figma master (`103:59`) without recreating the component.

The detailed Figma mapping is in `docs/figma-implementation-inventory.md`.

## Market-data provenance

Source: free Tardis datasets for Binance Spot `BTCUSDT`, UTC date `2019-12-01`.

| Dataset               | Compressed bytes | SHA-256                                                            | Data rows |
| --------------------- | ---------------: | ------------------------------------------------------------------ | --------: |
| `trades`              |        6,669,039 | `6a6a2bf2cb8a609f8f2ba4b264d6f3bb31dd3c8b39f93644a87f53e83202e258` |   420,562 |
| `incremental_book_L2` |       43,947,405 | `f7daa040dc33fc7328ff8468b198731fd5add90bc8cef434aab86726268e8a34` | 6,486,542 |

Coverage verified from first/last rows: trades `2019-12-01T00:00:03.572Z` through `2019-12-01T23:59:59.868Z`; L2 local timestamps `2019-12-01T00:00:05.045139Z` through `2019-12-01T23:59:59.929296Z`.

L2 reconstruction groups all rows sharing the exact microsecond `local_timestamp`. Pre-snapshot deltas are ignored, every snapshot resets both sides, zero quantities delete levels, and bids/asks are sorted at the consumption boundary. The checked dataset starts with a snapshot, so ignored pre-snapshot rows and later snapshot resets are both zero.

All 420,562 trades are retained. Aggressor buys map to ask volume and sells to bid volume. The active five-minute interval is rebuilt only from executions at or before the shared clock, so no OHLC, footprint or Time & Sales look-ahead remains. Higher selectable intervals merge those real five-minute bars, including bid/ask levels, OHLC, volume, delta, CVD, VWAP, POC and 70% value area; they do not synthesize market data.

## Browser artifacts and frequency

- Base session: 7,376,566 bytes (`session-v2.json`).
- Fragment assets: 192 gzip files (96 trade + 96 L2), 15 minutes each, 38 MiB total.
- Smallest fragment: 27,430 bytes; largest: 520,869 bytes.
- L2 event groups retained: 815,980.
- Browser render cadence: 20 Hz (50 ms). Every L2 event group up to the historical clock is applied before each render; the persisted source is not sampled.
- Local Chromium captures at exact 1920×1080 are under the Git-ignored `output/playwright/` directory for candles, footprint and step profile.

## Verification results

| Gate                                              | Result                                                          |
| ------------------------------------------------- | --------------------------------------------------------------- |
| Raw gzip integrity                                | pass (`gzip -t`)                                                |
| Raw hashes/counts/date bounds                     | pass                                                            |
| Derived fragment gzip integrity                   | pass, 192/192                                                   |
| Deterministic L2/value-area/clock/timeframe tests | pass                                                            |
| Complete unit suite                               | pass, 8 files                                                   |
| ESLint                                            | pass                                                            |
| Vite production build                             | pass; JS 178.39 kB (58.69 kB gzip), CSS 40.34 kB (7.86 kB gzip) |
| `git diff --check`                                | pass (line-ending notices only)                                 |
| Chromium route/console/interaction/keyboard suite | pass, 9/9                                                       |
| Figma comparison                                  | inspected at 1920×1080 for all three target frames              |
| Figma DOM correction                              | pass; master and latest Step instance re-rendered after removal |

## Residual deviations and risks

- Chart geometry is structurally aligned to Figma, but the plotted shapes and numeric scales intentionally differ: Figma shows fictional NQ 09-26 values while the implementation shows real BTCUSDT 2019 data.
- Footprint and Step Profile retain one-cent source levels, but collapse them to available SVG pixels during rendering. The underlying browser artifacts keep maximum source resolution.
- Non-BTC watchlist rows and all account/order/PnL content are explicit `DEMO`/`SIM` fixtures. Only BTCUSDT market surfaces use real data.
- Chromium is the verified visual surface. WebKit could not navigate through the host environment proxy (`Unspecified proxy lookup failure`), so no WebKit visual claim is made.
- The Playwright skill wrapper has CRLF-corrupted shell headers in this environment; validation used the repository's installed Playwright 1.62.1 instead.
