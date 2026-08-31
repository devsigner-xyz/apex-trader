---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R9 · Ambient depth · local

## Alcance

Verificación local del refinamiento solicitado para dar profundidad visual a los seis módulos de
`Market primitives` sin recuperar cards, surfaces ni sombras, y para ampliar Last Trades de tres a
seis ejecuciones. El checkout parte del release R8 `390523a31542e9fef577bbc0d729b4804a677b45`.

No se modifica Figma, la terminal de `/demo`, el replay histórico ni la política de publicación.
Esta verificación no prueba producción.

## Implementación comprobada

- Last Trades muestra seis filas recientes tanto en el fixture como en `CompactTimeSales`; el
  filtro Buy/Sell y el reset All permanecen funcionales.
- Cada uno de los seis visuales aislados incorpora una geometría SVG ambiental propia: trayectoria
  de precio, matriz, escalones, perfil horizontal, railes de profundidad y flujo de ejecuciones.
- Los fondos comparten intensidad, color neutro y trazo fino, pero usan composiciones, duraciones y
  desplazamientos diferentes para evitar repetición mecánica.
- La profundidad sigue siendo unframed: no hay wrapper visible, surface, gradiente, borde ni sombra
  alrededor de los visuales.
- Los SVG decorativos son `aria-hidden`, no reciben foco y quedan detrás del componente funcional.
- La animación solo se ejecuta mientras la sección está próxima al viewport y el documento está
  visible; `prefers-reduced-motion` la desactiva por completo.
- DOM y Last Trades conservan sus barras de settings funcionales, y los fondos laterales no
  interfieren con botones, popovers ni lectura de valores.

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

El E2E confirma seis fondos decorativos, seis nombres de animación distintos, seis filas de trades,
settings funcionales, ausencia de surface/border/shadow, reducción de movimiento, carga lazy, cero
requests históricos y ausencia de overflow en 390 × 844.

## QA visual directa

Playwright CLI abrió la landing local en `http://127.0.0.1:5174/` y revisó el conjunto en:

- 1440 × 1000: las seis composiciones añaden profundidad sin competir con datos ni copy; los
  laterales de DOM y Last Trades siguen siendo visibles pese al fondo opaco de los paneles.
- 390 × 844: las seis filas de Last Trades permanecen completas, legibles y sin overflow; la
  composición ambiental se recorta dentro del visual.
- Consola: sin errores; solo aparece el mensaje informativo de React DevTools del entorno local.

Evidencia local ignorada por Git:

- `output/playwright/landing-r9-ambient-depth-desktop.png`
- `output/playwright/landing-r9-ambient-depth-mobile.png`

## Frontera de publicación y Figma

R9 queda solo en el checkout local: no hay commit, push, deployment ni verificación pública. El
nodo Figma R2 `688:21222` sigue mostrando tres ejecuciones y los seis fondos ambientales tampoco
existen aún en el archivo maestro; el gap R3–R9 continúa explícito.
