---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Landing and routing specification

## Landing pública

`/` conserva la narrativa Beyond the candle y sustituye las antiguas lecturas raster por el contrato
R2 de módulos aislados `688:21215`. La sección `Market primitives` contiene Candles, Footprint, Step
Profile, Volume Profile, Liquidity Heatmap, DOM y Last Trades como escenas React compactas de dos columnas. Las filas
alternan visual y copy para crear ritmo editorial sin montar la terminal ni un `MarketChart`
completo. Opening thesis usa un vídeo generado desde la workstation real, con el mismo encuadre y
Candles, Footprint o Step Profile como única variación. El foco actual termina en las vistas aisladas
y no añade una sección de producto adicional.

El marco del vídeo usa el borde neutro de la superficie; no añade una franja superior de color acento.

La antigua sección `The blind spot` y su comparación OHLC/Volume at Price se retiran en R6 porque
repetían la tesis del hero sin añadir una lectura accionable. El CTA secundario del hero enlaza a
`https://devsigner.xyz` en una pestaña nueva y la sección visible se limita a Market primitives 01.

El copy público está en inglés y presenta cada lectura por la pregunta de mercado que ayuda a
responder. Los eyebrows comunican dirección, presión, concentración, aceptación, liquidez y ritmo
de ejecución; no enumeran cantidades de elementos, estados de animación ni detalles de fixture. Los
valores de los módulos son fixtures deterministas de interfaz; no se afirman como replay histórico,
ni Apex se presenta como broker o plataforma de trading conectada.

El hero usa el titular `See beyond the candles.` y declara de forma breve que la experiencia es una
demo de portfolio personal de `devsigner.xyz`, no una herramienta para operar en vivo.

Las filas de modos de gráfico se presentan sin numeración decorativa; la jerarquía se apoya en el
nombre de la herramienta y en la explicación de la lectura.

La única sección editorial navegable es `#modes`. El CTA principal `Open demo` es un anchor real hacia
`/demo`; el CTA secundario `Visit devsigner.xyz` abre `https://devsigner.xyz` en una pestaña nueva.
La navegación primaria
incluye `Component library`, un enlace mismo-origen hacia `/storybook/` para explorar superficies
aisladas con datos deterministas. Los enlaces externos a Devsigner abren una pestaña nueva con
`noopener noreferrer`. La atribución declara discretamente que Apex Trader está diseñado y
construido por Devsigner y presentado como case study público interactivo.

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

El runtime de la landing referencia `hero-replay.mp4` y `hero-replay.webm` en `public/media/`. El
vídeo es una grabación 1600 × 900 de la aplicación real, conserva la workstation completa y recorre
Candles, Footprint y Step Profile en un loop de 12,12 s. El poster `hero-terminal-candles.png` cubre
la carga inicial y el fallback del navegador. El contenedor mantiene su proporción 16:9 y usa
`object-fit: contain`, también en mobile, para no recortar paneles. Los exports históricos no
referenciados permanecen físicamente en `public/media/`; esta iniciativa no autoriza borrarlos.

El vídeo empieza siempre en Candles y avanza Candles → Footprint → Step Profile cada 4,2 s. Se pausa
fuera de viewport, con la pestaña oculta o mediante su control visible; elegir manualmente un modo
busca el segmento correspondiente y pausa la reproducción. `prefers-reduced-motion` conserva el
poster estático y mantiene los tres selectores manuales.

## Contrato de los módulos aislados

- Candles: cinco barras cercanas; las cuatro cerradas son estables y la quinta mueve solo el close
  dentro de un open/high/low válido y estable durante el bucle.
- Footprint: dos barras de nueve niveles bid/ask; la primera permanece cerrada 6 px por debajo y la
  segunda actualiza niveles, delta y volumen finitos 6 px por encima.
- Step Profile: dos barras de nueve niveles; la primera permanece cerrada 6 px por debajo y la
  segunda actualiza su distribución, delta y volumen finitos 6 px por encima.
- Ninguna de las siete filas usa surface, borde, radio ni sombra de card en la fila o en el marco del
  visual; conservan únicamente la retícula editorial y el componente aislado. La columna de copy no
  añade separadores verticales.
- Volume Profile: nueve niveles y marcadores POC/VAH/VAL sin candles de fondo. La escena se centra
  en la distribución y no añade una escala de precios lateral.
- Liquidity Heatmap: líneas continuas de intensidad por precio y tiempo, con un glow muy sutil y un
  header de contexto. El fixture local procede de una muestra estática del replay de 30 min; su
  settings popover reutiliza el slider real de intensidad, de 20% a 100% en pasos de 5%, sin
  solicitar tiles en runtime.
- DOM: panel centrado de hasta 500 px con context header, cabeceras de columna, exactamente tres
  asks, last price y tres bids. Ninguna cifra usa elipsis. Settings cambia el price grouping de
  forma transitoria y actualiza metadata, filas y cantidades agregadas. En la animación, el last
  price y el spread avanzan por estados alineados al tick junto con las cotizaciones.
- Last Trades: panel centrado de hasta 500 px con context header, cabeceras de columna y exactamente
  seis ejecuciones en `All trades`. Settings filtra transitoriamente por all, buy o sell y actualiza
  tanto el resumen del header como las filas visibles.
- Los siete visuales incluyen una retícula CSS no semántica detrás del dato principal. Dos gradientes
  lineales forman el grid y una máscara radial lo desvanece hacia los bordes. La capa comparte tokens
  neutrales, no se anima y no depende del estado del reloj de datos.
- Un reloj de cuatro fases, activo solo cerca del viewport y con el documento visible, coordina los
  siete módulos. `prefers-reduced-motion` conserva la fase 0 completa.

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
