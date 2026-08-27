---
status: current
last_verified: 2026-08-27
owners: product-engineering
---

# Professional terminal specification

## Alcance

La terminal profesional es una experiencia desktop de replay histórico. Chart, DOM y Time & Sales comparten un único reloj y representan el mismo instante. Markets, Activity, cuenta y ejecución siguen siendo fixtures o simulación local salvo indicación contraria.

El ancho interno requiere aproximadamente 1920 px para acceso simultáneo a todos los paneles. A 1366–1440 px existe desplazamiento horizontal; una experiencia compacta o plegable sigue pendiente de decisión.

## Markets

- Sin título visible; toolbar de 42 px con búsqueda y settings.
- La búsqueda recorta espacios, ignora mayúsculas/minúsculas, filtra por substring y muestra `No markets found` sin coincidencias.
- `SYM` y `LAST` son obligatorias; `BID`, `ASK`, `Δ%` y `VOL` son opcionales.
- Las opcionales persisten en `apex-trader:markets-columns`; la búsqueda es transitoria.
- Limitación: las filas aún no cambian el mercado seleccionado.

## Chart

Modos actuales: Candles, Footprint y Step Profile. Timeframes soportados: 1 hour y 4 hours. Pan, zoom y timeframe actualizan el rango visible.

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

## DOM

- Sin título; context header de 44 px con `BTC · <grouping> · x<multiple>` y settings.
- Grouping: 0.01, 0.05, 0.10, 0.50, 1 y 5 USDT; cambiarlo recentra el spread.
- Asks y bids tienen scroll independiente; seleccionar precio lo copia a Execution.
- Grouping es transitorio.
- Price y Size son L2 histórico. `Δ` y `LAST` son presentación derivada.

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

- Chart, DOM y Time & Sales usan replay histórico compartido.
- Markets, Activity, cuenta y submit de Execution son demostración o simulación.
- Settings cierra con Escape o click exterior y debe llevar Tab al primer control habilitado.
- La tab bar tiene roles ARIA, pero Arrow/Home/End sigue pendiente.
- Focus trap y restauración explícita de foco siguen pendientes.
- La política responsive menor de 1920 px sigue pendiente.
