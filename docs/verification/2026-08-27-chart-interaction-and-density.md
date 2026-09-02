---
status: current
last_verified: 2026-08-27
owners: product-design-engineering
---

# 2026-08-27 - Chart interaction and density

## Scope

Verificación focalizada de Candles, Footprint y Step Profile tras introducir hover contextual, pan fraccional, límites de zoom por modo, ticks temporales adaptativos y el enlace externo del footer.

## Acceptance evidence

- Candles muestra en la toolbar el `O`, `H`, `L`, `C`, `Δ` y `V` de la barra bajo el puntero y restaura la barra actual al salir.
- El cursor idle no comunica pan activo; `grabbing` solo aparece entre pointerdown principal y pointerup o cancelación.
- Un drag inferior al ancho de una barra desplaza la geometría y puede dejar una vela parcialmente recortada. Reset elimina el offset entero y fraccional.
- Las barras analíticas se determinan por su centro dentro del plot; profile, POC, VAH y VAL ignoran buffers con centro exterior.
- Los límites efectivos son Candles 28–160, Footprint 4–13 y Step Profile 1–12.
- En máximo zoom-out, los labels de Footprint y Step Profile permanecen dentro de sus celdas y no invaden barras vecinas.
- En Candles, el máximo zoom-in mantiene una separación acotada y el zoom-out reduce ticks temporales antes de que se solapen.
- El antiguo resumen naranja de rango no existe.
- El footer conserva `ApexTrader by devsigner.xyz`; solo `devsigner.xyz` es enlace a `https://devsigner.xyz`, abre nueva pestaña y declara `noopener noreferrer`.

## Gates ejecutados

- `pnpm run check:docs`: pasa; 13 documentos requeridos.
- `pnpm run lint`: pasa.
- `pnpm run test:unit`: pasa; 13 de 13 archivos.
- `pnpm run build`: pasa con Vite 4.3.9.
- E2E focalizados de hover, pan fraccional, Footprint, labels y estabilidad del replay: pasan.
- Suite completa Playwright con tres workers: 60 de 60 en Chromium, Firefox y WebKit.
- Comprobación focal de labels a 1366 × 900: 3 de 3 en Chromium, Firefox y WebKit.

La suite contractual cubre 1920 × 1080, el caso existente de 1440 × 900 y la comprobación focal de 1366 × 900. Los contratos principales conservan sus aserciones de consola y errores de página sin incidencias.
