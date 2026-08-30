---
status: current
last_verified: 2026-08-30
owners: product-design-engineering
---

# Storybook coverage and chart-feedback production verification

## Release identity

- Code commit: `5a1c28e5680cadb5648a57c24677c9553098dc3a`
  (`feat: expand Storybook coverage and chart hover feedback`).
- Railway project/environment/service: `apex-trader` / `production` / `apex-trader`.
- Railway deployment: `9500415b-d738-4f2e-962b-c1817a2e5c7d`.
- Railway result: `SUCCESS`; its deployment metadata reports the exact code commit above.

## Public verification

- [Apex Trader home](https://apex.devsigner.xyz/) and the published
  [Storybook](https://apex.devsigner.xyz/storybook/) returned HTTP 200; the preview document at
  `/storybook/iframe.html` also returned HTTP 200.
- In the production terminal, moving the pointer through the price plot renders the dotted
  crosshair and a rounded price tag on the price axis.
- In production Chart Settings, the `INTENSITY` label and percentage occupy the first row and the
  liquidity-heatmap range input occupies a separate full-width row, avoiding label overlap.

## Boundary

This document records production behaviour for the release above. Local coverage for the expanded
Storybook stories and broader validation remains in
`2026-08-30-storybook-coverage-local.md`.
