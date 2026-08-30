---
status: current
last_verified: 2026-08-30
owners: product-design-engineering
---

# Storybook production verification

## Release identity

- Code commit: `dfc397596785b4e4bedaba335f42ef95f0bd93f4`
  (`feat: add Apex component library`).
- Railway project/environment/service: `apex-trader` / `production` / `apex-trader`.
- Railway deployment: `118023dc-b0d8-41f7-a718-cb4e86d9d3f9`.
- Railway result: `SUCCESS`; its deployment metadata reports the exact code commit above.

## Public verification

- [Apex Trader home](https://apex.devsigner.xyz/) returned HTTP 200 and exposes the accessible
  primary-navigation link `Components` to `/storybook/`.
- [Component library](https://apex.devsigner.xyz/storybook/) returned HTTP 200 with the Storybook
  manager document.
- The Storybook preview document at `/storybook/iframe.html` returned HTTP 200.
- Browser verification followed the live `Components` link and loaded the interactive
  `Markets / Depth of Market / Default` story with its DOM ladder inside the Storybook canvas.
- The Railway service domain
  [also served the component library](https://apex-trader-production-16ae.up.railway.app/storybook/)
  with HTTP 200.

## Boundary

This document proves the public component-library release named above. It does not replace the
local Storybook, unit or multi-browser E2E evidence recorded in
`2026-08-30-storybook-local.md`.
