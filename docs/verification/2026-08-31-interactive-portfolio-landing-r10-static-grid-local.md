---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R10 · Static faded grid · local

## Alcance

Verificación local del reemplazo solicitado para retirar los seis fondos SVG animados de R9 y usar
una retícula estática, consistente y muy sutil detrás de cada visual de `Market primitives`. El
checkout parte del release R9 `a2f089bae32f1502c95856b9133c63c1b2e95aca`.

No se modifica Figma, la terminal de `/demo`, las seis filas de Last Trades, los fixtures ni la
política de publicación. Esta verificación no prueba producción.

## Implementación comprobada

- Los seis SVG decorativos y sus seis grupos de keyframes se eliminan del runtime.
- Cada visual incorpora un único `span` decorativo y `aria-hidden` con dos `linear-gradient` de
  36 px que forman una retícula regular.
- Una máscara radial desvanece la retícula hacia los cuatro bordes; la opacidad global permanece en
  0.26 y el color reutiliza `--pro-subtle`.
- El fondo no tiene animación, transición, foco ni eventos de puntero en ningún estado de motion.
- La fila y el marco visual siguen siendo transparentes, sin surface, borde, radio o sombra.
- El reloj determinista y las actualizaciones de datos permanecen intactos; solo se retira el
  movimiento decorativo de fondo.
- DOM y Last Trades conservan sus paneles centrados, settings funcionales y seis ejecuciones.

## Verificación automatizada

```text
git diff --check                                      PASS
pnpm run check:docs                                  PASS
pnpm run lint                                        PASS
pnpm run test:unit                                   PASS · 19/19
pnpm run build                                       PASS
pnpm exec playwright test e2e/landing.spec.js
  --project=chromium --project=firefox --project=webkit
                                                       PASS · 21/21
```

El E2E confirma seis retículas, dos gradientes lineales y máscara radial por visual, ausencia de
animación en estado normal y reduced motion, seis trades, settings funcionales, carga lazy, cero
requests históricos y ausencia de overflow en 390 × 844.

## QA visual directa

Playwright CLI abrió la landing local en `http://127.0.0.1:5173/` y revisó:

- 1280 × 720: la retícula aporta profundidad homogénea, queda detrás de los datos y se desvanece sin
  crear una nueva card visual.
- 390 × 844: Last Trades mantiene seis filas completas y el grid permanece tenue alrededor del
  panel, sin overflow.
- Consola: 0 errores y 0 warnings.

Evidencia local ignorada por Git:

- `output/playwright/landing-r10-static-grid-desktop.png`
- `output/playwright/landing-r10-static-grid-mobile.png`

## Frontera de publicación y Figma

R10 queda solo en el checkout local: no hay commit, push, deployment ni verificación pública. Figma
mantiene R2 `688:21215` y no representa la retícula estática; el gap R3–R10 continúa explícito.
