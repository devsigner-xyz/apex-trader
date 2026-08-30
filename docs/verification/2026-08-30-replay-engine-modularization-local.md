---
status: current
last_verified: 2026-08-30
owners: product-engineering
---

# Historical replay engine modularization · local

## Alcance

Refactorización exclusivamente estructural del replay histórico profesional. No cambia datos,
cálculos, política de red, rutas, reloj, buffering, DOM, ARIA, persistencia, SVG, CSS, diseño ni
contratos de Figma. No se modificaron `useProfessionalPlayback`, sus consumidores, los datasets o
manifests Tardis v3, los E2E ni la configuración de Playwright. Dos snapshots obsoletos se
sincronizaron con cambios visuales ya presentes y publicados en `HEAD`; ningún código visual cambió
en esta refactorización.

No se realizaron commits, push, despliegues, acciones en Railway ni comprobaciones de producción.

## Arquitectura resultante

`src/services/proPlayback.js` permanece como la única fachada consumida por el producto y conserva
exactamente sus quince exports anteriores. La implementación se divide bajo `src/services/replay/`:

- `runtimeManifest.js`: URLs, validación del manifest, assets versionados, gzip y carga de sesión.
- `playbackChunks.js`: índice temporal, deduplicación y ciclo de vida de book/trades y liquidez.
- `professionalView.js`: reloj puro, L2, Time & Sales, barra parcial, agregación, volume profile,
  countdown y derivación de la vista profesional.

Las dependencias son unidireccionales. `professionalView.js` no tiene imports; `playbackChunks.js`
depende de `runtimeManifest.js`; y ninguno de los módulos internos importa la fachada. El hook
`useProfessionalPlayback` sigue siendo el único propietario del reloj histórico, `view`, última
vista válida, buffering, pausa, seek y recuperación.

## Contratos preservados

- Manifest, sesión y chunks mantienen los mismos paths y schemas. Un manifest anterior sin asset
  de liquidez sigue cargando el replay principal y falla únicamente dentro de la capa opcional.
- Las promesas globales de manifest, book/trades y liquidez se deduplican; una promesa rechazada se
  elimina para permitir una carga posterior.
- `fetchHistoricalAsset` conserva tres intentos totales y esperas inyectables de 100 y 200 ms.
  Solo reintenta `TypeError`, `NetworkError`, `TimeoutError`, HTTP 408, 429 y 5xx. `AbortError`,
  otros 4xx, schemas inválidos y payloads corruptos permanecen terminales.
- Cache Storage, su escritura y eviction, prefetch y liquidez siguen siendo best-effort y no
  convierten una respuesta histórica válida en error fatal.
- Los cortes temporales continúan inclusivos en el mismo instante para L2, trades y barra parcial.
  Los empates conservan POC inferior y expansión superior de la value area.
- La fachada, sus consumidores y `tests/proPlayback.test.js` continúan operando sin cambiar imports.

## Tests directos y cobertura

- `runtimeManifest.test.js` prueba directamente helpers, campos requeridos, assets con/sin
  liquidez, sesión comprimida, deduplicación global y limpieza tras rechazo.
- `playbackChunks.test.js` prueba directamente límites de índice, book/trades, liquidez,
  deduplicación, reuse tras éxito y eviction tras rechazo.
- `professionalView.test.js` prueba directamente reloj, book, trades, agregación, profile,
  countdown y vistas parciales, incluidos límites, empates y ausencia de look-ahead.
- `proPlaybackFacade.test.js` fija el conjunto exacto de quince exports y su identidad con los
  módulos internos.
- `historicalAssetCache.test.js` demuestra explícitamente la matriz 408/429/500/599,
  `NetworkError`, 400/499 y error de aplicación, además de los contratos previos.

La suite pasó de 14 a 18 archivos. `pnpm run test:coverage` registra 97,92% de líneas, 84,93% de
ramas y 97,33% de funciones en el conjunto medido; la línea base previa era 95,29%, 76,69% y
93,33%. `pnpm run test:coverage:replay` impone y acredita 100% de líneas, ramas y funciones sobre
`professionalView.js`, el límite puro extraído.

## Gates locales

- `git diff --check`: pass.
- `pnpm run check:docs`: pass.
- `pnpm run lint`: pass.
- `pnpm run test:unit`: 18/18 archivos pass.
- `pnpm run test:coverage`: pass; 97,92% líneas, 84,93% ramas y 97,33% funciones.
- `pnpm run test:coverage:replay`: pass; 100% líneas, ramas y funciones.
- `pnpm run build`: Vite y Storybook pass. Vite produjo CSS 41,69 kB, DemoPage 81,45 kB e
  index JS 155,45 kB antes de gzip.
- `NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 TMPDIR=/tmp pnpm run test:visual`:
  7/7 pass en la repetición estricta, sin modo update.
- `NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 TMPDIR=/tmp pnpm run test:e2e
  --workers=1`: 126/126 pass en 11,6 minutos, con un worker y cero retries.

## Incidencias del entorno

El primer intento visual no pudo iniciar el web server dentro del sandbox (`webServer` terminó con
código 1); el mismo comando pasó al permitir el binding local, sin tocar la configuración. Un
primer intento E2E recibió por error un separador adicional y ejecutó `playwright test --
--workers=1`, por lo que Playwright ignoró el límite, lanzó 16 workers y la ejecución fue
interrumpida por saturación. La repetición correcta usó `playwright test --workers=1` y aprobó los
126 casos sin retries ni cambios de timeout o assertions.

La ejecución visual explícita encontró que `chart-settings-open` y `landing-desktop` aún databan de
`6c6e2fa`, anterior al layout de intensidad de `5a1c28e` y a la navegación pública de Components.
La comparación mostraba exactamente esas dos diferencias ya publicadas y ningún cambio de replay.
Se regeneraron solo esos dos PNG contra el `HEAD` actual; los otros cinco permanecieron intactos y
la repetición estricta posterior aprobó 7/7 con diferencia cero.

## Auditoría de alcance

El conjunto atribuible a esta tarea queda limitado a la fachada, los tres módulos internos, tests
directos, el script de cobertura, esta evidencia, su enlace y los dos baselines reconciliados. No
hay cambios atribuibles al replay en `public/data`, manifests, assets, `src/styles`, JSX, hooks, E2E
ni los otros cinco snapshots. Durante la ejecución aparecieron además un plan y una verificación de
baseline de landing interactiva, junto con sus líneas en `docs/README.md`; son trabajo concurrente
ajeno y se preservaron sin editar. Esta evidencia es local y fechada; no acredita publicación ni
producción.
