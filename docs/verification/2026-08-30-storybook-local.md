---
status: current
last_verified: 2026-08-30
owners: product-design-engineering
---

# Storybook local verification

## Scope

This verification covers the first isolated component library for Apex Trader. It preserves the
integrated terminal as the source of runtime behavior: stories use the executable Apex styles and
local deterministic fixture data, while Playwright continues to cover the full replay-driven
terminal.

## Surface

- `/storybook/` is generated into `dist/storybook` by `pnpm run build:storybook`.
- `pnpm run build` runs Vite first and then creates that static component library, so it is served
  next to the landing in the production static output.
- The home navigation exposes the same-origin `Components` link.
- The initial stories cover chart controls, chart settings, chart summary, watchlist, DOM, order
  ticket and Time & Sales.

## Local gates

- `pnpm run check:docs` passed.
- `pnpm run lint` passed.
- `pnpm run test:unit` passed: 70 tests.
- `pnpm run build` passed: Vite output plus Storybook static output.
- `pnpm exec playwright test e2e/landing.spec.js --workers=1` passed: 15 tests across Chromium,
  Firefox and WebKit.
- A static-server browser check followed the accessible `Components` link from the home to
  `/storybook/` and loaded the interactive `Chart / Controls / Candles` Canvas without console
  errors. Static checks also confirmed `/demo`, legacy SPA fallback and Storybook assets resolve
  through the production server configuration.

## Boundary

This is local evidence only. It does not claim that the component library or its home link is
published until an explicitly authorized release verifies Railway and the public route.
