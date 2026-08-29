---
status: current
last_verified: 2026-08-29
owners: product-engineering
---

# Historical liquidity heatmap

## Propósito

Candles puede mostrar una capa de liquidez histórica detrás de OHLC. Cada píxel representa el
tamaño agregado de órdenes limit resting —bids y asks— en un intervalo de tiempo y precio. No
representa órdenes individuales, identidad de participantes, intención ni garantía de ejecución.

La capa usa el mismo `incremental_book_L2` real de Binance BTCUSDT del 1 de diciembre de 2019 que
alimenta el DOM. No usa profundidad sintética ni deriva liquidez a partir de trades.

## Contrato de datos

- El artefacto fuente conserva 6.486.542 filas L2 agrupadas en 815.980 timestamps exactos.
- La ingesta `scripts/tardis-liquidity-tiles.mjs` reconstruye el libro y genera 96 tiles de 15 min.
- El muestreo visual es de 5 segundos y el bin de precio de 1 USDT. Son resoluciones de
  presentación; el L2 exacto permanece inalterado como fuente verificable.
- Cada celda conserva el tamaño total bid + ask en centésimas de BTC dentro de `uint16`, con clip
  documentado en 655,35 BTC.
- La escala cromática usa `log1p` y el percentil 99,5 de celdas no vacías de toda la sesión,
  actualmente 70,16 BTC. La comparación es consistente entre tiles y no se renormaliza al hacer
  pan o zoom.
- El renderer nunca pinta timestamps posteriores al reloj compartido del replay.
- En 5 min conserva la secuencia L2 muestreada cada 5 segundos. En 15 min, 30 min, 1 h y 4 h
  agrega cada nivel mediante la media temporal de las muestras del intervalo, incluidos los ceros.
  Así la intensidad prioriza liquidez persistente y no sobrerrepresenta órdenes fugaces.
- Los tiles cubren 6960–7792 USDT, incluyendo 250 USDT de padding sobre los extremos OHLC de la
  sesión. Fuera de ese dominio la capa queda vacía.

El runtime carga únicamente los tiles que intersectan el viewport visible. Los assets suman
3.080.573 bytes comprimidos y comparten la caché versionada del replay.
El manifest se revalida en cada visita. Si durante una release el navegador conserva el manifest
anterior sin `liquidityChunkTemplate`, el replay base continúa y solo la capa de liquidez queda no
disponible hasta recibir el manifest actual.

El dominio temporal del canvas usa exactamente los mismos slots que las velas. Cuando una sesión
corta contiene menos barras que el número visible —por ejemplo, 24 velas de 1 h dentro de 34
slots— el resto queda vacío y la capa termina en el borde temporal de la última vela disponible.

## Controles

Chart settings contiene:

- `LIQUIDITY HEATMAP`: visible por defecto y persistente.
- `INTENSITY`: 20–100%, en pasos de 5; 60% por defecto. Modifica opacidad, no los datos ni su
  normalización.

La persistencia usa `apex-trader:chart-liquidity:v1`. Al desactivar la capa se limpia el canvas y
el slider queda deshabilitado sin perder su valor. La primera entrega está limitada a Candles;
Footprint y Step Profile no montan el canvas.

## Renderizado y accesibilidad

El heatmap usa Canvas 2D a resolución CSS debajo del SVG. El SVG sigue siendo responsable de
velas, grid, ejes, overlays, crosshair y foco. El canvas no recibe puntero, teclado ni semántica
duplicada; Chart settings ofrece el control accesible de la presentación.

Figma aún no contiene esta capa cuantitativa ni sus dos controles. Código y esta especificación
describen el estado ejecutable hasta que exista un alcance explícito de sincronización Figma.
