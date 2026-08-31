---
status: in_progress
last_verified: 2026-08-31
owners: product-design-engineering
---

# Plan: landing interactiva de portfolio con componentes reales

## Estado y autoridad

Este plan transforma `/` en una presentación profesional de Apex Trader como demo funcional de una
UI de trading avanzada. El replay histórico alimenta `/demo`, pero no define la categoría pública
del producto.

La dirección Figma R1 fue aprobada el 30 de agosto de 2026 y dio lugar a un prototipo técnico con un
`MarketChart` completo. La revisión explícita del usuario del 31 de agosto lo sustituyó por el
contrato R2 de módulos aislados: los gráficos, DOM, Last Trades y Volume Profile deben explicarse sin
mostrar el resto del terminal. R1 y su verificación se conservan como snapshot histórico; no son el
contrato vigente.

La publicación R2 autorizada ya está cerrada. El feedback posterior define una revisión R3 local;
no se reutiliza automáticamente aquella autorización para publicar este nuevo alcance. No autoriza
una release parcial ni operaciones destructivas.

El feedback posterior a R3 define R4: el carrusel de apertura no debe mostrar recortes del chart,
sino el workstation completo con encuadre idéntico en los tres estados y únicamente el modo del
gráfico como variación. R4 es un cambio local hasta recibir una autorización de publicación propia.

## Resultado buscado

- Presentar Apex como una interfaz de trading avanzada, no como una replay workstation.
- Explicar cada lectura mediante componentes React pequeños, editables y deterministas.
- Reservar las imágenes para mostrar la composición completa, donde una UI real dejaría de ser
  legible por escala.
- Mantener `/demo` y su replay, preferencias y rutas sin regresiones.
- Mantener el copy público en inglés y la documentación interna en español.

## Contrato visual R2

La sección `Market primitives` contiene seis filas compactas de dos columnas: visual a la izquierda
y explicación a la derecha. En mobile se apilan visual y copy sin escalar un terminal desktop.

| Módulo         | Visual aislado                                                                 |
| -------------- | ------------------------------------------------------------------------------ |
| Candles        | Cinco velas; las cuatro cerradas permanecen estables y solo la última cambia.  |
| Footprint      | Una vela con bid/ask por nivel y valores que se actualizan.                    |
| Step Profile   | Una vela con distribución escalonada y valores que se actualizan.              |
| Volume Profile | Barras horizontales aisladas con POC, VAH y VAL discretos.                     |
| DOM            | Tres asks, last price y tres bids; cambian cantidades y barras de profundidad. |
| Last Trades    | Tres ejecuciones recientes; entra una nueva impresión en cada fase.            |

No se muestran headers del chart, tabs, resizers, watchlist, ticket, activity ni paneles vecinos en
estas filas. La excepción intencional es el context header y settings de DOM/Time & Sales. La
apertura y `The workspace` pueden usar imágenes optimizadas porque su función es mostrar contexto
de producto completo.

## Ajuste visual R3

- Opening thesis sustituye la captura única y la deconstrucción OHLC por un carrusel de exports
  reales: Candles → Footprint → Step Profile, crossfade de 420 ms y ciclo de 4,2 s.
- El carrusel expone selección manual y pause/resume; se detiene fuera de viewport, con la pestaña
  oculta y bajo `prefers-reduced-motion`.
- Las seis filas alternan visual/copy en desktop y recuperan siempre visual → copy en mobile.
- Candles acerca sus cinco barras. La quinta conserva open/high/low válidos y mueve solo el close
  dentro del rango durante el bucle.
- Footprint y Step Profile pasan de una a dos barras: una cerrada estable y otra actual. Ambas tienen
  `delta` y `volume` finitos derivados de sus niveles.
- Elevación, numeración y marcos desplazados aportan profundidad con tokens de Apex, sin gradientes,
  glass, neón ni colores de mercado usados como decoración.

