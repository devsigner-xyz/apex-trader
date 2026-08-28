---
status: current
last_verified: 2026-08-28
owners: product-engineering
---

# Historical liquidity heatmap

## Propósito

Candles puede mostrar una capa de liquidez histórica detrás de OHLC. Cada píxel representa el
tamaño agregado de órdenes limit resting —bids y asks— en un intervalo de tiempo y precio. No
representa órdenes individuales, identidad de participantes, intención ni garantía de ejecución.

La capa usa el mismo order book top-200 real de Bybit Spot BTCUSDT del 31 de julio de 2026 que
alimenta el DOM. No usa datos de derivados, profundidad sintética ni liquidez derivada de trades.

## Contrato de datos

- La ingesta `scripts/bybit-ingest.mjs` reconstruye snapshots y deltas `orderbook.200` y genera 96
  tiles de 15 min. Tamaño cero elimina el nivel y cada chunk contiene un checkpoint exacto.
- El muestreo visual es de 5 segundos y el bin de precio de 1 USDT. Son resoluciones de
  presentación; la fuente descargada conserva mensajes top-200 verificables.
- Cada celda conserva el tamaño total bid + ask en centésimas de BTC dentro de `uint16`, con clip
  documentado en 655,35 BTC.
- La escala cromática usa `log1p` y el percentil 99,5 de celdas no vacías de toda la sesión,
  actualmente 14,24 BTC. La comparación es consistente entre tiles y no se renormaliza al hacer
  pan o zoom.
- El renderer intersecta explícitamente viewport, `liquidityStart`, `liquidityEnd` y reloj del
  replay. Nunca solicita ni pinta tiles anteriores a la sesión L2, posteriores al reloj o dentro
  del pre-roll.
- Los tiles cubren el intervalo de precio `[62.196, 65.673)` USDT en bins de 1 USDT. Fuera de ese
  dominio la capa queda vacía.

El runtime carga únicamente los tiles que intersectan el viewport visible. Los 96 assets de
liquidez suman 2.667.216 bytes comprimidos y comparten la caché versionada del replay. Se resuelven
mediante IDs allowlisted en `/api/market-data/assets/<assetId>`; en producción, el servicio emite
una redirección temporal al Railway Storage Bucket privado.

La sesión, los seis packs de pre-roll, la procedencia y los tres grupos de 96 chunks forman un
dataset v4 de 296 assets y 63.541.117 bytes. El manifest público no expone claves del bucket.

## Controles

Chart settings contiene:

- `LIQUIDITY HEATMAP`: visible por defecto y persistente.
- `INTENSITY`: 20–100%, en pasos de 5; 60% por defecto. Modifica opacidad, no los datos ni su
  normalización.

La persistencia usa `apex-trader:chart-liquidity:v1`. Al desactivar la capa se limpia el canvas y
el slider queda deshabilitado sin perder su valor. La capa está limitada a Candles; Footprint y
Step Profile no montan el canvas.

## Renderizado y accesibilidad

El heatmap usa Canvas 2D a resolución CSS debajo del SVG. El SVG sigue siendo responsable de
velas, grid, ejes, overlays, crosshair y foco. El canvas no recibe puntero, teclado ni semántica
duplicada; Chart settings ofrece el control accesible de la presentación.

Figma aún no contiene esta capa cuantitativa ni sus dos controles. Código y esta especificación
describen el estado ejecutable hasta que exista un alcance explícito de sincronización Figma.
