---
status: current
last_verified: 2026-08-29
owners: product-engineering
---

# Professional terminal specification

## Alcance

La terminal profesional es una experiencia desktop de replay histórico. Chart, DOM y Time & Sales comparten un único reloj y representan el mismo instante. Markets, Activity, cuenta y ejecución siguen siendo fixtures o simulación local salvo indicación contraria.

El ancho interno requiere aproximadamente 1920 px para acceso simultáneo a todos los paneles. En
móvil y tablet, la demo bloquea la workstation con un aviso que reutiliza el vídeo de la home,
explica que la experiencia está diseñada para escritorio y enlaza al detalle público del proyecto.
La terminal responsive o plegable sigue fuera del alcance actual.

## Rutas

- Candles: `/demo`.
- Footprint: `/demo/footprint`.
- Step Profile: `/demo/step-profile`.

El selector de modo actualiza la URL canónica sin reiniciar el reloj compartido. `/price-chart`, `/footprint` y `/step-profile` son aliases de compatibilidad y no rutas canónicas nuevas. Consulta [Landing and routing specification](landing-and-routing.md).

## Markets

- Sin título visible; toolbar de 42 px con búsqueda y settings.
- La búsqueda recorta espacios, ignora mayúsculas/minúsculas, filtra por substring y muestra `No markets found` sin coincidencias.
- `SYM` y `LAST` son obligatorias; `BID`, `ASK`, `Δ%` y `VOL` son opcionales.
- Las opcionales persisten en `apex-trader:markets-columns`; la búsqueda es transitoria.
- Limitación: las filas aún no cambian el mercado seleccionado.

## Chart

Modos actuales: Candles, Footprint y Step Profile. Candles y Step Profile soportan 5 min, 15 min,
30 min y 1 hour; Footprint soporta 1 hour. Candles inicia en 30 min. Pan, zoom y timeframe
actualizan el rango visible.

El significado visual y de datos de cada modo se define en [Chart patterns](../design-system/chart-patterns.md). Candles usa el acrónimo canónico OHLC; Footprint representa ejecuciones por precio y lado agresor; Step Profile repite un perfil por intervalo.

Candles muestra por defecto un [Historical liquidity heatmap](liquidity-heatmap.md) derivado del
L2 real, con visibilidad e intensidad persistentes en Chart settings. La capa respeta el viewport y
el reloj del replay y no se monta en Footprint o Step Profile.

Chart settings separa opciones comunes y específicas del modo. Profile, VAH/POC/VAL y volumen
permanecen visibles en todos los modos. Candles añade sus colores `up` y `down`, el heatmap y su
intensidad. Step Profile añade colores independientes para sus perfiles `bid` y `ask`. Los colores
aceptan selección libre, persisten en `apex-trader:chart-appearance:v1` bajo `candles` o
`stepProfile` y pueden volver a los tokens semánticos del sistema. Footprint no hereda ninguno de
esos valores y todavía no expone settings de color. Cuando el panel inferior está visible, sus
barras siguen el par de colores del modo activo: `up`/`down` en Candles y `bid`/`ask` en Step
Profile. En Step Profile, el delta positivo usa `bid` y el negativo usa `ask`, igual que el
perfil; en Footprint tanto el delta como las barras de volumen conservan los tokens semánticos del
sistema.

### Ventana de replay

La demo conserva la sesión Spot BTCUSDT de un día y empieza a reproducirla a las 16:30 UTC. Ese
punto ofrece 34 intervalos agregados de 30 min —incluida la vela activa— sin aumentar el dataset.
Al alcanzar el final de la sesión, el reloj vuelve a las 16:30 UTC y conserva cualquier pequeño
exceso del tick para que el loop sea continuo. Cualquier seek se limita a esta ventana de demo.

### Interacción y viewport temporal

- Mover el puntero sobre una barra actualiza la toolbar con su `O`, `H`, `L`, `C`, `Δ` y `V`; al abandonar el gráfico vuelve a mostrar la barra actual del replay.
- Dentro del plot de precio, el puntero muestra guías horizontal y vertical punteadas. La horizontal no invade la escala de precio y la vertical conserva la misma coordenada temporal en el panel de volumen cuando este está visible.
- El puntero en reposo no muestra la mano. El pan se activa solo con el botón principal pulsado y conserva `grabbing` hasta `pointerup` o cancelación.
- El desplazamiento horizontal usa un offset lógico fraccional y se renderiza de forma continua. Una barra puede quedar parcialmente visible en cualquiera de los bordes sin saltar a intervalos enteros.
- Con la densidad actual intacta, el drag hacia la izquierda puede desplazar el último dato hasta
  dejar un 30% del plot como espacio futuro a la derecha. Candles, Footprint, Step Profile, volumen
  y heatmap comparten ese desplazamiento. El margen futuro mantiene el seguimiento del dato más
  reciente; `0` elimina el margen y restaura el encaje al borde derecho. Si el heatmap está activo,
  el gesto conserva sus tiles cargados y lo repinta en el mismo frame visual sin flashes de carga.