## Ajuste visual R4

- Los tres slides de Opening thesis son capturas 1600 × 900 del workstation completo.
- Watchlist, DOM, ticket, Time & Sales, activity y chrome mantienen posición y escala entre slides;
  cambia únicamente Candles, Footprint o Step Profile dentro del chart.
- La escena conserva proporción 16:9 y `object-fit: contain` para no cortar paneles en desktop,
  tablet ni mobile.
- Se elimina la cartela superpuesta sobre la captura: toolbar, contador y selectores externos ya
  comunican el estado sin tapar el producto.

## Ajuste visual R5

- Footprint y Step Profile separan 12 px la posición vertical total de sus dos barras: la cerrada
  baja 6 px y la actual sube 6 px.
- Las dos filas eliminan wrapper visual de card, surface, borde, radio y sombra tanto en el
  contenedor editorial como en el área SVG; los otros cuatro primitivos conservan su tratamiento.

## Simplificación narrativa R6

- Se elimina por completo `The blind spot`, incluido su ledger y el diagrama OHLC/Volume at Price.
- El CTA secundario del hero pasa de `#blind-spot` a `#modes` y se renombra `Explore market
  primitives`.
- Market primitives, One clock, Session evidence y The workspace se renumeran 01–04.
- El CSS específico de la sección retirada se elimina; no quedan wrappers ni selectores huérfanos.

## Paneles compactos y composición R7

- El tratamiento unframed de R5 se extiende a Candles, Volume Profile, DOM y Last Trades: las seis
  filas y sus marcos visuales quedan sin surface, borde, radio ni sombra.
- Compact DOM crece de 420 a 500 px máximos, queda centrado y deja de aplicar elipsis a valores de
  ladder. Añade el context header, las cabeceras PRICE/Δ/SIZE/LAST y settings de price grouping.
- Compact Time & Sales añade el context header, las cabeceras TIME/PRICE/SIZE y settings para All
  trades, Buys only y Sells only.
- Los popovers son funcionales y conservan el contrato de foco: Escape cierra y devuelve el foco al
  trigger; pointer fuera cierra sin bloquear el destino.

## Escala de precio del Volume Profile R8

- El perfil aislado reserva un eje derecho equivalente al del chart profesional, con surface y
  borde propios del eje pero sin recuperar el wrapper exterior de la fila.
- Los nueve precios se formatean con el formatter compartido y se alinean con el centro de sus nueve
  niveles bid/ask.
- VAH, POC y VAL conservan sus labels a la izquierda y sus líneas punteadas terminan en el límite del
  plot antes del eje.

## Profundidad ambiental y Last Trades R9

- Last Trades pasa de tres a seis ejecuciones y compacta cada fila a 42 px; conserva panel, context
  header, settings y filtros compartidos.
- Cada área visual recibe un backdrop SVG decorativo, neutral y no interactivo. Candles usa una
  trayectoria, Footprint una matriz, Step Profile escalones, Volume Profile contornos horizontales,
  DOM rails laterales y Trades dos flujos laterales.
- Los seis backdrops comparten trazo, puntos, baja opacidad y movimiento lento, pero usan keyframes
  distintos. Permanecen detrás de los datos y no recuperan surface, wrapper, gradiente o shadow.
- `IntersectionObserver`, `document.hidden` y `prefers-reduced-motion` gobiernan también el motion
  ambiental; el contenido y su profundidad siguen visibles en estado estático.

## Retícula estática R10

- Los seis backdrops SVG y sus keyframes se retiran; R9 permanece como snapshot histórico publicado.
- Cada visual usa una retícula CSS común de 36 px formada por dos gradientes lineales y desvanecida
  con máscara radial.
- La retícula reutiliza `--pro-subtle`, mantiene opacidad 0.26 y no se anima en ningún estado.
- El motion queda limitado a datos explicativos: última vela, order flow, perfil, DOM y trades.

