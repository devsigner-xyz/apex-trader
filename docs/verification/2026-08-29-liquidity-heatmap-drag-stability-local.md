---
status: current
last_verified: 2026-08-29
owners: product-design-engineering
---

# Liquidity heatmap drag stability · local

## Alcance

Verificación de la corrección del flash visible en el Historical Liquidity Heatmap al desplazar
Candles horizontalmente, en especial al reservar espacio futuro y cruzar límites de tiles de
15 minutos.

## Resultado

- El canvas conserva los tiles ya resueltos y carga únicamente índices ausentes.
- Un cambio de ventana con cobertura en memoria no vuelve a marcar la capa como `loading` ni limpia
  su imagen.
- Los tiles que llegan después se fusionan con la caché renderizada en lugar de sustituirla.
- El repintado del Canvas ocurre en layout antes del frame visible que desplaza el SVG.
- El drag mantiene el heatmap en `ready`, con contenido opaco, y conserva su alineación temporal.

## Gates

- `pnpm run check:docs` - contrato documental correcto para 20 archivos requeridos.
- `pnpm run lint` - sin errores.
- `pnpm run test:unit` - 16/16 archivos de tests pasan.
- `pnpm run build` - build de producción correcto.
- Suite del heatmap en Chromium - 4/4 tests pasan.
- Regresión focalizada del drag - 3/3 en Chromium, Firefox y WebKit.
- Suite completa del terminal profesional en Chromium - 16/16 tests pasan.
- `git diff --check` - correcto.

Esta evidencia es local. No se hizo commit, push, despliegue ni verificación de producción.
