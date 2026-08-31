---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R8 · production verification

## Release

- Repositorio: `devsigner-xyz/apex-trader`
- Rama: `master`
- Commit funcional: `c6d941e8e2b39d68dfac8878cd3605e45671a4bc`
- Mensaje: `feat: add volume profile price scale`
- Proyecto Railway: `13bffae0-3a6e-4d62-ae53-2b54d433ced9`
- Entorno: `production` · `3f049efd-d83e-485d-b2b0-12236272cf74`
- Servicio: `apex-trader` · `c8ac903b-a7e3-46c0-85f5-6d5d40b934a7`
- Deployment funcional: `a62124bc-c704-4444-a57b-5e98c6ae6263`
- Estado Railway: `SUCCESS`
- Dominio: `https://apex.devsigner.xyz`

## Comprobación pública

Las rutas `/`, `/demo`, `/demo/footprint` y `/storybook/` respondieron HTTP 200 desde el edge de
Railway. Playwright CLI abrió la landing pública, cargó el chunk lazy de Market primitives y
confirmó:

- el nombre accesible `Updating visible-range Volume Profile with price scale`;
- nueve precios de `21,843.00` a `21,841.00` en orden descendente;
- VAH, POC y VAL a la izquierda y el eje a la derecha, sin solapes;
- composición íntegra en 1440 × 1000;
- labels completos y sin overflow en 390 × 844;
- consola con 0 errores y 0 warnings.

Evidencia local ignorada por Git:

- `output/playwright/landing-r8-volume-profile-price-axis-production-desktop.png`
- `output/playwright/landing-r8-volume-profile-price-axis-production-mobile.png`

## Figma

La publicación no modifica Figma. R8 continúa pendiente de sincronización con el nodo R2
`688:21220`, junto al gap explícito R3–R7.
