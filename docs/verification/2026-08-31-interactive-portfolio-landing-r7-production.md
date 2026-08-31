---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R6/R7 · production verification

## Release funcional

- Rama: `master`.
- Commit: `3b625f9095bdfddfd4b242692f5724756ad5418b`.
- Mensaje: `feat: refine landing market primitives`.
- Railway project: `13bffae0-3a6e-4d62-ae53-2b54d433ced9` (`apex-trader`).
- Environment: `3f049efd-d83e-485d-b2b0-12236272cf74` (`production`).
- Service: `c8ac903b-a7e3-46c0-85f5-6d5d40b934a7` (`apex-trader`).
- Deployment: `966c184c-cd6c-45cf-8d9c-269b734853df`.
- Estado: `SUCCESS`.
- Image digest: `sha256:7c444881a399c95278a4c86d4fd285fbea68d1511e5e5e364f12aa9fc8adcac0`.

## HTTP y bundles

| Recurso                                        | Resultado                                |
| ---------------------------------------------- | ---------------------------------------- |
| `/`                                            | 200 · `text/html` · 1888 B               |
| `/demo`                                        | 200 · `text/html` · 1888 B               |
| `/demo/footprint`                              | 200 · `text/html` · 1888 B               |
| `/demo/step-profile`                           | 200 · `text/html` · 1888 B               |
| `/storybook/`                                  | 200 · `text/html` · 2786 B               |
| `/assets/index-05f023a9.css`                   | 200 · `text/css` · 43711 B                |
| `/assets/MarketPrimitivesShowcase-91ef0a27.js` | 200 · `application/javascript` · 10245 B |

## Navegador público

La comprobación directa con Chromium sobre `https://apex.devsigner.xyz` confirmó:

- no existen `The blind spot` ni el heading `Four prices are not the whole interval.`;
- existen seis filas y las seis eliminan background, borde y shadow tanto en la fila como en el
  marco visual;
- DOM mide 500 px en desktop 1440 × 1000, su desviación respecto al centro es 0 y ninguna cifra
  tiene `scrollWidth > clientWidth`;
- el settings de DOM cambia de 0.25/x1 a 0.50/x2 y actualiza los niveles agregados;
- el settings de Last Trades cambia a `Showing buys`, conserva dos compras visibles y cero ventas;
- mobile 390 × 844 usa los 342 px disponibles, conserva 3 asks + last + 3 bids, cero truncado y
  diferencia `scrollWidth - clientWidth = 0`;
- la consola registra 0 errores y 0 warnings.

Evidencia visual local ignorada por Git:

- `output/playwright/r7-production/dom-desktop.png`
- `output/playwright/r7-production/dom-mobile.png`

## Límite de evidencia

Esta verificación prueba código, deployment funcional, rutas, bundles y comportamiento público
R6/R7. Figma conserva R2 `688:21215` como referencia aprobada y todavía no representa estos ajustes;
no se declara paridad Figma/código.
