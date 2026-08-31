---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R8 · Volume Profile price scale · local

## Alcance

Verificación local del ajuste solicitado para mostrar una escala de precio junto al Volume Profile
aislado de `Market primitives`, con el mismo lenguaje del eje derecho del chart profesional. El
checkout parte de `master` en `c2fa0b7f8ec082060390662d9210c683573872ee`.

No se modifica Figma, el chart de `/demo`, los fixtures ni la política de publicación. Esta
verificación no prueba producción.

## Implementación comprobada

- El SVG mantiene nueve barras bid/ask y reserva un eje derecho de 80 unidades dentro de su propio
  `viewBox`.
- Cada tick usa `formatNumber`, conserva dos decimales y coincide por precio y posición vertical con
  el centro del nivel correspondiente.
- La franja, el borde, los ticks y la tipografía reutilizan las clases y tokens del price axis
  profesional.
- Las líneas VAH, POC y VAL siguen siendo discretas y punteadas, y terminan en el límite del plot
  antes del eje.
- La fila y el visual permanecen unframed; no se añaden candles ni paneles vecinos.
- En mobile la tipografía del eje aumenta dentro del SVG para compensar el escalado sin provocar
  overflow ni cortar valores.

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

El E2E confirma nueve labels exactos de `21,843.00` a `21,841.00`, identidad de precio con cada
barra, offset de baseline constante, ausencia de `NaN`, carga lazy, cero requests históricos y
ausencia de overflow en 390 × 844.

## QA visual directa

Playwright CLI abrió la landing local en `http://127.0.0.1:5174/` y revisó el módulo aislado en:

- 1440 × 1000: el eje queda integrado en el extremo derecho, el perfil conserva ancho útil y no se
  solapa con los precios.
- 390 × 844: los nueve precios permanecen completos y legibles; la fila mantiene una columna y no
  introduce overflow.
- Consola: sin errores; solo aparece el mensaje informativo de React DevTools del entorno local.

Evidencia local ignorada por Git:

- `output/playwright/landing-r8-volume-profile-price-axis-desktop.png`
- `output/playwright/landing-r8-volume-profile-price-axis-mobile.png`

## Frontera de publicación y Figma

R8 queda solo en el checkout local: no hay commit, push, deployment ni verificación pública. El nodo
Figma R2 `688:21220` tampoco se modifica y el gap R3–R8 continúa explícito.
