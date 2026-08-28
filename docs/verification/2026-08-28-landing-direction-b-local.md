---
title: Direction B landing and demo routing — local verification
status: current
last_verified: 2026-08-28
owners: product-design-engineering
---

# Direction B landing and demo routing — local verification

This record covers the local implementation of the public Apex Trader landing and the canonical demo routes. It does not claim a commit, deployment, DNS change, or production verification.

## Scope

- Landing at `/`, based on the current Figma Direction B roots `609:7459` (desktop) and `621:7636` (mobile).
- Canonical demo routes at `/demo`, `/demo/footprint`, and `/demo/step-profile`.
- Client-side replacement of legacy routes `/price-chart`, `/footprint`, and `/step-profile` with their canonical demo equivalents.
- Client-side replacement of unknown paths with `/`.
- A lazy demo boundary so the landing does not import or initialize terminal playback, the trading state provider, or Tardis session data.
- Eight product images exported from the approved Figma design context and committed under `public/media/`.

## Local evidence

- The landing has one `h1`, semantic sections, visible keyboard focus, a skip link, real links to `/demo`, and anchor navigation for `#modes`, `#session`, and `#workspace`.
- The published facts are limited to three chart modes, one synchronized clock, a 24-hour BTCUSDT session, and 420,562 real trades.
- Landing browser coverage verifies the primary CTA, legacy and unknown-path canonicalization, image loading, absence of Tardis requests, absence of browser-console errors, mobile horizontal containment, and reduced-motion behavior.
- Existing terminal browser coverage verifies canonical chart-mode routing while retaining the observable terminal contracts.

## Verification results

The final implementation was checked locally on 2026-08-28 with:

- `pnpm run check:docs`
- `pnpm run lint`
- `pnpm run test:unit`
- `pnpm run build`
- `pnpm exec playwright test e2e/landing.spec.js` — 15 tests across Chromium, Firefox, and WebKit.
- `pnpm exec playwright test e2e/professional-terminal.spec.js e2e/orderbook.spec.js --project=chromium` — 21 Chromium regression tests.

## Publication boundary

This record only asserts local validation. Production behavior at `https://apex.devsigner.xyz/` and Railway deployment state are verified separately and must not be inferred from this file.
