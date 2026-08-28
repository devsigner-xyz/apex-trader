---
status: verified-local
last_verified: 2026-08-28
owners: product-design-engineering
---

# Liquidity heatmap verification · 2026-08-28

## Alcance

Verificación local de la capa histórica L2 en Candles, sus controles persistentes, la generación de
assets y la convivencia con chart, DOM, Time & Sales, Footprint y Step Profile.

## Datos

- 96 tiles deterministas de 15 minutos.
- 5 segundos × 1 USDT; 832 bins de precio entre 6960 y 7792 USDT.
- 3.080.573 bytes gzip totales.
- Normalización logarítmica global con máximo visual de 70,16 BTC, percentil 99,5.
- Hash compuesto idéntico antes y después de regenerar: `5252a35bacf85502d8b301f39b9e16202fe12d57ebcc1d892893d1888079bcd5`.

## Gates

| Gate                                      | Resultado                                                           |
| ----------------------------------------- | ------------------------------------------------------------------- |
| Documentation contract                    | 19 archivos requeridos, pass                                        |
| ESLint                                    | pass                                                                |
| Node unit tests                           | 16 archivos, pass                                                   |
| Vite production build                     | 1862 módulos, pass                                                  |
| Liquidity E2E Chromium                    | 2/2 pass                                                            |
| Liquidity E2E Chromium + Firefox + WebKit | 6/6 pass                                                            |
| Professional terminal regression Chromium | 15/15 pass                                                          |
| Browser console                           | sin errores; solo aviso informativo de React DevTools en desarrollo |

## Comprobación visual

La captura `output/playwright/liquidity-heatmap-local-1920x1080.png` confirma:

- bandas históricas bajo velas y overlays SVG;
- price/time alignment a 1920 × 1080;
- heatmap limitado al plot, sin invadir la escala de precio;
- VAH, POC, VAL, crosshair, volumen y DOM legibles;
- concentración alta arena/terracota y liquidez menor azul verdosa;
- Canvas con `z-index: 0`, SVG con `z-index: 1` y sin interceptar input.

## Runtime compatibility hotfix

La verificación posterior de la demo detectó dos límites de rollout: un manifest cacheado anterior
no incluía `liquidityChunkTemplate`, y un fallo de escritura de Cache Storage podía abortar una
respuesta de red válida. El runtime ahora mantiene las rutas de book y trades independientes de la
ruta opcional de liquidez, revalida el manifest en cada visita y trata toda persistencia de caché
como best-effort.

- Unit tests: manifest anterior carga sesión, book y trades; el heatmap falla de forma aislada.
- Unit tests: `Cache.put` rechazado conserva la respuesta de red original.
- E2E de liquidez y compatibilidad: 9/9 en Chromium, Firefox y WebKit.
- Regresión de terminal y order book: 21/21 en Chromium.

La verificación de producción se realiza después del commit y despliegue autorizado; no se infiere
desde este resultado local.
