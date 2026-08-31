---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Landing and routing specification

## Landing pública

`/` conserva la narrativa Beyond the candle y sustituye las antiguas lecturas raster por el contrato
R2 de módulos aislados `688:21215`. La sección `Market primitives` contiene Candles, Footprint, Step
Profile, Volume Profile, DOM y Last Trades como escenas React compactas de dos columnas. Las filas
alternan visual y copy para crear ritmo editorial sin montar la terminal ni un `MarketChart`
completo. Opening thesis usa un carrusel de tres exports reales del workstation completo, todos con
el mismo encuadre y con Candles, Footprint o Step Profile como única variación. The workspace
mantiene una imagen optimizada adicional porque también muestra la composición completa.

La antigua sección `The blind spot` y su comparación OHLC/Volume at Price se retiran en R6 porque
repetían la tesis del hero sin añadir una lectura accionable. El CTA secundario enlaza directamente a
`#modes` y las secciones visibles se numeran Market primitives 01, One clock 02, Session evidence 03
y The workspace 04.

El copy público está en inglés y presenta cada lectura por su función. Los valores de los módulos
son fixtures deterministas de interfaz; no se afirman como replay histórico, ni Apex se presenta
como broker o plataforma de trading conectada.

Las secciones son navegables mediante `#modes`, `#session` y `#workspace`. Los CTA principales son anchors reales hacia `/demo`; la navegación primaria incluye `Components`, un enlace mismo-origen hacia `/storybook/` para explorar superficies aisladas con datos deterministas. Los enlaces externos a Devsigner abren una pestaña nueva con `noopener noreferrer`. La atribución declara discretamente que Apex Trader está diseñado y construido por Devsigner y presentado como case study público interactivo.

## Rutas

| URL                  | Resultado           | Política                               |
| -------------------- | ------------------- | -------------------------------------- |
| `/`                  | Landing Direction B | Canónica                               |
| `/demo`              | Candles             | Canónica                               |
| `/demo/footprint`    | Footprint           | Canónica                               |
| `/demo/step-profile` | Step Profile        | Canónica                               |
| `/storybook/`        | Component library   | Catálogo estático generado en el build |
| `/price-chart`       | Candles             | `replaceState` a `/demo`               |
| `/footprint`         | Footprint           | `replaceState` a `/demo/footprint`     |
| `/step-profile`      | Step Profile        | `replaceState` a `/demo/step-profile`  |
| Cualquier otra       | Landing             | `replaceState` a `/`                   |

`src/app/routes.js` es la fuente pura para resolver y construir rutas. `App.jsx` es el único propietario de `pushState`, `replaceState` y `popstate`; `ProfessionalTerminal` solo solicita un cambio de modo.

## Biblioteca de componentes

`pnpm run storybook` abre el explorador local en el puerto 6006. `pnpm run build:storybook` genera su salida en `dist/storybook`; el build de producción lo ejecuta después de Vite para publicar la ruta `/storybook/` junto con la landing. Las historias Canvas importan los estilos ejecutables de Apex y presentan fixtures locales; no cargan el replay histórico ni solicitan assets bajo `/data/tardis/**`. El catálogo cubre foundations, las seis variantes activas de MarketChart (Candles, Footprint y Step Profile con volumen mostrado u oculto), las cinco vistas de Activity y el panel/matriz de ejecución. Line no se publica como modo activo: permanece como variante Figma legado.

## Frontera de carga

La landing no importa ni inicializa `ProfessionalTerminal` ni `useProfessionalPlayback`.
`DemoPage` se carga mediante `React.lazy` y es el único propietario del hook de replay. Visitar `/`
no debe solicitar ningún asset bajo `/data/tardis/**`.

`MarketPrimitivesShowcase` vive en un chunk lazy propio. Un `IntersectionObserver` permite
solicitarlo solo cuando la sección se aproxima al viewport; sus fixtures compactos son locales y no
activan manifest, book, trades ni tiles del replay. Reutiliza las capas SVG reales de Candles,
Footprint y Step Profile, la geometría del Volume Profile y filas compartidas de DOM/Time & Sales,
pero no monta `.market-chart`, resizers ni paneles vecinos. DOM y Time & Sales sí conservan su
context header y su settings popover real porque ambos controles modifican el módulo aislado.

El runtime de la landing referencia cuatro PNG de `public/media/`: Opening thesis precarga
`hero-terminal-candles.png`, `hero-terminal-footprint.png` y `hero-terminal-step-profile.png` para
que el crossfade no muestre estados vacíos. Los tres assets son capturas 1600 × 900 de la aplicación
real, conservan el workstation completo y el mismo viewport; solo cambia el modo del gráfico. El
contenedor mantiene su proporción 16:9 y usa `object-fit: contain`, también en mobile, para no
recortar paneles. El terminal completo de The workspace usa lazy loading. Los exports históricos no
referenciados permanecen físicamente en `public/media/`; esta iniciativa no autoriza borrarlos.

El carrusel empieza siempre en Candles y avanza Candles → Footprint → Step Profile cada 4,2 s con
un crossfade de 420 ms. Se pausa fuera de viewport, con la pestaña oculta o mediante su control
visible; elegir manualmente un modo también pausa la rotación. `prefers-reduced-motion` conserva
Candles estático, mantiene los tres selectores manuales y elimina la transición.

## Contrato de los módulos aislados

- Candles: cinco barras cercanas; las cuatro cerradas son estables y la quinta mueve solo el close
  dentro de un open/high/low válido y estable durante el bucle.
