---
status: verified-local
last_verified: 2026-09-02
owners: product-design-engineering
---

# Step Profile color settings · local verification

## Scope

- Candles conserva colores independientes para velas `up` y `down`.
- Step Profile añade colores independientes para perfiles `bid` y `ask`.
- Las opciones comunes de Chart settings permanecen visibles en los tres modos.
- Footprint no hereda colores de Candles o Step Profile y todavía no expone controles de color.
- La apariencia persiste en `apex-trader:chart-appearance:v1` y cada modo puede restaurar sus
  tokens semánticos por separado.

## Evidence

- `pnpm run check:docs`: contrato documental válido para 20 archivos requeridos.
- `pnpm run lint`: sin errores.
- `pnpm run test:unit`: 101 tests correctos.
- `pnpm exec playwright test e2e/professional-terminal-panels.spec.js --project=chromium`: 2 tests
  correctos, incluida la selección, persistencia y aplicación SVG de ambos colores de Step Profile.
- `pnpm run build`: aplicación Vite y Storybook compilados correctamente.
- Playwright CLI generó una captura de `.market-chart` a 1920 × 1080 con Chart settings abierto,
  velas alcistas `#5be183` y velas bajistas `#ffffff`; el asset se integró en el detalle público del
  proyecto sin usar una imagen sintética.

## Publication boundary

Este documento verifica el estado local. La publicación requiere commit, push, Railway `SUCCESS`
para el hash exacto y comprobación de la UI y los assets públicos.
