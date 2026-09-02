---
status: current
last_verified: 2026-09-02
owners: product-design-engineering
---

# Professional UI refinement - local verification

## Alcance

Este cambio local afina seis contratos de la terminal sin publicar ni modificar Figma:

- Time & Sales mantiene filas de 26 px desde el primer trade.
- El tag cream del precio actual usa texto `on-accent` oscuro para precio y countdown.
- Candles, Footprint y Step Profile parten con un 30% de espacio futuro frente al Volume Profile;
  el usuario puede recuperar el solape mediante pan y `0` mantiene el reset al borde.
- Chart settings conserva un bloque común y añade a Candles colores `up`/`down` persistentes,
  reset semántico y controles del heatmap exclusivos del modo.
- Account & Risk muestra primero un resumen de performance y riesgo; `VIEW MORE` abre el detalle
  modal con cierre accesible y restauración de foco.
- Móvil y tablet reciben un guard bloqueante con el replay de la home y CTA a
  `https://www.devsigner.xyz/proyectos/apextrader/`.

## Evidencia

Gates ejecutados sobre el working tree final:

- `pnpm run check:docs`: contrato válido, 20 ficheros requeridos.
- `pnpm run lint`: sin errores.
- `pnpm run test:unit`: 20 suites, 20 pass.
- `pnpm run build`: Vite y Storybook completados.
- `git diff --check`: sin errores.
- Playwright Chromium focal inicial: 23 escenarios cubiertos; 22 pass y el único caso de viewport
  pasó al repetirlo tras corregir una aserción incidental.
- Matriz de riesgo Chromium/Firefox/WebKit con 3 workers: 101 casos pass. Los cuatro fallos de
  WebKit se aislaron en una lectura no atómica de filas y tres cargas del script externo de Umami.
  Tras leer filas atómicamente y stubear analítica dentro del test, la fila pasó 1/1 y los tres
  modos pasaron 3/3 en WebKit.
- Visual regression: 10/10 baselines regeneradas para el contrato intencional. Las tres nuevas
  baselines de Account & Risk y guard móvil volvieron a pasar 3/3 sin actualización contra el
  código final.

Una pasada adicional de las 138 pruebas con 16 workers no se usa como evidencia de aceptación:
saturó Firefox, WebKit sufrió proxy lookup hacia Umami y una aserción ajena de la landing esperaba
`rgb(...)` frente a `rgba(...)`; se interrumpió para ejecutar la matriz de riesgo controlada.

Esta evidencia es exclusivamente local. No prueba commit, despliegue, producción ni sincronización
de Figma.