- Footprint: dos barras de nueve niveles bid/ask; la primera permanece cerrada 6 px por debajo y la
  segunda actualiza niveles, delta y volumen finitos 6 px por encima.
- Step Profile: dos barras de nueve niveles; la primera permanece cerrada 6 px por debajo y la
  segunda actualiza su distribución, delta y volumen finitos 6 px por encima.
- Ninguna de las seis filas usa surface, borde, radio ni sombra de card en la fila o en el marco del
  visual; conservan únicamente la retícula editorial y el componente aislado.
- Volume Profile: nueve niveles y marcadores POC/VAH/VAL sin candles de fondo. Una escala de precio
  a la derecha reproduce el eje del chart profesional y alinea cada etiqueta con su nivel.
- DOM: panel centrado de hasta 500 px con context header, cabeceras de columna, exactamente tres
  asks, last price y tres bids. Ninguna cifra usa elipsis. Settings cambia el price grouping de
  forma transitoria y actualiza metadata, filas y cantidades agregadas.
- Last Trades: panel centrado de hasta 500 px con context header, cabeceras de columna y exactamente
  seis ejecuciones en `All trades`. Settings filtra transitoriamente por all, buy o sell y actualiza
  tanto el resumen del header como las filas visibles.
- Los seis visuales incluyen una retícula CSS no semántica detrás del dato principal. Dos gradientes
  lineales forman el grid y una máscara radial lo desvanece hacia los bordes. La capa comparte tokens
  neutrales, no se anima y no depende del estado del reloj de datos.
- Un reloj de cuatro fases, activo solo cerca del viewport y con el documento visible, coordina los
  seis módulos. `prefers-reduced-motion` conserva la fase 0 completa.

## Estado de publicación

El contrato R2 está publicado en `apex.devsigner.xyz`. Railway alcanzó `SUCCESS` para el commit
funcional `23879f6e6c669b4dae471d46add8c4eadaa05300`; rutas, assets, desktop, mobile, consola y los modos
Footprint/Step Profile se comprobaron directamente. La evidencia está en
[Interactive portfolio landing · production verification](../verification/2026-08-31-interactive-portfolio-landing-production.md).

La revisión R3 está publicada en `apex.devsigner.xyz`. Railway alcanzó `SUCCESS` para el commit
funcional `874648af51d5af496a3fde26d634dff84ba91bcc` mediante el deployment
`59df0562-4a17-4109-a226-e8a76c13113a`. Se comprobaron rutas, assets, carrusel, alternancia,
Candles, dos barras Footprint/Step Profile, mobile, reduced motion, consola y ausencia de requests
históricos. La evidencia está en
[Interactive portfolio landing R3 · production verification](../verification/2026-08-31-interactive-portfolio-landing-r3-production.md).

R4 y R5 están publicados en `apex.devsigner.xyz`. Railway alcanzó `SUCCESS` para el commit funcional
`db5effee2f877486326e508f9cc44b64b05073b5` mediante el deployment
`99f97679-f8e0-43fe-95b6-ff97c875b860`. Se comprobaron el hero completo en desktop/mobile, los tres
assets 1600 × 900, las filas unframed y escalonadas de Footprint/Step Profile, las rutas de demo,
Storybook y la consola. La evidencia está en
[Interactive portfolio landing R5 · production verification](../verification/2026-08-31-interactive-portfolio-landing-r5-production.md).

R6 y R7 están publicados en `apex.devsigner.xyz`. Railway alcanzó `SUCCESS` para el commit funcional
`3b625f9095bdfddfd4b242692f5724756ad5418b` mediante el deployment
`966c184c-cd6c-45cf-8d9c-269b734853df`. Se comprobaron rutas, bundles, retirada de The blind spot,
seis filas unframed, DOM centrado y sin truncado, settings de DOM/Trades, mobile y consola. La
evidencia está en [Interactive portfolio landing R6/R7 · production verification](../verification/2026-08-31-interactive-portfolio-landing-r7-production.md).

R8 está publicado en `apex.devsigner.xyz`. Railway alcanzó `SUCCESS` para el commit funcional
`c6d941e8e2b39d68dfac8878cd3605e45671a4bc` mediante el deployment
`a62124bc-c704-4444-a57b-5e98c6ae6263`. Se comprobaron las rutas públicas, los nueve precios del
Volume Profile, su alineación, el responsive 390 × 844 y la consola. La evidencia está en
[Interactive portfolio landing R8 · production verification](../verification/2026-08-31-interactive-portfolio-landing-r8-production.md).

R9 está publicado en `apex.devsigner.xyz`. Railway alcanzó `SUCCESS` para el commit funcional
`2169d902015a4b449d13f71f59e5d38e73d73243` mediante el deployment
`f38993ff-91e7-49f6-bb74-ff5aec1f6768`. Se comprobaron seis ejecuciones en Last Trades, los seis
fondos ambientales, settings, desktop/mobile, rutas y consola. La evidencia está en
[Interactive portfolio landing R9 · production verification](../verification/2026-08-31-interactive-portfolio-landing-r9-production.md).

R10 está publicado en `apex.devsigner.xyz`. Railway alcanzó `SUCCESS` para el commit funcional
`91da3addf94fafe528ed79242690233cebc7e6f0` mediante el deployment
`3aa05fe2-6570-48cb-baf2-76df8a91d4b8`. Se comprobaron la retícula estática y desvanecida en los
seis módulos, ausencia de motion decorativo, seis trades, desktop/mobile, rutas y consola. La
evidencia está en [Interactive portfolio landing R10 · production verification](../verification/2026-08-31-interactive-portfolio-landing-r10-production.md).
