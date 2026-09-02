---
status: current
last_verified: 2026-08-29
owners: product-design-engineering
---

# Retirada de la terminal legacy · verificación local

## Alcance

Registro de la limpieza de la terminal anterior y de sus módulos, tests, CSS, datos, scripts y
dependencias exclusivos. El comportamiento visible, el dataset v3 y el reloj compartido de la
terminal profesional quedan fuera del alcance de cambio.

## Baseline previa

- Working tree con cambios preexistentes del usuario en heatmap, viewport, E2E y documentación;
  esta limpieza no los revierte ni reformatea.
- `src/styles/components.css`: 1.403 LOC y 27.993 bytes; 1.380 LOC demostradas como exclusivamente
  legacy. La regla efectiva `.market-row { min-width: 0; }` se preserva.
- Datos OHCLVT: 4.746.552 bytes.
- Replay Tardis v1 (`binance-btcusdt-2019-12-01.json` y `manifest.json`): 744.018 bytes.
- `scripts/tardis-ingest.mjs`: 453 LOC y 16.519 bytes.
- Tests completamente legacy identificados: 348 LOC, más las pruebas parciales de transforms que
  no cubren `createFixedChartSlots`.
- Runtime activo: `manifest-v3.json`, dataset `v3-d74b9a46afb5d92a`, 288 barras y 96 chunks de book,
  trades y liquidez. Se comprobaron 290 assets referenciados sin ausencias.

## Manifiesto de limpieza aprobado

| Elemento | Evidencia | Riesgo y validación |
| --- | --- | --- |
| Árbol de terminal legacy | No alcanzable desde `src/main.jsx`; conservar módulos compartidos | Grafo de imports posterior, unit y build |
| Tests exclusivos legacy | Importan únicamente servicios retirados | Suite unitaria completa; conservar contratos activos |
| `public/data/OHCLVT/**` | Sin consumidor activo; el único loader estaba en el árbol anterior | Ausencia de requests y rutas activas |
| Tardis v1 y `manifest.json` | Solo consumidos por playback v1 retirado | Manifest v3, session v2 y chunks siguen cargando |
| `scripts/tardis-ingest.mjs` | No está en scripts del paquete y solo genera artifacts v1 | Conservar v2, `tardis-core` y generador de tiles |
| `src/styles/components.css` legacy | Selectores asociados al árbol anterior | Preservar `.market-row`; comparar UI y estilos computados |
| Dependencias directas huérfanas | Retirar solo después del último consumidor | Lockfile focalizado, auditoría y bundle |

## Archivos del cambio

Archivos eliminados:

- Terminal legacy: `src/components/Grid.jsx`, `AssetIcon.jsx`, `Change.jsx`, `Chart.jsx`,
  `ChartModeToggle.jsx`, `ChartTimeframeSelector.jsx`, `CvdPanel.jsx`, `DepthChart.jsx`,
  `Favorite.jsx`, `FootprintChart.jsx`, `FootprintInspector.jsx`, `Operative.jsx`,
  `OrderManagement.jsx`, `Orderbook.jsx`, `PairSelector.jsx`, `PlaybackControls.jsx`, `Price.jsx`,
  `PriceChartControls.jsx`, `Settings.jsx`, `Topbar.jsx` y `Trades.jsx`.
- Estado, datos y servicios legacy: `src/app/tradingState.jsx`, `src/data/markets.js`,
  `src/data/orderbook.js`, `src/data/trades.js`, `src/helpers/helpers.js`,
  `src/hooks/useTardisPlayback.js`, `src/services/chartAggregation.js`, `chartColors.js`,
  `demoOrderFlow.js`, `orderFlowAnalytics.js`, `priceChartData.js` y `tardisPlayback.js`.
- Tests exclusivos: `tests/chart.test.js`, `demoOrderFlow.test.js`,
  `orderFlowAnalytics.test.js` y `tardisPlayback.test.js`.
- Pipeline y datos: `scripts/tardis-ingest.mjs`, los tres CSV bajo
  `public/data/OHCLVT/XBTUSD/`, `public/data/tardis/binance-btcusdt-2019-12-01.json` y
  `public/data/tardis/manifest.json`.

Archivos modificados por esta limpieza:

- Código y tests compartidos: `src/services/chartTransforms.js`,
  `src/services/footprintPresentation.js`, `src/styles/components.css`,
  `tests/chartTransforms.test.js`, `tests/footprintPresentation.test.js` y
  `e2e/orderbook.spec.js`.
- Dependencias: `package.json` y `pnpm-lock.yaml`.
- Documentación: `docs/decisions/README.md`,
  `docs/decisions/0009-retirada-arquitectura-terminal-legacy.md`,
  `docs/plans/react-migration.md`, `docs/product/landing-and-routing.md` y este informe.