- La carga inicial de Candles, Footprint y Step Profile, cada cambio de modo y cada cambio real de
  timeframe restauran la densidad por defecto y aplican el margen futuro máximo. No es padding
  fijo: el usuario puede arrastrar hacia la derecha para volver a situar datos bajo el Volume
  Profile. `0` conserva la salida explícita al encaje del borde derecho.
- El cálculo analítico incluye una barra cuando su centro temporal está dentro del plot. Las barras buffer recortadas fuera de ese criterio sirven únicamente para continuidad visual y no alteran profile, POC, VAH o VAL.
- Los límites de barras visibles son 28–160 para Candles, 4–13 para Footprint y 1–12 para Step Profile. Estos límites protegen respectivamente la separación máxima de velas y la legibilidad mínima de celdas densas.
- Los labels temporales se seleccionan según el ancho renderizado y conservan una separación mínima; el zoom-out reduce su cantidad antes de permitir solapamientos.
- El rango textual naranja situado antes en el extremo inferior derecho no forma parte del gráfico. El rango accesible y los controles de teclado se derivan del viewport, no de ese label visual.

`apex-trader:chart-panel-visibility:v1` persiste tres booleanos independientes: `profile` (barras), `valueArea` (líneas y etiquetas) y `volume` (panel inferior). Un estado legado sin `valueArea` se normaliza a `true`. Ocultar las barras no oculta los niveles activos.

### Visible-range volume profile

El cálculo usa las velas agregadas actualmente visibles y se recalcula con pan, zoom o timeframe:

1. Agrupa volumen bid y ask por precio.
2. POC es el nivel de mayor volumen total; un empate elige el precio inferior.
3. La value area parte del POC y añade el adyacente de mayor volumen hasta cubrir al menos 70%.
4. Si ambos adyacentes empatan, expande primero hacia arriba.
5. VAH y VAL son los extremos del área.

El profile ocupa 180 unidades SVG y se alinea a la derecha. Cada marcador es un chip sólido de 38 × 16 px, radio 2 px y texto centrado, anclado al borde derecho/base de las barras. La línea queda cubierta por el chip, no atraviesa el texto.

Su anchura no es redimensionable ni persistida: permanece fija en 180 unidades SVG. La key
`apex-trader:chart-panel-sizes:v1` persiste únicamente la altura del panel inferior `volume`.
Una lectura heredada con `profile` y `volume` conserva y limita `volume`; la siguiente escritura
canónica elimina `profile`.

## Footer

`devsigner.xyz` es el único fragmento enlazado de `ApexTrader by devsigner.xyz`. Abre `https://devsigner.xyz` en una pestaña nueva con aislamiento `noopener noreferrer`; el texto anterior permanece informativo.

## DOM

- Sin título; context header de 44 px con `BTC · <grouping> · x<multiple>` y settings.
- Grouping: 0.01, 0.05, 0.10, 0.50, 1 y 5 USDT; cambiarlo recentra el spread.
- Asks y bids tienen scroll independiente; seleccionar precio lo copia a Execution.
- Grouping es transitorio.
- Price y Size son L2 histórico. `Δ` y `LAST` son presentación derivada.
- El ladder termina directamente en los bids; no repite un resumen BID/ASK en el pie.

## Execution

- Sin título ni header; Buy/Sell es el primer bloque y Buy el estado inicial.
- Campos contextuales para Market, Limit, Stop Market, Stop Limit y OCO.
- Submit solo prepara una orden SIM local; no crea todavía una orden en Activity.

## Time & Sales

- Sin título; context header de 44 px con `BTC · Showing all/buys/sells` y settings.
- Metadata neutral; buy/sell colorea trades, no el resumen.
- Radio single-select: All trades, Buys only y Sells only.
- Filtro transitorio; máximo 20 trades coincidentes.
- Cada fila mide 26 px desde que aparece; las pocas filas iniciales no crecen para rellenar el panel.
- Limitación: las filas son botones sin acción implementada.

