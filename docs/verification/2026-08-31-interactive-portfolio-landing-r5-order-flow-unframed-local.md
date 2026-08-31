---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R5 · order-flow unframed

## Alcance y frontera

Esta verificación cubre el ajuste local de las escenas aisladas Footprint y Step Profile. No se ha
hecho commit, push ni despliegue; producción continúa sirviendo R3 y el checkout contiene también
los cambios locales R4.

## Contrato comprobado

- La barra cerrada usa `translate(0 6)` y la actual `translate(0 -6)` en ambas escenas: 12 px de
  separación vertical total sin alterar datos, escala o animación.
- Las filas Footprint y Step Profile usan el modificador `landing-primitive--unframed`.
- Fila y visual calculan `box-shadow: none` y borde superior de `0px`; también eliminan surface,
  radio y clipping de card.
- Candles, Volume Profile, DOM y Last Trades conservan su tratamiento visual anterior.
- Desktop mantiene la alternancia de columnas; mobile recupera visual → copy y no introduce
  overflow horizontal.

Evidencia visual local ignorada por Git:

- `output/playwright/order-flow-unframed/footprint-desktop.png`
- `output/playwright/order-flow-unframed/step-profile-desktop.png`
- `output/playwright/order-flow-unframed/footprint-mobile.png`
- `output/playwright/order-flow-unframed/step-profile-mobile.png`

## Gates

| Comando                                         | Resultado |
| ----------------------------------------------- | --------- |
| `git diff --check`                              | OK        |
| `pnpm run check:docs`                           | OK        |
| `pnpm run lint`                                 | OK        |
| `pnpm run test:unit`                            | 19/19     |
| `pnpm run build`                                | OK        |
| `pnpm exec playwright test e2e/landing.spec.js` | 21/21     |

La suite E2E pasó en Chromium, Firefox y WebKit. Las advertencias `NO_COLOR` pertenecen al runner;
el build conserva únicamente los avisos conocidos de `eval` del runtime de Storybook.

## Gap Figma

R5 no está representado todavía en el archivo maestro. R2 continúa siendo la referencia Figma
aprobada y no se declara paridad Figma/código.
