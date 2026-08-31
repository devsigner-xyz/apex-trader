---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R11 · production verification

## Release funcional

- Repositorio: `devsigner-xyz/apex-trader`.
- Rama: `master`.
- Commit: `0b399ec292bdb44deed0c73f49c99c338887145f`.
- Mensaje: `feat: improve landing product copy`.
- Railway project: `13bffae0-3a6e-4d62-ae53-2b54d433ced9` (`apex-trader`).
- Environment: `3f049efd-d83e-485d-b2b0-12236272cf74` (`production`).
- Service: `c8ac903b-a7e3-46c0-85f5-6d5d40b934a7` (`apex-trader`).
- Deployment: `e3d07c19-adde-4b8a-9467-70a49f4e67e9`.
- Estado: `SUCCESS`.
- Image digest: `sha256:2b106816230a489ea8f626616d280149fac1581ff28a53dd9e0817c6a77da92e`.
- Dominio: `https://apex.devsigner.xyz`.

## HTTP y navegador público

`/`, `/demo` y `/storybook/` respondieron HTTP 200 desde el dominio público. Los tres assets del
carrusel —Candles, Footprint y Step Profile— respondieron HTTP 200 con `image/png`.

La comprobación directa con Chromium confirmó:

- hero, navegación, secciones, métricas, callouts y CTAs con el copy R11 orientado a producto;
- los seis mensajes de valor cargados en los módulos, desde `SEE DIRECTION AND MOMENTUM` hasta
  `FOLLOW THE PACE OF EXECUTION`;
- ausencia de `DEPTH UPDATES`, `STREAM UPDATES` y los demás taglines de implementación sustituidos;
- composición completa sin overflow horizontal en 1440 × 1000 y 390 × 844;
- consola con 0 errores y 0 warnings;
- `/demo` monta el workspace profesional con Markets, chart, DOM, Execution y Time & Sales.

La regresión local previa conserva 21/21 E2E en Chromium, Firefox y WebKit, 19/19 unitarios, build
de aplicación/Storybook, lint y contrato documental válidos.

Evidencia visual local ignorada por Git:

- `output/playwright/landing-r11-production/landing-r11-production-desktop.png`;
- `output/playwright/landing-r11-production/landing-r11-production-mobile.png`.

## Límite de evidencia

Esta verificación prueba el código funcional, el deployment Railway, las rutas, los assets y el
comportamiento público R11. Figma conserva R2 `688:21215` como referencia aprobada y todavía no
refleja el copy ni los ajustes R3–R11; el gap permanece abierto y no se declara paridad
Figma/código.