## Orders and positions

La tab bar mide 38 px, no muestra métricas globales y empieza en Positions sin persistencia.

| View           | Representación | Columnas o contenido                                              |
| -------------- | -------------- | ----------------------------------------------------------------- |
| Positions      | Tabla          | Symbol, Side, Qty, Entry, Mark, UPL, Opened, Action               |
| Orders         | Tabla          | Time, Symbol, Side, Type, Qty, Limit/Trigger, TIF, Status, Action |
| Fills          | Tabla          | Time, Symbol, Side, Qty, Fill Price, Fee, Liquidity, Order ID     |
| Activity       | Tabla          | Time, Event, Detail, Status, Account                              |
| Account & Risk | Resumen + modal | Identidad SIM, P&L, límites y disclosure detallado                |

`CLOSE` y `CANCEL` son danger; `DETAILS` es navegación neutral. Hoy son texto, no controles
operativos. Account & Risk prioriza Net P&L, su desglose y los límites principales. `VIEW MORE`
abre un modal con snapshot financiero, exposición y todos los límites, restaura foco al CTA al
cerrar y mantiene la identificación `DEMO-001 · SIMULATED ACCOUNT`. Sus meters conservan texto y
semántica `progressbar`, incluido el 0%.

## Datos y accesibilidad

- Chart, DOM y Time & Sales usan replay histórico compartido.
- El manifest mutable se revalida en cada visita. Durante una release, un manifest anterior sin
  tiles de liquidez sigue cargando el replay base; la capa de heatmap degrada de forma aislada.
- Cada operación de red del replay —manifest, sesión, book, trades o liquidez— admite como máximo
  tres intentos totales. El primero es inmediato y los dos siguientes esperan 100 ms y 200 ms. Se
  reintentan rechazos de transporte de `fetch` (`TypeError`, `NetworkError` y `TimeoutError`), HTTP
  408, 429 y 5xx. Son terminales una cancelación intencionada (`AbortError`), cualquier otro 4xx,
  un schema inesperado, JSON o gzip corrupto, y los errores de validación o normalización.
- La carga inicial conserva `Loading the real BTCUSDT session…` hasta que la operación se recupera
  o agota sus tres intentos. En un cambio de chunk, la última vista válida sigue montada con el
  estado interno de buffering mientras quedan intentos; al recuperarse, el replay limpia el error
  transitorio y continúa con el mismo reloj histórico. Solo el agotamiento de una carga requerida
  conserva el error fatal existente.
- El prefetch del siguiente chunk ignora su error después de agotar la misma política y elimina la
  promesa fallida para permitir una carga posterior. La liquidez también falla dentro de su propia
  capa, sin convertir el heatmap opcional en un error fatal de la terminal.
- Cache Storage es una optimización. Fallos al abrir, escribir o desalojar su caché no bloquean una
  respuesta histórica válida obtenida por red.
- Markets, Activity, cuenta y submit de Execution son demostración o simulación.
- Los settings de Markets, Chart, DOM y Time & Sales comparten un único contrato de foco sin
  modificar su contenido, persistencia ni estados locales. Al abrirlos, el trigger conserva el
  foco; el primer Tab llega al primer control habilitado y Tab/Shift+Tab recorren cíclicamente el
  trigger y los controles habilitados del panel. Los controles disabled no entran en ese recorrido.
- Escape desde cualquier control cierra el panel y devuelve el foco al trigger. Activar de nuevo
  el trigger lo cierra y conserva el foco allí. Un `pointerdown` exterior cierra el panel sin
  cancelar el foco nativo del destino pulsado. Los listeners se instalan solo mientras está abierto
  y se limpian al cerrar, re-renderizar o desmontar.
- Los triggers conservan `aria-controls`, `aria-expanded` y sus nombres; cada panel conserva
  `role="dialog"` y su nombre accesible. Los popovers no son modales: el resto de la terminal
  sigue siendo operable con pointer y un click exterior los cierra.
- Activity usa roving `tabIndex`: solo la tab activa tiene `tabIndex=0`; las demás tienen `-1`.
  ArrowLeft/ArrowRight seleccionan y enfocan la anterior/siguiente con wrap; Home y End van a los
  extremos. Enter, Space y click mantienen la activación nativa. Después de cada cambio,
  `aria-selected`, `aria-controls`, `aria-labelledby`, `role="tablist"`, `role="tab"` y
  `role="tabpanel"` continúan describiendo la vista activa.
- La política responsive menor de 1920 px sigue pendiente.
