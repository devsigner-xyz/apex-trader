---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R9 · production verification

## Release funcional

- Repositorio: `devsigner-xyz/apex-trader`.
- Rama: `master`.
- Commit: `2169d902015a4b449d13f71f59e5d38e73d73243`.
- Mensaje: `feat: add ambient depth to landing primitives`.
- Railway project: `13bffae0-3a6e-4d62-ae53-2b54d433ced9` (`apex-trader`).
- Environment: `3f049efd-d83e-485d-b2b0-12236272cf74` (`production`).
- Service: `c8ac903b-a7e3-46c0-85f5-6d5d40b934a7` (`apex-trader`).
- Deployment: `f38993ff-91e7-49f6-bb74-ff5aec1f6768`.
- Estado: `SUCCESS`.
- Image digest: `sha256:707a1d385a13c606a7f2718c810b80713ab7356b0ac2efeaac4bc370548f42f3`.
- Dominio: `https://apex.devsigner.xyz`.

## HTTP y navegador público

`/`, `/demo` y `/storybook/` respondieron HTTP 200 desde el dominio público. La comprobación
directa con Chromium sobre la landing confirmó:

- seis ejecuciones completas en Last Trades, con time, price y size visibles;
- los seis fondos ambientales diferenciados detrás de Candles, Footprint, Step Profile, Volume
  Profile, DOM y Last Trades;
- ausencia de nuevos wrappers, surfaces o sombras exteriores en las seis filas;
- apertura correcta del settings de Last Trades, con All trades seleccionado y opciones Buy/Sell;
- composición íntegra en desktop y seis filas legibles sin overflow visible en 390 × 844;
- consola con 0 errores y 0 warnings.

La regresión local previa conserva además 21/21 E2E en Chromium, Firefox y WebKit, 19/19 unitarios,
build de aplicación/Storybook y contrato documental válidos.

Evidencia visual local ignorada por Git:

- `output/playwright/landing-r9-ambient-depth-production-desktop.png`
- `output/playwright/landing-r9-ambient-depth-production-mobile.png`

## Límite de evidencia

Esta verificación prueba el código funcional, el deployment Railway, las rutas y el comportamiento
público R9. Figma conserva R2 `688:21215` como referencia aprobada: el nodo Last Trades
`688:21222` sigue mostrando tres ejecuciones y no incluye los backdrops ambientales. El gap R3–R9
permanece abierto y no se declara paridad Figma/código.
