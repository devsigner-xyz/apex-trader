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
- Las filas Footprint y Step Profile no usan surface, borde, radio ni sombra de card en la fila o
  en el marco del visual; conservan únicamente la retícula editorial y el área SVG.
- Volume Profile: nueve niveles y marcadores POC/VAH/VAL sin candles de fondo.
- DOM: exactamente tres asks, last price y tres bids.
- Last Trades: exactamente tres ejecuciones.
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

El ajuste R4 del carrusel con tres vistas completas del workstation está implementado y verificado
solo en el checkout local. No se ha hecho commit, push ni despliegue para este alcance; producción
continúa sirviendo R3 hasta una autorización explícita de publicación. La evidencia está en
[Interactive portfolio landing R4 · full-workstation hero](../verification/2026-08-31-interactive-portfolio-landing-r4-full-workstation-hero-local.md).

El refinamiento R5 de Footprint y Step Profile está igualmente verificado solo en local y comparte
la misma frontera de publicación. La evidencia está en
[Interactive portfolio landing R5 · order-flow unframed](../verification/2026-08-31-interactive-portfolio-landing-r5-order-flow-unframed-local.md).
