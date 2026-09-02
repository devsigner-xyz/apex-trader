---
status: current
last_verified: 2026-08-29
owners: product-design-engineering
---

# Future chart space · local

## Alcance

Verificación local del drag horizontal que permite desplazar datos hacia la izquierda y reservar
espacio futuro a la derecha sin usar zoom ni desalinear capas temporales.

## Resultado

- Candles, Footprint y Step Profile admiten offset futuro negativo mediante drag principal.
- El gesto conserva `visibleCount`, por lo que no altera la densidad o el timeframe.
- El margen se limita al 30% del plot; en el extremo, el último dato queda a la izquierda del
  Volume Profile.
- Velas o perfiles por intervalo, volumen y heatmap comparten el mismo dominio temporal.
- El último dato continúa en follow-latest mientras existe margen futuro; `0` vuelve al offset cero.
- Los slots futuros quedan vacíos y no participan en Volume Profile, POC, VAH o VAL.

## Gates

- `pnpm run test:unit` - 16/16 archivos de tests pasan.
- `pnpm run check:docs` - contrato documental correcto.
- `pnpm run lint` - sin errores.
- `pnpm run build` - build de producción correcto.
- Suite profesional Chromium - 16/16 tests pasan.
- E2E focalizado del drag - 3/3 en Chromium, Firefox y WebKit; la invocación retira variables
  proxy vacías del entorno local para que WebKit resuelva `localhost`.
- `git diff --check` - correcto.

Esta evidencia es local. No se hizo commit, push, despliegue ni verificación de producción.
