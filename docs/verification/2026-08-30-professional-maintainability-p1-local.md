---
status: current
last_verified: 2026-08-30
owners: product-design-engineering
---

# Professional frontend maintainability P1 · local

## Alcance

Refactorización estrictamente estructural del frontend profesional. No modifica datos, rutas,
persistencia, reloj histórico, replay, geometría compartida, diseño, CSS ejecutable ni contrato de
Figma. No se realizaron escrituras en Figma, commits, push, PR, Railway ni despliegues.

## Contratos preservados

- `MarketChart` conserva el estado React, viewport, escala de precio, sincronización de eventos y
  listener nativo de `wheel`; los bloques de summary, controles, settings y superficie visual se
  separan sin añadir wrappers observables. El SVG sigue siendo hijo directo de
  `.price-chart-panel` y mantiene sus atributos `data-*`, ARIA, foco y captura de puntero.
- La geometría continúa centralizada en `professionalChartGeometry.js`: el eje temporal de capas,
  profile, crosshair, hit-testing y Volume Panel procede de la misma escala. Profile, POC, VAH y
  VAL se calculan sólo con barras analíticas visibles, no con overscan.
- `professional-terminal.spec.js` se sustituyó por specs independientes para modos, Markets,
  viewport, controles históricos, workspace, panels y responsive, con un helper compartido y sin
  dependencia de orden, sleeps, retries adicionales, `skip` ni `fixme`.
- `professional.css` es un entrypoint de trece módulos en el orden literal previo. Concatenarlos
  produce 1.631 líneas y el SHA-256
  `4777286671a7963f6d92ab0adca7fe531d65d662d5e3c131db01d67c5cfefe64`, idéntico al original.

## Cobertura y regresión visual

- `pnpm run test:coverage` mide por fichero la cobertura nativa de Node 24 para `src/services`,
  `src/hooks` y el módulo puro extraído. `pnpm run test:coverage:chart` impone 100% de líneas,
  ramas y funciones a `marketChartPresentation.js`.
- El reportador nativo de Node 24 no expone un porcentaje ni umbral distinto de *statements*;
  reporta líneas, ramas y funciones. El módulo extraído mantiene una sentencia ejecutable por
  línea cubierta y sus tests verifican resultados e invariantes, no sólo ejecución.
- `pnpm run test:visual` ejecuta sólo Chromium y siete snapshots versionados con viewport,
  reduced motion, fuentes y reloj de replay fijados: inicial Candles, Footprint y Step Profile,
  settings abiertos, Volume Panel redimensionado, landing desktop y landing 390×844. No usa
  máscaras ni tolerancia de píxeles.

## Línea base y gates locales

- Base antes de integrar: árbol limpio; `check:docs`, lint, 13 unit tests y build correctos. Build
  Vite 4.3.9: HTML 1.88 kB, CSS 41.44 kB (gzip 8.34 kB), DemoPage 77.95 kB (gzip 25.98 kB) e
  index JS 155.39 kB (gzip 49.48 kB).
- El primer E2E completo pasó Chromium y Firefox, pero WebKit no resolvía `localhost` por el proxy
  del entorno. La ejecución local debe usar exclusivamente
  `NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 TMPDIR=/tmp`; no se modificaron los
  timeouts ni retries del proyecto.
- Árbol integrado: `git diff --check`, `pnpm run check:docs`, lint y 14/14 unit tests pasan.
  `pnpm run test:coverage` registra 95.28% líneas, 76.64% ramas y 93.29% funciones en el
  conjunto medido de services/hooks, sin regresión en módulos modificados; el módulo nuevo pasa
  `test:coverage:chart` con 100% líneas, ramas y funciones exigidos.
- Build integrado: Vite 4.3.9 genera CSS 41.44 kB (gzip 8.34 kB), DemoPage 80.66 kB (gzip
  26.86 kB) e index JS 155.39 kB (gzip 49.48 kB). El CSS conserva su hash de salida previo.
- `pnpm run test:visual`: 7/7 Chromium pass en 10.8 s, con diferencia máxima cero. Los baselines
  de Footprint y Volume Panel se regeneraron una vez después de detectar y corregir una extracción
  que producía celdas SVG `NaN`; la comparación posterior es estricta.
- E2E focalizada de los siete specs nuevos: 57/57 pass en Chromium, Firefox y WebKit en 5.9 min.
  Suite completa: 125 casos pass en 10.0 min y un único caso Firefox marcado flaky: `core replay
  survives a pre-heatmap manifest and Cache API write failure` agotó su primer intento por una
  carrera de `route.fetch()` y pasó en el reintento ya solicitado por el comando de línea base.
  No se modificaron el test, su assertion, timeout ni la configuración de retries.

Esta evidencia es local y fechada; no acredita publicación ni producción.
