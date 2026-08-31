---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing · R3 local refinement

## Alcance

Esta evidencia cubre el ajuste R3 solicitado después de publicar R2. El base commit es
`d3f7ee61e5fc5b49a30654dd1daf4f0159f586dc`; los cambios descritos permanecen locales y no prueban
commit, push, Railway ni producción.

## Resultado verificado

- Opening thesis usa `HeroModeCarousel` con los exports Candles, Footprint y Step Profile, orden
  determinista, ciclo de 4,2 s, crossfade de 420 ms, selectores y pause/resume.
- El carrusel se pausa fuera de viewport y con `document.hidden`; reduced motion conserva Candles
  estático y elimina transiciones.
- Candles mantiene cuatro barras cerradas y una actual. Las cinco están próximas; open/high/low de
  la actual permanecen estables y su close se mueve siempre dentro del rango.
- Footprint y Step Profile contienen dos barras cada uno. La primera no cambia entre fases y la
  segunda actualiza niveles; delta y volumen son finitos y derivados de esos niveles.
- Las seis filas alternan visual/copy en desktop y vuelven a visual → copy a 390 px.
- Los marcos elevados, numeración de filas y superficies alternas añaden profundidad sin modificar
  los colores semánticos de mercado ni introducir gradientes, glass o neón.
- DOM conserva 3 asks + last + 3 bids; Last Trades conserva tres ejecuciones; Volume Profile sigue
  aislado con POC/VAH/VAL.
- `/` continúa sin montar `.market-chart` ni solicitar `/data/tardis/**`.

## Verificación ejecutada

```bash
node --test tests/marketPrimitiveFixtures.test.js
pnpm exec eslint src/components/landing/HeroModeCarousel.jsx \
  src/components/landing/MarketPrimitivesShowcase.jsx \
  src/components/landing/marketPrimitiveFixtures.js src/pages/LandingPage.jsx \
  tests/marketPrimitiveFixtures.test.js e2e/landing.spec.js
pnpm exec playwright test e2e/landing.spec.js --project=chromium
pnpm run check:docs
pnpm run lint
pnpm run test:unit
pnpm run build
git diff --check
```

Resultados focalizados:

- Fixture unitario: aprobado.
- ESLint focalizado: aprobado.
- Documentación: `Documentation contract OK (20 required files)`.
- ESLint completo: aprobado.
- Unit completo: 19/19.
- Build: Vite y Storybook aprobados.
- Landing: 21/21; 7/7 en Chromium, Firefox y WebKit.
- Consola y page errors: 0.
- Requests históricos en `/`: 0.
- Responsive 390 px: sin overflow horizontal.

El build produjo `MarketPrimitivesShowcase-15036dd3.js` (10,11 kB raw / 3,73 kB gzip),
`index-e6599eb3.js` (155,99 kB / 50,04 kB) e `index-5151e186.css` (46,01 kB / 9,01 kB).
`DemoPage` permanece en su chunk separado.

La inspección visual se realizó con Playwright CLI a 1440 × 1000 y 390 × 844 sobre el hero,
Candles/Footprint alternos y Step Profile/Volume Profile alternos. Las capturas temporales se
eliminaron después de revisarlas y no forman parte del checkout.

## Gate

Los gates locales están aprobados. Figma R2 `688:21215` aún no refleja R3 y la publicación requiere
autorización nueva; esta evidencia no debe citarse como prueba de producción.
