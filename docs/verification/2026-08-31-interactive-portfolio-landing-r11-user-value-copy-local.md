---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R11 — user-value copy local

## Alcance

R11 revisa el copy público de `/` sobre la base publicada
`abab8e36bf7996aa52afd792bd4cedd807742918`. El cambio responde a una inconsistencia narrativa: los
taglines describían cantidades de filas, barras y estados de actualización como si fueran un log de
implementación, en lugar de explicar el valor de cada lectura a un usuario final.

La revisión incluye hero, navegación, carrusel, introducciones de sección, seis módulos de mercado,
métricas, callouts, CTAs, cierre y estados de carga. No cambia fixtures, geometría, animación, rutas,
datos ni comportamiento de `/demo`.

## Contrato de contenido

- Hero: conecta price action, volumen ejecutado, liquidez y tape con la pregunta de cómo se formó un
  movimiento.
- Candles: dirección, rango y momentum.
- Footprint: presión compradora o vendedora ejecutada a cada precio.
- Step Profile: concentración y cambios en la distribución dentro del intervalo.
- Volume Profile: aceptación, POC, VAH y VAL dentro de la sesión visible.
- DOM: liquidez disponible y posible fricción alrededor del último precio.
- Time & Sales: secuencia, tamaño, lado agresor y ritmo de ejecución.
- Las acciones usan `Open workspace` y `Compare market views`; no se afirma conexión a broker ni
  operativa en vivo.

## Verificación local

- `git diff --check`: correcto.
- `pnpm run check:docs`: correcto, 20 documentos obligatorios.
- `pnpm run lint`: correcto.
- `pnpm run test:unit`: 19/19 tests correctos.
- `pnpm run build`: correcto para aplicación y Storybook.
- `PLAYWRIGHT_PORT=5188 ... pnpm exec playwright test e2e/landing.spec.js
  --project=chromium --project=firefox --project=webkit --reporter=line`: 21/21 tests correctos.
- QA visual en 1440 × 1000 y 390 × 844: copy completo, sin overflow horizontal y sin errores de
  consola.

Evidencia visual ignorada por Git:

- `output/playwright/landing-r11-user-copy/landing-r11-user-copy-desktop.png`;
- `output/playwright/landing-r11-user-copy/landing-r11-user-copy-mobile.png`.

## Límites

- Estado local: sin commit, push ni despliegue.
- La publicación R10 permanece en producción sin este copy.
- Figma conserva R2 como referencia aprobada y no refleja R3–R11.
