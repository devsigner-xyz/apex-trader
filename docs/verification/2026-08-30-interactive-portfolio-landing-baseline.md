---
title: Interactive portfolio landing - baseline local
status: current
last_verified: 2026-08-30
owners: product-design-engineering
---

# Interactive portfolio landing - baseline local

Esta verificación fija el punto de partida de la exploración Figma descrita en
`docs/plans/interactive-portfolio-landing.md`. No demuestra aprobación visual, implementación de la
nueva landing, commit, publicación ni estado de producción.

## Checkout y ownership

- Checkout: `/home/pablo/projects/apex-trader`.
- Rama: `master`.
- `HEAD`: `bfc7818fe5ea8f1b54be3e98c78a5811d084bd09`.
- El checkout ya estaba modificado antes de esta fase. Se excluyen del trabajo de landing y se
  conservan sin limpiar ni reformatear:
  - `package.json`;
  - `src/services/proPlayback.js` y `src/services/replay/`;
  - `tests/historicalAssetCache.test.js`, `tests/playbackChunks.test.js`,
    `tests/proPlaybackFacade.test.js`, `tests/professionalView.test.js` y
    `tests/runtimeManifest.test.js`;
  - `docs/verification/2026-08-30-replay-engine-modularization-local.md`;
  - las capturas de regresión visual modificadas que aparecieron durante la observación del
    checkout.
- Los únicos documentos propios de esta iniciativa al cerrar la fase son el plan, este baseline y
  su enlace desde `docs/README.md`.

## Arquitectura y artefactos actuales

- `src/App.jsx` renderiza `LandingPage` en `/` y mantiene `DemoPage` como import dinámico.
- `useProfessionalPlayback()` pertenece a `src/pages/DemoPage.jsx`; la landing no lo importa.
- La landing actual depende de ocho PNG bajo `public/media/`.
- El artefacto `dist/` encontrado no se regeneró porque el checkout contiene trabajo ajeno en curso.
  Sus tamaños, por tanto, son referencia previa y no evidencia de un build limpio actual:
  - `index-eb6ae1ba.js`: 155455 bytes;
  - `DemoPage-8e0e63c9.js`: 81504 bytes;
  - `index-0827cc9d.css`: 41692 bytes.

## Navegador local

La landing se observó con Vite en `http://127.0.0.1:5173/` y Playwright CLI. El wrapper incluido en
el skill no arrancó por finales CRLF (`/usr/bin/env: 'bash\r'`), por lo que se usó directamente
`npx --yes --package @playwright/cli playwright-cli` con `TMPDIR=/tmp`.

### Desktop 1440 × 1000

- Documento: `scrollWidth=1440`, `clientWidth=1440`, `scrollHeight=6698`.
- Consola: cero errores y cero warnings; solo el aviso informativo de React DevTools en desarrollo.
- Requests Tardis detectados: ninguno.
- Antes de recorrer la página solo se había cargado `opening-thesis.png`; la captura full-page activó
  los siete PNG lazy restantes.
- Captura local ignorada por Git:
  `output/playwright/landing-baseline-desktop-1440.png`.

### Mobile 390 × 844

- Documento: `scrollWidth=390`, `clientWidth=390`, `scrollHeight=9504`.
- Overflow horizontal: `false`.
- Requests Tardis detectados: ninguno.
- Captura local ignorada por Git:
  `output/playwright/landing-baseline-mobile-390.png`.

### Lectura del baseline

- La composición es consistente y contiene correctamente los 390 px, pero el recorrido mobile es
  demasiado largo para el valor narrativo que entrega.
- `Three readings` y `One clock` dependen de media estática; durante la carga progresiva sus paneles
  pueden leerse como grandes superficies vacías.
- El producto queda encuadrado como una tesis sobre las limitaciones de las velas, no como una demo
  funcional de una UI de trading avanzada.
- La nueva dirección debe conservar la separación de carga de `/demo` y la ausencia de requests
  `/data/tardis/**` en `/`.

## Baseline Figma

- Archivo maestro: `Ze9eGnPaNDj8u0oB1iUt3C`.
- Página de exploración: `560:7369` (`02 · Landing · Exploration`).
- Direction B preservada:
  - desktop `609:7459`;
  - tablet `621:7473`;
  - mobile `621:7636`.
- Componentes de marketing locales reutilizables:
  - botón primario `568:7369`;
  - botón secundario `569:7377`;
  - métrica `574:7514`.
- Masters de producto disponibles:
  - MarketChart `101:3457`;
  - OrderBook/DOM `103:59`;
  - Time & Sales `144:1810`.
- El archivo contiene las colecciones locales `Apex Proposal / Primitives`,
  `Apex Proposal / Semantic` y `Apex Proposal / Dimensions`, además de estilos tipográficos
  `Apex Landing` con Inter y Roboto Mono.
- No hay librerías externas añadidas al archivo ni archivos `*.figma.*` en el repositorio. Code
  Connect no pudo consultarse por requerir un seat Dev o Full de Organization/Enterprise; esta
  limitación no bloquea el uso de los componentes locales identificados.

## Frontera de evidencia

No se ejecutaron `lint`, unit tests, build ni E2E de regresión en esta fase: no existe todavía un
cambio de producto que validar y el checkout contiene cambios ajenos activos. La primera puerta es
visual: crear una exploración Figma nueva y obtener aprobación explícita antes de modificar React.
