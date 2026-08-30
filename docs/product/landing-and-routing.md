---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Landing and routing specification

## Landing pública

`/` conserva la narrativa Beyond the candle y sustituye las antiguas lecturas raster por el contrato
R2 de módulos aislados `688:21215`. La sección `Market primitives` contiene Candles, Footprint, Step
Profile, Volume Profile, DOM y Last Trades como escenas React compactas de dos columnas. No monta la
terminal ni un `MarketChart` completo. Opening thesis y The workspace mantienen imágenes optimizadas
porque muestran el producto completo y una composición real sería ilegible a esa escala.

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
pero no monta `.market-chart`, settings, resizers ni controles profesionales.

El runtime de la landing referencia dos PNG de `public/media/`: Opening thesis usa carga eager y el
terminal completo de The workspace usa lazy loading. Los exports históricos no referenciados
permanecen físicamente en `public/media/`; esta iniciativa no autoriza borrarlos.

## Contrato de los módulos aislados

- Candles: cinco barras; solo la quinta actualiza high, low y close.
- Footprint: una barra y nueve niveles bid/ask.
- Step Profile: una barra y nueve niveles de distribución.
- Volume Profile: nueve niveles y marcadores POC/VAH/VAL sin candles de fondo.
- DOM: exactamente tres asks, last price y tres bids.
- Last Trades: exactamente tres ejecuciones.
- Un reloj de cuatro fases, activo solo cerca del viewport y con el documento visible, coordina los
  seis módulos. `prefers-reduced-motion` conserva la fase 0 completa.

## Estado de publicación

El contrato R2 está implementado en el checkout local. No se considera desplegado ni verificado en
`apex.devsigner.xyz` hasta una release con comprobación directa de Railway, commit, rutas, UI y
assets públicos.
