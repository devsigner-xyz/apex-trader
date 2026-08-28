---
status: current
last_verified: 2026-08-28
owners: product-engineering
---

# Professional terminal specification

## Alcance

La terminal profesional es una experiencia desktop de replay histórico. Chart, DOM y Time & Sales comparten un único reloj y representan el mismo instante. Markets, Activity, cuenta y ejecución siguen siendo fixtures o simulación local salvo indicación contraria.

El ancho interno requiere aproximadamente 1920 px para acceso simultáneo a todos los paneles. A 1366–1440 px existe desplazamiento horizontal; una experiencia compacta o plegable sigue pendiente de decisión.

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

Modos actuales: Candles, Footprint y Step Profile. Candles soporta 5 min, 15 min, 30 min, 1 hour, 4 hours y 1 day; Step Profile llega hasta 4 hours y Footprint soporta 1 hour y 4 hours. Pan, zoom y timeframe actualizan el rango visible.

El significado visual y de datos de cada modo se define en [Chart patterns](../design-system/chart-patterns.md). Candles usa el acrónimo canónico OHLC; Footprint representa ejecuciones por precio y lado agresor; Step Profile repite un perfil por intervalo.

Candles muestra por defecto un [Historical liquidity heatmap](liquidity-heatmap.md) derivado del
L2 real, con visibilidad e intensidad persistentes en Chart settings. La capa respeta el viewport y
el reloj del replay y no se monta en Footprint o Step Profile. La profundidad L2 existe solo en la
sesión detallada; navegar por el pre-roll no solicita ni extiende artificialmente el heatmap.

### Histórico precargado

Cada timeframe carga un pack inmutable anterior al replay y lo combina con las barras que va
revelando el reloj. No existe selector de fechas, carga infinita ni petición de barras al alcanzar
el límite izquierdo: el pan se detiene en la primera vela precargada.

| Timeframe | Velas de pre-roll | Contexto aproximado |
| --------- | -----------------: | ------------------: |
| 5 min     |                288 |               1 día |
| 15 min    |                288 |              3 días |
| 30 min    |                336 |              7 días |
| 1 hour    |                336 |             14 días |
| 4 hours   |                180 |             30 días |
| 1 day     |                180 |            6 meses |

Cambiar timeframe selecciona otro pack, pero no cambia fecha ni crea un segundo reloj. DOM, Time
& Sales, countdown y barra parcial continúan siguiendo únicamente el replay detallado. Un fallo
del pack histórico deja operativo ese replay y se expone como estado aislado del chart.

### Interacción y viewport temporal

- Mover el puntero sobre una barra actualiza la toolbar con su `O`, `H`, `L`, `C`, `Δ` y `V`; al abandonar el gráfico vuelve a mostrar la barra actual del replay.
- Dentro del plot de precio, el puntero muestra guías horizontal y vertical punteadas. La horizontal no invade la escala de precio y la vertical conserva la misma coordenada temporal en el panel de volumen cuando este está visible.
- El puntero en reposo no muestra la mano. El pan se activa solo con el botón principal pulsado y conserva `grabbing` hasta `pointerup` o cancelación.
- El desplazamiento horizontal usa un offset lógico fraccional y se renderiza de forma continua. Una barra puede quedar parcialmente visible en cualquiera de los bordes sin saltar a intervalos enteros.
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

Deuda: el tamaño persistido del profile es legado aunque la anchura renderizada sea fija.

## Footer

`devsigner.xyz` es el único fragmento enlazado de `ApexTrader by devsigner.xyz`. Abre `https://devsigner.xyz` en una pestaña nueva con aislamiento `noopener noreferrer`; el texto anterior permanece informativo.

## DOM

- Sin título; context header de 44 px con `BTC · <grouping> · x<multiple>` y settings.
- Grouping: 0.10, 0.50, 1 y 5 USDT; cambiarlo recentra el spread.
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
- Limitación: las filas son botones sin acción implementada.

## Orders and positions

La tab bar mide 38 px, no muestra métricas globales y empieza en Positions sin persistencia.

| View           | Representación | Columnas o contenido                                              |
| -------------- | -------------- | ----------------------------------------------------------------- |
| Positions      | Tabla          | Symbol, Side, Qty, Entry, Mark, UPL, Opened, Action               |
| Orders         | Tabla          | Time, Symbol, Side, Type, Qty, Limit/Trigger, TIF, Status, Action |
| Fills          | Tabla          | Time, Symbol, Side, Qty, Fill Price, Fee, Liquidity, Order ID     |
| Activity       | Tabla          | Time, Event, Detail, Status, Account                              |
| Account & Risk | Composición    | Identidad SIM, P&L, fees, posiciones, órdenes y límites           |

`CLOSE` y `CANCEL` son danger; `DETAILS` es navegación neutral. Hoy son texto, no controles operativos. Account & Risk identifica `DEMO-001` como `SIMULATED ACCOUNT`; sus meters mantienen texto y semántica `progressbar` al 0%.

## Datos y accesibilidad

- Chart, DOM y Time & Sales usan el replay compartido de Bybit Spot BTCUSDT del 31 de julio de
  2026 UTC. El día conserva 481.468 trades reales y L2 top-200; no mezcla derivados ni genera
  profundidad sintética.
- El manifest `apextrader.market-dataset-manifest/v4` declara 296 assets inmutables y
  63.541.117 bytes: sesión, procedencia, seis packs de histórico y 96 chunks de book, trades y
  liquidez respectivamente.
- El navegador solo conoce IDs allowlisted y rutas same-origin bajo `/api/market-data/`. En
  producción, el servicio obtiene el manifest privado del Railway Storage Bucket y redirige cada
  asset a una URL GET firmada temporal; credenciales y claves internas nunca forman parte del
  manifest público.
- El manifest público se revalida; los assets content-addressed usan caché immutable. Un fallo de
  histórico o heatmap degrada esa capa sin detener chart, DOM o Time & Sales ya disponibles.
- Cache Storage es una optimización. Fallos al abrir, escribir o desalojar su caché no bloquean una
  respuesta histórica válida obtenida por red.
- Markets, Activity, cuenta y submit de Execution son demostración o simulación.
- Settings cierra con Escape o click exterior y debe llevar Tab al primer control habilitado.
- La tab bar tiene roles ARIA, pero Arrow/Home/End sigue pendiente.
- Focus trap y restauración explícita de foco siguen pendientes.
- La política responsive menor de 1920 px sigue pendiente.