## Copy orientado a valor R11

- Se sustituyen los eyebrows que parecían un registro técnico —cantidades de barras o filas,
  `updates` y nombres de estados— por mensajes sobre la lectura que aporta cada superficie.
- Candles presenta dirección y momentum; Footprint, presión ejecutada; Step Profile, concentración;
  Volume Profile, aceptación; DOM, liquidez disponible; y Time & Sales, ritmo de ejecución.
- Hero, navegación, métricas, callouts, secciones, CTAs, cierre y estados de carga comparten la misma
  narrativa: entender cómo se forma un movimiento y conservar el contexto entre vistas.
- El vocabulario técnico se mantiene solo cuando identifica una herramienta real y su explicación
  aporta significado. Apex sigue presentándose como producto, sin afirmar conexión a broker ni
  operativa en vivo.

## Arquitectura React vigente

```text
src/components/landing/
  DeferredMarketPrimitivesShowcase.jsx
  HeroModeCarousel.jsx
  MarketPrimitivesShowcase.jsx
  marketPrimitiveFixtures.js
```

- `DeferredMarketPrimitivesShowcase` solicita el chunk al aproximarse al viewport.
- `MarketPrimitivesShowcase` comparte un único reloj de cuatro fases entre las seis escenas.
- `CandlesLayer`, `FootprintLayer` y `StepProfileLayer` siguen siendo las capas reales del producto.
- `CompactDom` y `CompactTimeSales` viven junto a los componentes profesionales y reutilizan sus
  filas, formato, headers, settings y tokens sin modificar el comportamiento por defecto de
  `/demo`.
- Volume Profile reutiliza `deriveSessionProfileBarGeometry` y los mismos roles visuales del chart.
- `marketPrimitiveFixtures` es puro, pequeño, determinista y cubierto por unit tests.
- El prototipo R1 `ScrollScene` + `ChartModesShowcase` y el modo memory-only de `MarketChart` se
  retiran completamente: ya no son necesarios para la landing.

## Datos y movimiento

- `/` no inicializa `useProfessionalPlayback()` ni solicita `/data/tardis/**`.
- Los seis módulos comparten un fixture generado y no se presentan como datos históricos.
- El reloj avanza cada 1,4 s solo cuando la escena está próxima al viewport y el documento visible.
- `document.hidden` pausa el reloj.
- `prefers-reduced-motion` fija la fase 0 completa; ninguna explicación depende del movimiento.
- No se usan números aleatorios ni un render React por píxel de scroll.
- Solo cambia el close de la quinta vela en Candles; las cuatro velas cerradas y los extremos de la
  actual conservan identidad y valores.
- Footprint y Step Profile mantienen su primera barra estable y actualizan solo la segunda.
- DOM contiene exactamente 3 asks + last + 3 bids y Last Trades exactamente 6 filas.

## Responsive y rendimiento

- Desktop: fila de 324 px mínimo, visual máximo de 560 × 260 y copy adyacente.
- Tablet: dos columnas flexibles sin ocultar contenido.
- Mobile 390: una columna, visual con proporción propia y cero overflow horizontal.
- La terminal completa no se monta en `/`; `MarketChart` no forma parte del chunk de la escena.
- El chunk lazy de los módulos debe permanecer pequeño y justificarse con contenido visible.
- `DemoPage` continúa lazy y es el único propietario del replay histórico.

## Figma

Archivo maestro: `Ze9eGnPaNDj8u0oB1iUt3C`.

