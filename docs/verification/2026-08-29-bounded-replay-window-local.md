---
status: current
last_verified: 2026-08-29
owners: product-engineering
---

# Bounded replay window · local

## Alcance

Verificación local del selector temporal, la densidad inicial y el loop del replay histórico Spot
BTCUSDT sin modificar ni ampliar el dataset de un día.

## Resultado

- Candles inicia en 30 min y su primera ventana termina en el intervalo de las 16:30 UTC, con 34
  velas visibles.
- Candles y Step Profile ofrecen 5 min, 15 min, 30 min y 1 h; 4 h deja de estar disponible.
- Footprint conserva 1 h como única temporalidad compatible.
- La carga inicial, el seek y el loop comparten el límite inferior de las 16:30 UTC. El loop
  conserva el exceso temporal del tick al cruzar medianoche.
- Los assets históricos y el manifest permanecen sin cambios; la fuente sigue siendo Binance Spot
  BTCUSDT del 1 de diciembre de 2019.

## Gates

- `pnpm run test:unit` — 16/16 archivos de tests pasan.
- `pnpm run check:docs` — contrato documental correcto.
- `pnpm run lint` — sin errores.
- `pnpm run build` — build de producción correcto.
- E2E profesional en Chromium — pasada completa 21/21; comprobación focalizada posterior de las
  34 velas iniciales, 1/1.
- `git diff --check` — correcto.

Esta evidencia es local. No se hizo commit, push, despliegue ni verificación de producción.
