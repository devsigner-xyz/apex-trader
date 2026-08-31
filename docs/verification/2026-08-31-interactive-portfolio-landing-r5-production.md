---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R5 · production verification

## Release funcional

- Rama: `master`.
- Commit: `db5effee2f877486326e508f9cc44b64b05073b5`.
- Mensaje: `feat: refine interactive landing visuals`.
- Railway project: `13bffae0-3a6e-4d62-ae53-2b54d433ced9` (`apex-trader`).
- Environment: `3f049efd-d83e-485d-b2b0-12236272cf74` (`production`).
- Service: `c8ac903b-a7e3-46c0-85f5-6d5d40b934a7` (`apex-trader`).
- Deployment: `99f97679-f8e0-43fe-95b6-ff97c875b860`.
- Estado: `SUCCESS`.
- Image digest: `sha256:02acf72b42c3506f9e6e016def9784a5d7c39adccdff507e97c400e10b4f3f70`.

## HTTP y assets

| Recurso                                  | Resultado                 |
| ---------------------------------------- | ------------------------- |
| `/`                                      | 200 · `text/html`          |
| `/demo`                                  | 200 · `text/html`          |
| `/demo/footprint`                        | 200 · `text/html`          |
| `/demo/step-profile`                     | 200 · `text/html`          |
| `/storybook/`                            | 200 · `text/html`          |
| `/media/hero-terminal-candles.png`       | 200 · `image/png` · 206364 B |
| `/media/hero-terminal-footprint.png`     | 200 · `image/png` · 245032 B |
| `/media/hero-terminal-step-profile.png`  | 200 · `image/png` · 257035 B |

Los hashes SHA-256 públicos coinciden con los assets versionados:

- Candles: `06cbadb0ea805442de6c02b992905caadde1378d2c0ae9d5560728917b90dded`.
- Footprint: `558586d943fe245408b7761dc21f57c1c8b4a953f5b545dd9705faf2a7132393`.
- Step Profile: `30c30f6f3deffe69aa602a049142eaa274b4a9713a40bf1d6c4c52d4d316204d`.

## Navegador público

La comprobación directa con Chromium sobre `https://apex.devsigner.xyz` confirmó:

- hero 16:9 con el workstation completo y controles visibles en desktop 1440 × 1000;
- hero completo sin crop ni overflow en mobile 390 × 844;
- carrusel activo en Candles, Footprint y Step Profile con sus exports completos;
- Footprint y Step Profile muestran dos barras escalonadas y sin surface, borde o shadow de card;
- `/demo`, `/demo/footprint` y `/demo/step-profile` cargan respectivamente los charts accesibles
  `candles historical chart`, `footprint historical chart` y `step-profile historical chart`;
- consola con 0 errores y 0 warnings.

Evidencia visual local ignorada por Git:

- `output/playwright/r5-production/hero-desktop.png`
- `output/playwright/r5-production/hero-mobile.png`
- `output/playwright/r5-production/footprint-desktop.png`
- `output/playwright/r5-production/step-profile-desktop.png`

## Límite de evidencia

Esta verificación prueba código, deployment funcional, assets y comportamiento público R4/R5.
Figma conserva R2 `688:21215` como referencia aprobada y todavía no representa estos ajustes; no se
declara paridad Figma/código.
