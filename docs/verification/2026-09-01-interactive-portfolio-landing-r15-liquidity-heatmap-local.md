---
status: current
last_verified: 2026-09-01
owners: product-design-engineering
---

# Interactive portfolio landing R15 - liquidity heatmap local

## Alcance

Market primitives incorpora una séptima fila para Liquidity Heatmap. La escena muestra 96 líneas
continuas de intensidad por precio y tiempo y un settings popover real con un slider de intensidad
de 20% a 100% en pasos de 5%. Los valores parten de una muestra estática del replay de 30 min. Los fixtures
siguen siendo deterministas y no
montan `LiquidityHeatmapLayer`, no cargan tiles y no solicitan `/data/tardis/**`.

## Verificación local

- `git diff --check` - correcto.
- `pnpm run check:docs` - correcto, 20 documentos requeridos.
- `pnpm run lint` - correcto.
- `pnpm run test:unit` - 19/19 correctos; fixture heatmap validado en 8 × 12 y variable por fase.
- `pnpm run build` - aplicación y Storybook correctos.
- E2E de landing en Chromium, Firefox y WebKit - pendiente de ejecutar; séptima fila, 96 líneas,
  header de contexto, settings de intensidad y ausencia de replay histórico quedan cubiertos por la
  especificación actual.

## Límites

- Estado local: sin commit, push ni despliegue.
- Figma conserva R2 como referencia aprobada y no refleja R3–R15.
