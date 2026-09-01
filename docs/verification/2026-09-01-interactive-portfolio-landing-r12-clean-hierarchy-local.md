---
status: current
last_verified: 2026-09-01
owners: product-design-engineering
---

# Interactive portfolio landing R12 — clean hierarchy local

## Alcance

R12 retira los marcadores visuales `01`–`06` de las seis filas de Market primitives. El orden sigue
siendo determinista y se conserva en el DOM mediante la secuencia de las secciones y sus IDs; no se
mantiene un elemento decorativo ni un estilo CSS para mostrar números.

No cambia el copy de valor R11, los fixtures, la geometría, las animaciones, las rutas ni el
comportamiento de `/demo`.

## Verificación local

- `git diff --check`: correcto.
- `pnpm run check:docs`: correcto, 20 documentos obligatorios.
- `pnpm run lint`: correcto.
- `pnpm run test:unit`: 19/19 tests correctos.
- `pnpm run build`: correcto para aplicación y Storybook.
- `PLAYWRIGHT_PORT=5190 ... pnpm exec playwright test e2e/landing.spec.js
  --project=chromium --project=firefox --project=webkit --reporter=line`: 21/21 tests correctos.
- QA visual en 1440 × 1000 y 390 × 844: seis filas presentes, `sequenceCount: 0`, sin overflow
  horizontal y sin errores de consola.

Evidencia visual ignorada por Git:

- `output/playwright/landing-r12-clean-hierarchy/landing-r12-clean-hierarchy-desktop.png`;
- `output/playwright/landing-r12-clean-hierarchy/landing-r12-clean-hierarchy-mobile.png`.

## Límites

- Estado local: sin commit, push ni despliegue.
- R11 permanece publicado en producción.
- Figma conserva R2 como referencia aprobada y no refleja R3–R12.
