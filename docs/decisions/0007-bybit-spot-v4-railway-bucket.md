---
status: accepted
last_verified: 2026-08-28
owners: product-engineering
---

# 0007 · Bybit Spot v4 in a private Railway Storage Bucket

## Contexto

La demo anterior empaquetaba una sesión Binance/Tardis dentro de `public/`. Ofrecía replay L2
real, pero una sola jornada limitaba la navegación temporal y cada cambio de dataset aumentaba el
repositorio y el artefacto de despliegue. El producto necesita contexto suficiente para explorar
cada timeframe, no búsqueda de fechas ni reproducción L2 continua de un mes.

La migración debe conservar un único reloj para chart, DOM y Time & Sales, la profundidad y el
heatmap reales de la sesión detallada, y un coste operativo previsible dentro de Railway.

## Decisión

Adoptar `apextrader.market-dataset-manifest/v4` con identidad obligatoria Bybit **Spot** BTCUSDT y
replay del 31 de julio de 2026 UTC:

- trades diarios:
  `https://public.bybit.com/spot/BTCUSDT/BTCUSDT_2026-07-31.csv.gz`;
- trades mensuales para el pre-roll intradía:
  `https://public.bybit.com/spot/BTCUSDT/BTCUSDT-2026-07.csv.gz`;
- order book top-200:
  `https://quote-saver.bycsi.com/orderbook/spot/BTCUSDT/2026-07-31_BTCUSDT_ob200.data.zip`;
- 180 klines diarios mediante Bybit V5 con
  `category=spot&symbol=BTCUSDT&interval=D`.

El pipeline conserva URL, bytes y SHA-256 de cada fuente en un asset de procedencia. Rechaza
mercados `linear`, `inverse`, `BTCUSD` o cualquier identidad distinta de Spot BTCUSDT. Los
snapshots reinician el estado, los deltas con tamaño cero eliminan niveles y no se completa
profundidad con datos sintéticos.

El dataset compilado contiene 296 assets inmutables y 63.541.117 bytes:

- sesión y procedencia;
- históricos de 288×5m, 288×15m, 336×30m, 336×1h, 180×4h y 180×1D;
- 96 chunks de 15 minutos para book, trades y liquidity respectivamente.

El replay detallado conserva 481.468 trades y L2 top-200. Solo ese día alimenta DOM, Time &
Sales, barra parcial y heatmap 5s × 1 USDT; las velas de pre-roll permiten navegar hacia atrás sin
selector de fecha ni scroll infinito. Candles admite 1D, Step Profile llega hasta 4h y Footprint
permanece en 1h/4h.

En producción, manifest y assets viven en un Railway Storage Bucket privado. La aplicación sirve
un manifest público same-origin bajo `/api/market-data/manifest`, limitado a IDs allowlisted,
hashes, tamaños y URLs de asset. Cada GET válido recibe una redirección temporal firmada; el
navegador no conoce credenciales ni claves internas del bucket. Localmente, la misma API sirve los
artefactos compilados desde `.cache/bybit/compiled`.

Esta decisión sustituye el almacenamiento runtime descrito en
[0005](0005-public-landing-and-demo-routes.md) y la procedencia Binance de
[0006](0006-historical-liquidity-tiles.md). Se conservan ambos ADR como contexto histórico; sus
rutas `/data/tardis/**` y fuente Binance ya no son el contrato actual.

## Alternativas descartadas

- **Mantener los assets en `public/`:** acopla datos, repositorio y cada despliegue de interfaz.
- **Guardar un mes de L2:** multiplica ingesta, almacenamiento y transferencia sin aportar valor a
  los casos de uso acotados de la demo.
- **Mezclar velas de otro exchange:** rompe la continuidad de mercado con DOM, tape y heatmap.
- **Selector de fechas o carga infinita:** introduce estados de red y navegación que el producto no
  necesita.
- **Hacer público el bucket o exponer credenciales:** elimina la allowlist y amplía
  innecesariamente la superficie de acceso.

## Consecuencias

El deploy de interfaz deja de transportar decenas de megabytes de mercado y el histórico puede
versionarse o revertirse de forma independiente. El runtime incorpora una dependencia del bucket
y del endpoint de firma; sus fallos deben degradar capas aisladas sin convertir Cache Storage en
requisito de ejecución.

El pre-roll ofrece contexto distinto por timeframe, no una línea temporal L2 completa. Al navegar
fuera del 31 de julio no aparecen DOM, tape o liquidez históricos inventados. Cambiar fuentes,
profundidad, resolución, límites de barras o identidad del mercado exige una nueva versión del
dataset y actualizar procedencia, pruebas y esta decisión.
