---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R7 · panel settings and unframed modules

## Alcance y frontera

Esta verificación cubre la revisión local de Market primitives que se publicará junto con R6. La
evidencia de producción se documentará por separado después de exigir el commit exacto y estado
`SUCCESS` en Railway.

## Contrato a comprobar

- Las seis filas y sus marcos visuales son transparentes, sin borde, radio ni sombra de card.
- Compact DOM está centrado, ocupa hasta 500 px y muestra context header, cabeceras de columna,
  tres asks, last y tres bids sin truncar cifras.
- El settings del DOM cambia el price grouping y actualiza metadata y niveles agregados.
- Compact Time & Sales muestra context header, cabeceras de columna y tres ejecuciones con All
  trades; settings filtra por buy o sell.
- Ambos popovers exponen dialog y relaciones ARIA, cierran con Escape y devuelven foco al trigger.
- Los dos paneles mantienen su superficie de producto; no reaparece un wrapper editorial alrededor.
- Mobile 390 no introduce overflow horizontal y reduced motion conserva una escena legible.

## Evidencia visual y medidas

- Desktop 1440 × 1000: DOM mide 500 px dentro de un visual de 560 px, con desviación de centro 0
  y 0 celdas cuyo `scrollWidth` supere su `clientWidth`.
- Mobile 390 × 844: DOM ocupa los 342 px disponibles, mantiene 0 celdas truncadas y el documento
  conserva diferencia `scrollWidth - clientWidth = 0`.
- El popover de DOM queda contenido en el panel móvil y no tapa last/spread ni los tres bids.
- La consola inspeccionada no registra errores ni warnings de aplicación.

Evidencia visual local ignorada por Git:

- `output/playwright/r7-local/dom-desktop.png`
- `output/playwright/r7-local/trades-desktop.png`
- `output/playwright/r7-local/dom-mobile.png`
- `output/playwright/r7-local/dom-settings-mobile.png`

## Gates

| Comando                                                                                         | Resultado |
| ----------------------------------------------------------------------------------------------- | --------- |
| `git diff --check`                                                                              | OK        |
| `pnpm run check:docs`                                                                           | OK        |
| `pnpm run lint`                                                                                 | OK        |
| `pnpm run test:unit`                                                                            | 19/19     |
| `pnpm run build`                                                                                | OK        |
| `pnpm exec playwright test e2e/landing.spec.js`                                                 | 21/21     |
| `pnpm exec playwright test e2e/orderbook.spec.js --project=chromium --grep "groups…\|filters…"` | 2/2       |

La suite de landing pasa en Chromium, Firefox y WebKit. WebKit se ejecutó con
`NO_PROXY=localhost,127.0.0.1`, `no_proxy=localhost,127.0.0.1` y `TMPDIR=/tmp` por la restricción
local de proxy/socket en WSL. El build conserva únicamente los avisos conocidos de `eval` del
runtime de Storybook.

## Gap Figma

R7 no modifica Figma. La referencia R2 `688:21215` sigue siendo el contrato aprobado anterior; la
composición unframed completa y los headers/settings compactos quedan como gap explícito hasta una
sincronización futura que preserve masters e IDs.