| Contrato                                | Node ID                            | Estado                         |
| --------------------------------------- | ---------------------------------- | ------------------------------ |
| Sección Interactive portfolio landing   | `656:7412`                         | Preservada                     |
| R1 desktop / mobile / motion storyboard | `656:7413`, `656:7414`, `656:7415` | Snapshot aprobado y sustituido |
| R2 · Isolated modules                   | `688:21215`                        | Contrato vigente               |
| R2 · Candles                            | `688:21217`                        | Cinco velas                    |
| R2 · Footprint                          | `688:21218`                        | Una vela                       |
| R2 · Step Profile                       | `688:21219`                        | Una vela                       |
| R2 · Volume Profile                     | `688:21220`                        | Perfil aislado                 |
| R2 · DOM                                | `688:21221`                        | 3 asks + last + 3 bids         |
| R2 · Last Trades                        | `688:21222`                        | Tres ejecuciones               |

R2 reutiliza instancias de los masters Candles `132:3266`, Footprint `132:867`, Step Profile
`167:2377`, DOM `103:59` y Time Sales `144:1810` dentro de crops editables. Volume Profile se
representa como geometría vectorial aislada ligada a las variables locales. Direction B y todos los
masters permanecen intactos.

R3–R11 están implementados en código, pero todavía no se han sincronizado con Figma. R4 ajusta
además el encuadre del carrusel únicamente en código. R2 se conserva como referencia
aprobada; no debe declararse paridad Figma/código hasta crear o actualizar una revisión preservando
IDs y masters.

## Fases y ledger reanudable

