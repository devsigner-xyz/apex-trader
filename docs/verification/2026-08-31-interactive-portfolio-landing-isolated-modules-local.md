---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing · isolated modules local verification

## Alcance

Esta evidencia cubre la revisión R2 local de la landing sobre el base commit
`c3a1fe97621fa530987c2da6123b966f25f9b837`. No demuestra todavía commit, push, Railway ni estado de
producción; la verificación pública se documentará por separado después del release.

R1 y el prototipo sticky con `MarketChart` se conservan como evidencia histórica del proceso, pero
se retiraron completamente del runtime actual.

## Figma

- Root R2: `688:21215` · `Interactive portfolio landing / Isolated modules R2`.
- Filas: Candles `688:21217`, Footprint `688:21218`, Step Profile `688:21219`, Volume Profile
  `688:21220`, DOM `688:21221` y Last Trades `688:21222`.
- R1 `656:7413`, `656:7414`, `656:7415`, Direction B y masters existentes permanecen intactos.
- Captura local ignorada por Git:
  `output/figma/interactive-landing-isolated-modules-r2.png` (1440 × 2600).

## Contrato React verificado

- La sección contiene seis `.landing-primitive` y cero `.market-chart`.
- Candles renderiza cinco grupos OHLC; cuatro fixtures cerrados son estables y la quinta vela cambia
  high, low y close.
- Footprint y Step Profile renderizan exactamente una barra cada uno mediante las capas reales del
  chart profesional.
- Volume Profile reutiliza `deriveSessionProfileBarGeometry`, nueve niveles y líneas POC/VAH/VAL;
  no muestra candles ni controles.
- `CompactDom` reutiliza las filas profesionales y limita el DOM a 3 asks + last + 3 bids.
- `CompactTimeSales` reutiliza formato y filas profesionales y limita el stream a tres trades.
- Las escenas comparten un fixture puro y cuatro fases deterministas. Un único intervalo de 1,4 s
  funciona solo cerca del viewport y con la pestaña visible. Reduced motion fija la fase 0.
- El módulo se carga mediante `React.lazy` e `IntersectionObserver`.
- `/` no inicializa replay, no solicita `/data/tardis/**` y no lee ni escribe preferencias del chart.

## Bundle

`pnpm run build` produjo:

| Artefacto                              |       Raw |     Gzip |
| -------------------------------------- | --------: | -------: |
| `MarketPrimitivesShowcase-a0241a41.js` |   8.87 kB |  3.56 kB |
| `TimeSales-2f93afed.js`                |  27.97 kB |  9.22 kB |
| `DemoPage-09601bc5.js`                 |  56.43 kB | 19.73 kB |
| `index-06d0549f.js`                    | 154.21 kB | 49.36 kB |
| `index-af8cf21b.css`                   |  43.48 kB |  8.66 kB |

La escena lazy no arrastra `MarketChart` ni el replay completo. `DemoPage` continúa separado.

## Verificación ejecutada

```bash
pnpm run lint
pnpm run test:unit
pnpm run build
git diff --check
pnpm exec playwright test e2e/landing.spec.js
pnpm exec playwright test e2e/professional-terminal-modes.spec.js \
  e2e/professional-terminal-panels.spec.js e2e/accessibility-focus.spec.js \
  --project=chromium
```

Resultados:

- ESLint: aprobado.
- Unit: 19/19 archivos; incluye `tests/marketPrimitiveFixtures.test.js`.
- Build: Vite y Storybook aprobados.
- `git diff --check`: aprobado.
- Landing: 18/18 efectivos en Chromium, Firefox y WebKit. La primera ejecución WebKit heredó el
  proxy del host; se repitió con `NO_PROXY=localhost,127.0.0.1`, `no_proxy` equivalente y
  `TMPDIR=/tmp`, con 6/6.
- Regresión `/demo`: 10/10 efectivos en Chromium. Dos casos largos excedieron el timeout al competir
  en la primera ejecución paralela; la suite de modos se repitió en serie sin aumentar timeouts y
  aprobó 3/3.
- Consola y errores de página durante la escena interactiva: 0.
- Requests históricos en `/`: 0.
- Imágenes de runtime verificadas: 2/2.
- Capturas locales ignoradas por Git:
  - `output/playwright/interactive-landing-isolated-desktop.png` · 1440 × 7127.
  - `output/playwright/interactive-landing-isolated-mobile-390.png` · 390 × 8250.

La inspección visual confirmó que los módulos no incluyen chrome del terminal, mantienen jerarquía
de dos columnas en desktop y pasan a una columna legible a 390 px sin overflow horizontal.

## Gate

Todos los gates locales están aprobados. Esta evidencia todavía no prueba el release: Railway debe
alcanzar `SUCCESS` con el commit exacto y la web pública debe verificarse antes de cerrar el plan.
