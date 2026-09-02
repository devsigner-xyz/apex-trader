---
status: current
last_verified: 2026-08-29
owners: product-engineering
---

# Volume panel persistence cleanup · local

## Alcance

Se retiró la persistencia heredada e inefectiva del tamaño de Visible-range Volume Profile. No se
modificaron CSS, layout, dimensiones visuales, rutas, fixtures, datos, replay, viewport, DOM, Time
& Sales, Activity, Figma ni claves de almacenamiento.

## Contrato verificado

- `apex-trader:chart-panel-sizes:v1` conserva su key y normaliza únicamente `{ volume }`.
- Una lectura heredada `{ profile, volume }` recupera y limita `volume`; datos ausentes recuperan
  el default de volumen y valores fuera del rango se limitan a 72–200.
- El estado normalizado que escribe `usePersistentState` elimina el campo legado `profile`.
- El overlay de Visible-range Volume Profile mantiene sus 180 unidades SVG fijas desde
  `chartDimensions.profileChartWidth`; no tiene resize ni tamaño persistido.
- La altura, visibilidad, resizer y recuperación tras recarga del panel inferior de volumen se
  mantienen sin cambios.

## Evidencia

- El test unitario focalizado de persistencia pasa y cubre ausencia, lectura heredada, límites y
  escritura canónica.
- El E2E focalizado de sincronización, settings y teclado pasa en Chromium, Firefox y WebKit. Para
  WebKit se usaron únicamente `NO_PROXY=localhost,127.0.0.1`,
  `no_proxy=localhost,127.0.0.1` y `TMPDIR=/tmp` por el proxy local.
- La suite E2E completa pasa: `pnpm run test:e2e --workers=1 --retries=1` - 120/120 en 8,9 min.

## Gates

- `git diff --check` - pass.
- `pnpm run check:docs` - contrato documental correcto para 20 archivos requeridos.
- `pnpm run lint` - pass.
- `pnpm run test:unit` - 12/12 pass.
- `pnpm run build` - build de producción correcto con Vite 4.3.9.

Esta evidencia es local. No se hizo commit, push, PR, despliegue ni verificación de producción.
