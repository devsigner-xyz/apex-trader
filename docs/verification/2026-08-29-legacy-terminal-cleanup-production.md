---
status: current
last_verified: 2026-08-29
owners: product-design-engineering
---

# Retirada de la terminal legacy · verificación de producción

## Alcance publicado

Este informe conserva la evidencia de publicación de la limpieza descrita en
[2026-08-29-legacy-terminal-cleanup-local.md](2026-08-29-legacy-terminal-cleanup-local.md),
incluidos los ajustes de viewport, heatmap y pruebas que ya formaban parte del working tree
validado. No se modificaron variables, buckets, dominios ni otros recursos de infraestructura.

## Git y Railway

- Rama publicada: `master`.
- Commit funcional: `11728ba2e4157ebeab17ead3e7ceac5bc94ba4ec` (`feat: finalize chart
  viewport and retire legacy terminal`).
- Push confirmado: `origin/master` avanzó de `c790982` a `11728ba`.
- Proyecto Railway: `13bffae0-3a6e-4d62-ae53-2b54d433ced9` (`apex-trader`).
- Entorno: `3f049efd-d83e-485d-b2b0-12236272cf74` (`production`).
- Servicio: `c8ac903b-a7e3-46c0-85f5-6d5d40b934a7` (`apex-trader`).
- Deployment funcional: `b2a15cf8-755b-4d6d-a1aa-7b6b1fd19e91`, estado `SUCCESS`, con
  `commitHash` exacto `11728ba2e4157ebeab17ead3e7ceac5bc94ba4ec`.
- Build Railway: Node 24.19.0, pnpm 11.22.0, Vite 4.3.9 y 1.862 módulos transformados.

## Verificación HTTP pública

Comprobación directa sobre `https://apex.devsigner.xyz` después de `SUCCESS`:

- `/`, `/demo`, `/demo/footprint` y `/demo/step-profile`: HTTP 200.
- Bundles activos: `/assets/index-6d1e8a7a.js` (155.401 bytes) y
  `/assets/index-31eca8a3.css` (40.351 bytes), ambos HTTP 200.
- `manifest-v3.json`: schema `apextrader.tardis-runtime-manifest/v3`, dataset
  `v3-d74b9a46afb5d92a`, sesión Binance BTCUSDT del 2019-12-01, 288 barras y 96 chunks de
  book, trades y liquidez.
- La session v3 y los chunks reales `book-066`, `book-067`, `trades-066` y `trades-067`
  responden HTTP 200 con `content-type: application/gzip`.
- Las antiguas URLs de OHCLVT, `manifest.json` v1 y la sesión JSON v1 ya no entregan esos
  archivos. `serve` aplica el fallback SPA y responde el mismo `index.html` con
  `content-type: text/html`; los hashes SHA-256 de los tres cuerpos coinciden exactamente con el
  del HTML de entrada.

## Verificación en navegador

Se cargó `/demo` en Chromium mediante Playwright contra producción. Una primera sesión durante
el cambio de instancia registró cuatro `ERR_NETWORK_CHANGED` en los chunks `066/067`; una
comprobación HTTP inmediata confirmó que los cuatro assets estaban disponibles y completos.

La repetición en una sesión de navegador limpia cargó el terminal profesional con datos
históricos: Watchlist, chart Candles, Volume Profile con VAH/POC/VAL, DOM, Activity, Execution y
Time & Sales. Resultado final de consola: 0 errores y 0 warnings. No apareció el estado
`Historical session unavailable`.

## Resultado

El commit funcional está publicado y verificado en producción. La terminal profesional y el
dataset v3 permanecen operativos; los assets legacy retirados ya no se exponen como CSV o JSON.