| Fase                               | Estado   | Evidencia / artefactos                                                                                         | Siguiente acción           |
| ---------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- | -------------------------- |
| 0 · Baseline                       | complete | `docs/verification/2026-08-30-interactive-portfolio-landing-baseline.md`                                       | —                          |
| 1 · Figma R1                       | complete | `656:7413`, `656:7414`, `656:7415`; aprobación del 2026-08-30                                                  | Preservada como snapshot   |
| 2 · Prototipo R1                   | complete | `docs/verification/2026-08-30-interactive-portfolio-landing-phase2-local.md`                                   | Sustituido por feedback R2 |
| 3 · Revisión Figma R2              | complete | `688:21215`; `output/figma/interactive-landing-isolated-modules-r2.png`                                        | Sincronizar código         |
| 4 · Módulos React y composición    | complete | Seis escenas aisladas, carga lazy, fixture compartido, imágenes de UI completa limitadas a contexto            | Cerrar docs y QA           |
| 5 · Contratos, documentación y QA  | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-isolated-modules-local.md`; capturas Playwright    | —                          |
| 6 · Release y verificación pública | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-production.md`; Railway `SUCCESS` para `23879f6e…` | —                          |
| 7 · Refinamiento R3 local          | complete | Carrusel, alternancia, OHLC válido, dos barras order-flow y landing 21/21                                      | Sincronizar Figma          |
| 8 · Release R3                     | complete | `874648af…`; Railway `59df0562…`; UI pública R3 verificada                                                     | —                          |
| 9 · Sincronización Figma R3–R11    | pending  | R2 permanece como referencia aprobada; runtime publicado ejecuta R10 y R11 está local                          | Requiere trabajo Figma     |
| 10 · Hero workstation completo R4  | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-r4-full-workstation-hero-local.md`; 21/21 E2E      | —                          |
| 11 · Order flow unframed R5         | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-r5-order-flow-unframed-local.md`; 21/21 E2E         | —                          |
| 12 · Release R4/R5                  | complete | `db5effee…`; Railway `99f97679…`; assets, rutas y UI pública verificadas                                        | —                          |
| 13 · Simplificación narrativa R6    | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-r6-narrative-simplification-local.md`; 21/21 E2E   | Publicar solo con permiso  |
| 14 · Paneles compactos unframed R7  | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-r7-panel-settings-unframed-local.md`; 21/21 + 2/2 | Publicar con R6            |
| 15 · Release R6/R7                  | complete | `3b625f9…`; Railway `966c184c…`; rutas, bundles y UI pública verificadas                                        | —                          |
| 16 · Price scale R8 local           | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-r8-volume-profile-price-scale-local.md`; 21/21 E2E | Publicar solo con permiso  |
| 17 · Release R8                     | complete | `c6d941e…`; Railway `a62124bc…`; UI pública desktop/mobile verificada                                          | —                          |
| 18 · Ambient depth R9 local         | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-r9-ambient-depth-local.md`; 21/21 E2E              | —                          |
| 19 · Release R9                     | complete | `2169d902…`; Railway `f38993ff…`; UI pública desktop/mobile verificada                                         | —                          |
| 20 · Static faded grid R10 local    | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-r10-static-grid-local.md`; 21/21 E2E               | —                          |
| 21 · Release R10                    | complete | `91da3add…`; Railway `3aa05fe2…`; UI pública desktop/mobile verificada                                         | —                          |
| 22 · Copy orientado a valor R11     | complete | `docs/verification/2026-08-31-interactive-portfolio-landing-r11-user-value-copy-local.md`; 21/21 E2E          | Publicar solo con permiso  |
| 23 · Release R11                    | pending  | Sin commit, push ni despliegue                                                                                  | Requiere autorización      |

Estados permitidos: `pending`, `in_progress`, `blocked`, `complete`.

## Criterios de aceptación

- `/` presenta Apex como demo funcional de una UI de trading avanzada.
- El hero y cada sección explican una capacidad o una lectura útil para el usuario final; ningún
  tagline enumera filas, barras, estados de actualización ni detalles de fixture.
- Hay seis filas visuales aisladas, todas unframed, y ninguna monta `.market-chart` ni paneles
  vecinos.
- Candles contiene cinco velas próximas y solo cambia el close de la última dentro de extremos
  válidos.
- Footprint y Step Profile contienen una vela pasada estable y una actual.
- Volume Profile no muestra candles ni el resto del chart.
- Volume Profile muestra nueve precios en un eje derecho, alineados con sus nueve niveles, sin card
  exterior.
- DOM contiene exactamente 3 asks + last + 3 bids al abrir, queda centrado y no trunca cifras.
- DOM y Last Trades muestran su context header y settings funcionales con foco restaurado al cerrar.
- Last Trades contiene exactamente seis ejecuciones con el filtro All trades y mantiene una altura
  compacta mediante filas de 42 px.
- Cada primitivo incluye la misma retícula CSS neutral y no semántica, desvanecida hacia los bordes
  y sin animación en cualquier estado de motion.
- Las fases son deterministas, se pausan fuera de viewport/pestaña y respetan reduced motion.
- Mobile 390 no tiene overflow ni paneles desktop ilegibles.
- `/` no solicita `/data/tardis/**` ni altera preferencias persistidas de `/demo`.
- `/demo`, modos, paneles, foco, rutas y Storybook no tienen regresiones.
- Antes de cerrar la fase 9, Figma y código deben describir el mismo contrato R11; hasta entonces el
  gap permanece explícito en `docs/figma/README.md`.
- Railway sirve el commit exacto con estado `SUCCESS` antes de declarar la publicación.

## Gates obligatorios

```bash
git diff --check
pnpm run check:docs
pnpm run lint
pnpm run test:unit
pnpm run build
```

Además:

- landing E2E en Chromium, Firefox y WebKit;
- regresión focalizada de `/demo` en Chromium;
- QA visual 1440 × 1000 y 390 × 844;
- consola sin errores y ausencia de requests `/data/tardis/**` en `/`;
- revisión del diff y del chunk lazy;
- tras publicar: Railway `SUCCESS`, commit exacto, rutas `/`, `/demo`, modos y `/storybook/`, assets
  públicos y comprobación visual directa.

## Frontera de publicación

Resolver primero, mediante comprobaciones read-only, la rama, remote, proyecto, entorno y servicio.
El commit debe contener únicamente esta iniciativa. Un build local o un HTTP 200 aislado no prueban
la release. Si Railway no alcanza `SUCCESS` con el hash exacto, o la UI pública no coincide con R2,
la fase 6 permanece incompleta.
