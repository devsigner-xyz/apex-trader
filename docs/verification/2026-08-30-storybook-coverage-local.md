---
status: current
verified_on: 2026-08-30
scope: local
---

# Storybook coverage local verification

## Alcance

El catálogo ahora muestra los roles semánticos y dimensiones de Apex, las seis variantes activas de `MarketChart`, las cinco vistas de `Activity`, el panel de ejecución, los diez estados de `OrderTicket`, filtros de Time & Sales y el resizer de paneles. Los fixtures de MarketChart son barras, niveles y profile locales; el heatmap queda desactivado para no solicitar tiles de replay. El gráfico ejecutable añade una etiqueta de precio alineada con el hover y el control de intensidad separa label, porcentaje y range en dos filas.

## Checks aprobados

- `pnpm run check:docs`
- `pnpm run lint`
- `pnpm run test:unit` - 14 archivos de prueba aprobados.
- `pnpm run build` - Vite y Storybook generados correctamente.
- Inspección de navegador local de `Chart / Market chart / Candles Volume Shown`, `Workspace / Activity / Account And Risk`, `Foundations / Color roles / Semantic Roles` y `Execution / Order ticket / Sell Oco`. Las cuatro historias renderizaron sin errores y expusieron los roles y controles accesibles esperados.
- Inspección directa de `/demo`: mover el cursor sobre el gráfico muestra la etiqueta de precio en el eje; Chart settings mantiene visibles `INTENSITY`, `60%` y su slider sin solapamiento.

## Límite de esta verificación

`pnpm run test:e2e` no completó en este host: su ejecución de 126 casos con 16 workers agotó sesiones de navegador y terminó con timeouts distribuidos. Una repetición serial de los contratos de foco y gráfico tampoco llegó a completar por el mismo límite local de sesiones. No se considera evidencia E2E aprobada; sí permanecen aprobados los checks estáticos, unitarios, build y las inspecciones directas de Storybook anteriores.

No se ha publicado este cambio.
