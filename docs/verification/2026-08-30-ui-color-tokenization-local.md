---
status: current
last_verified: 2026-08-30
owners: product-design-engineering
---

# UI color tokenization · local

## Alcance

Se sustituyeron los literales de color usados por las reglas CSS y JSX ejecutables de `src` por
roles semánticos existentes o nuevos `--pro-*`. La paleta de Apex, el layout, dimensiones,
tipografía, datos, replay, rutas, viewport, accesibilidad y Figma permanecen sin cambios.

## Contrato verificado

- `professional.css` conserva los valores físicos únicamente en su bloque de definición de tokens.
- Profile, Footprint, ejes, precio actual, DOM, acciones, popovers y animaciones consumen roles
  semánticos en lugar de valores directos.
- El fondo SVG de Volume Panel usa `var(--pro-canvas)`.
- `--pro-select-chevron` encapsula el SVG data-URI del select; su color no puede interpolarse desde
  CSS dentro del URI, pero queda centralizado en un token de recurso.
- La prueba estática recorre todo CSS, JS y JSX ejecutable de `src` y falla si un literal de color
  aparece fuera de los archivos de definición de tokens.

## Gates

- `pnpm exec node --test tests/professionalDesignTokens.test.js` - pass.
- `git diff --check` - pass.
- `pnpm run check:docs` - contrato documental correcto para 20 archivos requeridos.
- `pnpm run lint` - pass.
- `pnpm run test:unit` - 13/13 pass.
- `pnpm run build` - build de producción correcto con Vite 4.3.9.
- `pnpm run test:e2e --workers=1 --retries=1` - 120/120 pass en 8,8 min en Chromium,
  Firefox y WebKit. Para WebKit se usaron únicamente `NO_PROXY=localhost,127.0.0.1`,
  `no_proxy=localhost,127.0.0.1` y `TMPDIR=/tmp` por el proxy local.

Esta evidencia es local. No se hizo commit, push, PR, despliegue ni cambio de Figma.
