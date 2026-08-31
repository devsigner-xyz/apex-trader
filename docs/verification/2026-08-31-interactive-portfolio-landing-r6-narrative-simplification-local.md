---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R6 · narrative simplification

## Alcance y frontera

Esta verificación cubre la eliminación local de `The blind spot` y su comparación estática
OHLC/Volume at Price. No se ha hecho commit, push ni despliegue; producción continúa sirviendo R5.

## Contrato comprobado

- No existen `#blind-spot`, el heading `Four prices are not the whole interval.`, el ledger ni el
  diagrama OHLC/Volume at Price en el DOM.
- `Explore market primitives` enlaza directamente a `#modes` y aterriza en el inicio de la sección.
- Las secciones se numeran Market primitives 01, One clock 02, Session evidence 03 y The workspace
  04.
- Se eliminan el fixture `evidence` y todos los selectores `landing-evidence-*` y
  `landing-volume-diagram*`; no quedan referencias ejecutables huérfanas.
- Desktop 1440 × 1000 y mobile 390 × 844 conservan ritmo, jerarquía y cero overflow horizontal.
- La consola local registra 0 errores y 0 warnings.

Evidencia visual local ignorada por Git:

- `output/playwright/r6-local/modes-desktop.png`
- `output/playwright/r6-local/modes-mobile.png`

## Gates

| Comando                                         | Resultado |
| ----------------------------------------------- | --------- |
| `git diff --check`                              | OK        |
| `pnpm run check:docs`                           | OK        |
| `pnpm run lint`                                 | OK        |
| `pnpm run test:unit`                            | 19/19     |
| `pnpm run build`                                | OK        |
| `pnpm exec playwright test e2e/landing.spec.js` | 21/21     |

La suite E2E pasó en Chromium, Firefox y WebKit. El build conserva únicamente los avisos conocidos
de `eval` del runtime de Storybook.

## Gap Figma

La referencia Figma anterior conserva `The blind spot`. R6 todavía no se ha sincronizado con el
archivo maestro y no se declara paridad Figma/código.
