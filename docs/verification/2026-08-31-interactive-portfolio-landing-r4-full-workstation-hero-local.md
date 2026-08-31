---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R4 · full-workstation hero

## Alcance y frontera

Esta verificación cubre el ajuste local solicitado para el carrusel de Opening thesis. Los tres
slides muestran el workstation completo con el mismo viewport y cambian únicamente el modo del
gráfico: Candles, Footprint o Step Profile.

Baseline: rama `master`, commit `254882559667`. Este alcance no se ha publicado: no hubo commit,
push ni despliegue y la web pública continúa en R3.

## Assets

Las capturas se generaron desde las rutas reales `/demo`, `/demo/footprint` y
`/demo/step-profile` con viewport 1600 × 900 y reduced motion. En las tres permanecen visibles
watchlist, chart, Activity, DOM, ticket, Time & Sales y footer.

| Asset                                  | Dimensiones | Peso    | SHA-256      |
| -------------------------------------- | ----------- | ------- | ------------ |
| `hero-terminal-candles.png`            | 1600 × 900  | 206364 B | `06cbadb0ea80…` |
| `hero-terminal-footprint.png`          | 1600 × 900  | 245032 B | `558586d943fe…` |
| `hero-terminal-step-profile.png`       | 1600 × 900  | 257035 B | `30c30f6f3def…` |

El stage del carrusel usa proporción 16:9 y `object-fit: contain`; la cartela superpuesta se retiró
para no ocultar el producto. Toolbar, contador y controles mantienen la identificación del modo.

## QA visual

- 1440 × 1000: carrusel de 1280 px de ancho, workstation completo y cero overflow horizontal.
- 390 × 844: carrusel de 342 px, los seis paneles permanecen dentro del encuadre y cero overflow.
- `prefers-reduced-motion`: Candles permanece estático y los selectores manuales siguen disponibles.
- Consola: solo el mensaje informativo de React DevTools en desarrollo; sin warnings ni errores de
  la aplicación.

Evidencia local ignorada por Git:

- `output/playwright/hero-full-workstation/desktop-1440-carousel.png`
- `output/playwright/hero-full-workstation/mobile-390-carousel.png`

## Gates

| Comando                                               | Resultado |
| ----------------------------------------------------- | --------- |
| `git diff --check`                                    | OK        |
| `pnpm run check:docs`                                 | OK        |
| `pnpm run lint`                                       | OK        |
| `pnpm run test:unit`                                  | 19/19     |
| `pnpm run build`                                      | OK        |
| `pnpm exec playwright test e2e/landing.spec.js`       | 21/21     |

La suite E2E pasó en Chromium, Firefox y WebKit. Verifica dimensiones naturales 1600 × 900,
`object-fit: contain`, carga de los cuatro PNG activos, rotación y control manual, ausencia de
requests `/data/tardis/**`, responsive y reduced motion.

## Gap Figma

R4 todavía no está representado en el archivo maestro. R2 continúa como referencia Figma aprobada;
la diferencia queda explícita y no se declara paridad Figma/código.
