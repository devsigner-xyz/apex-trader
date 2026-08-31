---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R10 · production verification

## Release funcional

- Repositorio: `devsigner-xyz/apex-trader`.
- Rama: `master`.
- Commit: `91da3addf94fafe528ed79242690233cebc7e6f0`.
- Mensaje: `feat: replace landing motion with static grid`.
- Railway project: `13bffae0-3a6e-4d62-ae53-2b54d433ced9` (`apex-trader`).
- Environment: `3f049efd-d83e-485d-b2b0-12236272cf74` (`production`).
- Service: `c8ac903b-a7e3-46c0-85f5-6d5d40b934a7` (`apex-trader`).
- Deployment: `3aa05fe2-6570-48cb-baf2-76df8a91d4b8`.
- Estado: `SUCCESS`.
- Image digest: `sha256:a5eade2f0a5b823a7ca28c934ef36e404f6b460524ca2f426a0e1f1d5999dbb6`.
- Dominio: `https://apex.devsigner.xyz`.

## HTTP y navegador público

`/`, `/demo` y `/storybook/` respondieron HTTP 200 desde el dominio público. La comprobación
directa con Chromium sobre la landing confirmó:

- una retícula regular y desvanecida detrás de los seis módulos aislados;
- retirada visual de las trayectorias, matrices, escalones, perfiles y flujos animados de R9;
- ausencia de nuevos wrappers, surfaces, bordes o sombras exteriores;
- seis ejecuciones completas en Last Trades y paneles DOM/Trades centrados;
- composición íntegra en desktop y seis filas legibles sin overflow visible en 390 × 844;
- consola con 0 errores y 0 warnings.

La regresión local previa conserva además 21/21 E2E en Chromium, Firefox y WebKit, 19/19 unitarios,
build de aplicación/Storybook y contrato documental válidos. El E2E verifica explícitamente dos
gradientes lineales, máscara radial y `animation-name: none` en las seis retículas.

Evidencia visual local ignorada por Git:

- `output/playwright/landing-r10-static-grid-production-desktop.png`
- `output/playwright/landing-r10-static-grid-production-mobile.png`

## Límite de evidencia

Esta verificación prueba el código funcional, el deployment Railway, las rutas y el comportamiento
público R10. Figma conserva R2 `688:21215` como referencia aprobada y no representa la retícula
estática; el gap R3–R10 permanece abierto y no se declara paridad Figma/código.
