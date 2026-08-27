---
status: current
last_verified: 2026-08-27
owners: product-design-engineering
---

# 2026-08-27 — Figma, product and documentation alignment

## Evidence

- Producción comprobada a 1920 × 1080 y 1366 × 768 sin errores de consola/página.
- Masters y production frames de Figma inspeccionados por node ID.
- Contratos de filtros, cálculo, persistencia y fixtures revisados en código.

## Alineado

- Markets, DOM, Execution y Time & Sales con headers actuales.
- Activity con cinco vistas y métricas dentro de Account & Risk.
- VAH/POC/VAL sólidos al borde del profile en ocho variantes.
- Panel Settings con Chart, Time Sales y RadioOption.
- Anotaciones nativas de desarrollo, interacción, accesibilidad y contenido.

## Limpieza de la librería Figma

- 25 páginas activas con canvas negro; los dos separadores vacíos fueron retirados.
- Getting Started se convirtió en un mapa anotado de las siete regiones de la terminal.
- Components y Utilities contienen índices y resúmenes visibles.
- `_Documentation/Page intro` (`530:7371`) unifica título y descripción a 14 px con altura Hug; 20 instancias permanecen enlazadas al master.
- Production UI contiene Price Chart, Footprint y Step Profile en una sola columna con 120 px de separación.
- `Trading/MarketChart` (`101:3457`) conserva sus ocho variantes y sus anotaciones, ahora en una sola columna y sin overflow.
- El contenido de Market Chart Behavior se migró a la página del componente y `465:9587` se retiró después de verificar los textos y metadatos.
- Archive permanece antes de `99.99 · Graveyard · Legacy UI`, que es la última página.

## Correcciones de producto

- Los labels del value area permanecen sin las barras.
- Markets settings sigue al trigger en tab order.
- Metadata de Time & Sales neutral.
- Close/Cancel danger y Details neutral.
- Risk meters con semántica progressbar.

## Gates ejecutados

- `check:docs`, lint, 13 suites unitarias y build: pass.
- Professional terminal E2E en Chromium: 10/10 pass.
- Suite completa: 47/48 pass; un test de selección DOM falló una vez en Firefox por carrera con el replay.
- Repetición focalizada de ese test en Firefox: 3/3 pass.
- Repetición completa de Firefox: 16/16 pass.

## Gaps abiertos

| Prioridad | Gap                                                                 | Próxima decisión                     |
| --------- | ------------------------------------------------------------------- | ------------------------------------ |
| P1        | La terminal completa no cabe simultáneamente por debajo de ~1920 px | Mínimo workstation o layout compacto |
| P2        | Persistencia desigual entre settings                                | Confirmar política                   |
| P2        | Tablist sin Arrow/Home/End                                          | Implementar navegación compuesta     |
| P2        | Popovers sin focus trap/restauración                                | Extraer comportamiento compartido    |
| P2        | Acciones de Activity son texto                                      | Conectar o retirar affordance        |
| P3        | Profile width persistido pero no usado                              | Eliminar o reintroducir resize       |

Las capturas se regeneran bajo `output/playwright/`; las rutas locales absolutas no forman parte del contrato público.
