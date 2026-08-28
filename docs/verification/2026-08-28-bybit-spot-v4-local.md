---
status: verified-local
last_verified: 2026-08-28
owners: product-engineering
---

# Bybit Spot dataset v4 and runtime boundary · local verification · 2026-08-28

## Alcance

Esta verificación registra el dataset compilado localmente, sus fuentes y el contrato de acceso
same-origin. No prueba todavía creación o lectura del Railway Storage Bucket, despliegue, commit ni
producción en `apex.devsigner.xyz`.

## Identidad y fuentes

- Exchange: Bybit.
- Market type: Spot.
- Symbol: BTCUSDT.
- Replay: `2026-07-31T00:00:00Z`–`2026-08-01T00:00:00Z`.
- Trades diarios:
  `https://public.bybit.com/spot/BTCUSDT/BTCUSDT_2026-07-31.csv.gz`.
- Trades mensuales:
  `https://public.bybit.com/spot/BTCUSDT/BTCUSDT-2026-07.csv.gz`.
- Order book top-200:
  `https://quote-saver.bycsi.com/orderbook/spot/BTCUSDT/2026-07-31_BTCUSDT_ob200.data.zip`.
- Daily klines: Bybit V5 con `category=spot`, `symbol=BTCUSDT`, `interval=D` y límite 180.

El asset `provenance` conserva URL, tamaño y SHA-256 de las cuatro fuentes. El pipeline valida la
anomalía conocida de seis campos en las filas mensuales pese al header de cinco, y retiene los
481.468 trades Spot diarios.

## Dataset compilado

| Evidencia          | Resultado                                         |
| ------------------ | ------------------------------------------------- |
| Schema             | `apextrader.market-dataset-manifest/v4`           |
| Dataset version    | `v4-14427c4ff6eaf432`                             |
| Assets             | 296                                               |
| Bytes declarados   | 63.541.117                                        |
| Históricos         | 288×5m; 288×15m; 336×30m; 336×1h; 180×4h; 180×1D |
| Book               | 96 chunks; top-200 real                           |
| Trades             | 96 chunks; 481.468 ejecuciones                    |
| Liquidity          | 96 chunks; 2.667.216 bytes                        |
| Resolución heatmap | 5 segundos × 1 USDT                               |
| Normalización      | `log1p`; percentil 99,5 = 14,24 BTC               |
| Dominio de precio  | `[62.196, 65.673)` USDT                           |

Los packs históricos terminan exactamente en `sessionStart`; no se solapan con la sesión. Book,
trades y liquidity se dividen en los mismos 96 intervalos de 15 minutos. Cada asset declara
`bytes`, `sha256`, `contentType`, encoding y key segura.

## Frontera de runtime

- `/api/market-data/manifest` devuelve una representación pública sin keys privadas.
- `/api/market-data/assets/<assetId>` solo acepta IDs existentes en la allowlist del manifest.
- Desarrollo sirve los assets locales verificando path y tamaño.
- Producción carga el manifest del Railway Bucket privado y responde con redirecciones GET
  firmadas de cinco minutos.
- Manifest mutable: `must-revalidate`; assets versionados: un año e `immutable`.
- La landing no solicita `/api/market-data/**`; el límite lazy permanece en `DemoPage`.
- No existe selector de fechas ni carga infinita.
- El heatmap no solicita ni pinta tiles fuera de `liquidityStart`/`liquidityEnd` o después del reloj.

## Gates locales

Esta sesión verificó estructura y estadísticas directamente contra
`.cache/bybit/compiled/manifest-v4.json` y su asset `provenance`.

| Gate | Resultado |
| ---- | --------- |
| `pnpm run check:docs` | 20 archivos requeridos, pass |
| ESLint acotado a landing, DOM y sus pruebas | pass |
| `domPresentation`, `bybitDataset`, `marketDataAssets`, `marketDataServer` | 4 archivos, pass |
| Landing E2E Chromium | 5/5, pass; cero requests de market data en `/` |

El build completo, E2E de navegador, bucket y producción pertenecen al gate de integración y no
se atribuyen desde estas comprobaciones acotadas.

## Frontera de publicación

La creación del bucket, carga de los 296 objetos, configuración de variables, despliegue Railway,
respuesta real de URLs firmadas y commit desplegado deben comprobarse por separado. Ninguna de
esas acciones se infiere desde esta verificación local.
