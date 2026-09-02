---
status: current
last_verified: 2026-08-29
owners: product-design-engineering
---

# Timeframe future-space default · local

## Alcance

Verificación del estado temporal aplicado después de seleccionar otra temporalidad: margen futuro
máximo por defecto, Volume Profile despejado y posibilidad de recuperar el overlay mediante drag.

## Resultado

- Cambiar entre 5 min, 15 min, 30 min y 1 h restaura la densidad del modo y aplica un offset
  negativo equivalente al 30% de sus barras visibles.
- Velas y demás elementos temporales quedan inicialmente a la izquierda del Volume Profile.
- Arrastrar hacia la derecha reduce o elimina el margen y permite volver a situar datos bajo el
  perfil sin modificar `visibleCount`.
- El margen continúa siendo estado de viewport, no padding fijo.
- La carga inicial y la tecla `0` mantienen offset cero como reset explícito al borde derecho.

## Gates

- `pnpm run check:docs` - contrato documental correcto para 20 archivos requeridos.
- `pnpm run lint` - sin errores.
- `pnpm run test:unit` - 16/16 archivos de tests pasan.
- `pnpm run build` - build de producción correcto.
- Terminal profesional más heatmap en Chromium - 21/21 tests pasan.
- Regresión focalizada del cambio de timeframe y drag - 3/3 en Chromium, Firefox y WebKit.
- `git diff --check` - correcto.

Esta evidencia es local. No se hizo commit, push, despliegue ni verificación de producción.