## Reducción final

- 43 archivos eliminados y 84.993 líneas físicas retiradas, incluidas 80.338 líneas de datos.
- Código `src/`: 3.854 LOC de módulos eliminados más 143 LOC retiradas de servicios compartidos;
  `chartTransforms.js` conserva `createFixedChartSlots` y `footprintPresentation.js` conserva los
  exports usados por Footprint y Step Profile.
- Tests: 348 LOC eliminadas con cuatro suites exclusivas y 58 LOC netas retiradas de las dos
  suites mixtas conservadas.
- Pipeline y CSS: 453 LOC del ingestor v1; `components.css` pasa de 1.403 a 4 LOC, con la regla
  activa `.market-row { min-width: 0; }` intacta.
- Datos legacy: 5.490.570 bytes / 5,236 MiB. El conjunto de 43 archivos eliminados suma
  5.558.707 bytes / 5,301 MiB.
- Dependencias directas: 17 → 12. Se retiran `chart.js`, `path`, `highcharts`,
  `lightweight-charts` y `cryptocurrency-icons`; `@vitejs/plugin-react` conserva `^4.3.4` y pasa a
  `devDependencies`. El lockfile cambia de forma focalizada: 3 inserciones y 79 eliminaciones.
- Grafo de imports: 68 módulos, 35 alcanzables y 33 no alcanzables → 35/35 alcanzables, cero
  huérfanos y cero imports locales sin resolver.
- Bundle JS + CSS: 296.426 → 272.602 bytes raw y aproximadamente 86,60 → 83,05 kB gzip. El JS no
  cambia materialmente; CSS baja 64,18 → 40,35 kB raw. Los sourcemaps no contienen Chart.js,
  Highcharts, Lightweight Charts ni Cryptocurrency Icons.
- Auditoría de producción: 33 vulnerabilidades (13 high, 17 moderate, 3 low) → 6 (4 high,
  1 moderate, 1 low), todas bajo `serve`. La auditoría completa permanece en 41 (17 high,
  21 moderate, 3 low); actualizar Vite/ESLint queda fuera de alcance. No hay críticas.

## Gates finales

- `git diff --check` - correcto; Git solo avisa de normalización futura CRLF → LF en tres archivos.
- `pnpm run check:docs` - correcto, 20 archivos requeridos.
- `pnpm run lint` - correcto.
- `pnpm run test:unit` - correcto, 12/12.
- `pnpm run build` - correcto con Vite 4.3.9, 1.862 módulos transformados.
- Regresión focalizada del contrato de timeframe - 3/3 en Chromium, Firefox y WebKit. El test
  conserva la densidad de 34 slots y espera 24 barras reales al reservar el 30% de espacio futuro;
  no modifica el viewport ni el comportamiento profesional.
- `pnpm run test:e2e --workers=1 --retries=1` - correcto, 96/96 en Chromium, Firefox y WebKit en
  8,6 minutos. Todos pasaron en primera instancia; el retry configurado no se utilizó.

La ejecución paralela por defecto satura este host y WebKit hereda variables proxy vacías como un
proxy inválido. La evidencia final usa un worker y elimina esas variables del entorno sin cambiar
configuración, timeouts, aserciones ni código de producto. La matriz cubre rutas, DOM, Time & Sales,
reloj compartido, heatmap, Candles, Footprint, Step Profile, drag, zoom, geometría y persistencia.

## Elementos conservados y riesgos residuales

- `src/services/chartTransforms.js` conserva `createFixedChartSlots`; la geometría profesional lo
  consume y su test permanece verde.
- `src/services/footprintPresentation.js` conserva `deriveFootprintBar` y
  `formatFootprintVolume`, compartidos por Footprint y Step Profile.
- `manifest-v3.json`, el dataset `v3-d74b9a46afb5d92a`, `proPlayback`, `tardis-core.mjs`, el
  generador de tiles y los aliases públicos siguen activos y cubiertos.
- `components.css` permanece con cuatro líneas porque `.market-row { min-width: 0; }` todavía evita
  overflow en Watchlist. Ya no contiene bloques de la terminal anterior.
- `serve` se conserva porque el script `start` lo utiliza. Sus seis advisories de producción y los
  advisories de Vite/ESLint requieren una actualización separada fuera de este alcance.
- No queda ningún candidato legacy pendiente por falta de evidencia.

## Publicación

Los gates de este informe son exclusivamente locales. La publicación posterior y su evidencia de
producción se registran por separado en
[2026-08-29-legacy-terminal-cleanup-production.md](2026-08-29-legacy-terminal-cleanup-production.md).
