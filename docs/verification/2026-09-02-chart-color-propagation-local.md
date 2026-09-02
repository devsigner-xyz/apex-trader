---
status: verified-local
last_verified: 2026-09-02
owners: product-design-engineering
---

# Chart color propagation · local verification

## Scope

- Candles aplica sus colores `up` y `down` a las velas y a las barras del panel de volumen cuando
  está visible.
- Step Profile aplica `bid` al delta positivo y a las barras ascendentes del panel de volumen, y
  `ask` al delta negativo y a las barras descendentes.
- Footprint no hereda preferencias de otros modos: delta y volumen conservan los tokens semánticos
  del sistema.

## Evidence

- `pnpm run check:docs`: contrato documental válido para 20 archivos requeridos.
- `pnpm run lint`: sin errores.
- `pnpm run test:unit`: 101 tests correctos.
- `pnpm exec playwright test e2e/professional-terminal-panels.spec.js --project=chromium`:
  2 tests correctos, incluida la comprobación calculada de velas, delta y volumen en Candles,
  Footprint y Step Profile.
- `pnpm run build`: aplicación Vite y Storybook compilados correctamente.

## Publication boundary

Este documento verifica el estado local. La publicación requiere commit, push, Railway `SUCCESS`
para el hash exacto y comprobación de la UI pública.
