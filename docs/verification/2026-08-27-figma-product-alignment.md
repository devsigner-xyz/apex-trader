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
