---
status: current
last_verified: 2026-09-01
owners: product-design-engineering
scope: local
---

# Umami product events - local verification

## Scope

The shared deferred Umami script remains in `index.html`. This verification covers the new custom
events emitted from `src/services/analytics.js` and confirms that no market data or continuous
interaction is added to the analytics payload.

## Event contract

| Event                 | Trigger                                       | Data                       |
| --------------------- | --------------------------------------------- | -------------------------- |
| `open_demo`           | Landing CTA in header, hero, or footer        | `placement`                |
| `select_hero_mode`    | Manual selection in the hero replay           | `mode`                     |
| `select_demo_mode`    | Manual change of the terminal chart mode      | `mode`, `previous_mode`    |
| `change_demo_setting` | Confirmed chart, DOM, or Time & Sales setting | `area`, `setting`, `value` |

The liquidity intensity slider emits `change_demo_setting` only on pointer release or keyboard
adjustment. It does not send an event for every intermediate slider value.

## Local evidence

- `node scripts/check-docs.mjs`: passed (`20 required files`).
- ESLint: passed.
- `node --test tests/*.test.js`: passed (`20/20`), including the tracker-safe helper tests.
- `COREPACK_HOME=/tmp/apex-trader-corepack pnpm --config.verify-deps-before-run=false run build`:
  passed for Vite and Storybook.
- In a Chromium browser against `http://127.0.0.1:5173`, Umami returned HTTP 200 for:
  - `select_hero_mode` with `{ "mode": "footprint" }`.
  - `open_demo` with `{ "placement": "header" }`, followed by navigation to `/demo`.
  - `select_demo_mode` with `{ "mode": "footprint", "previous_mode": "candles" }`, followed
    by the SPA pageview for `/demo/footprint`.

The browser payloads contained only the documented event data plus Umami's standard page context.
No prices, trade sizes, cursor coordinates, pan/zoom movement, or replay ticks were added by this
instrumentation.
