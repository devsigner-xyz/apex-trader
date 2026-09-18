---
status: current
last_verified: 2026-09-18
owners: product-design-engineering
scope: local
---

# Umami tracking migration - local verification

## Migration

The deferred Umami script in `index.html` now targets the `Projects Analytics`
Railway instance:

- Script: `https://umami-production-7314.up.railway.app/script.js`
- Website ID: `a167d552-de15-4556-8e62-92390a8692b2`

The professional-terminal E2E mock uses the same script URL, so the test suite
does not depend on the external analytics service.

## Event contract reviewed

| Event | Trigger | Data |
| --- | --- | --- |
| `open_demo` | Landing CTA in the header, hero, or footer | `placement` |
| `select_hero_mode` | Manual hero replay mode selection | `mode` |
| `select_demo_mode` | Manual terminal chart mode change | `mode`, `previous_mode` |
| `change_demo_setting` | Confirmed chart, DOM, or Time & Sales setting | `area`, `setting`, `value` |
| `ask_ai` | AI provider action from the landing | `context`, `provider` |

The reviewed events do not include prices, trade sizes, ticks, cursor
coordinates, pan/zoom movement, prompt contents, or continuous replay updates.
Liquidity intensity is emitted only when the control change is committed, not
for every intermediate slider value. `src/services/analytics.js` remains
defensive when Umami is unavailable or fails.

## Verification scope

- Confirmed there is no remaining reference to the previous Umami host or
  website ID in the application and E2E sources.
- Confirmed the event call sites remain limited to the documented product
  intent actions.
- Local automated checks are run as part of this change; no Railway deployment
  or production browser verification is implied by this document.
