---
status: current
last_verified: 2026-08-29
owners: product-design-engineering
---

# Apex Trader documentation

Este directorio es el contexto versionado de producto y diseño. Debe permitir entender qué hace hoy la terminal, por qué se comporta así y cómo se representa en Figma sin depender del historial de una conversación.

## Mapa canónico

- [Professional terminal specification](product/professional-terminal.md): comportamiento, datos, persistencia y limitaciones.
- [Historical liquidity heatmap](product/liquidity-heatmap.md): L2, tiles, controles, límites y renderizado.
- [Landing and routing specification](product/landing-and-routing.md): narrativa pública, rutas canónicas, aliases y frontera de carga.
- [Design system](design-system/README.md): fundamentos y reglas visuales.
- [Marketing patterns](design-system/marketing-patterns.md): tokens, composición responsive y media de la landing.
- [Panel patterns](design-system/panel-patterns.md): headers, settings, tablas, overlays y accesibilidad.
- [Chart patterns](design-system/chart-patterns.md): significado de Candles/OHLC, Footprint, Step Profile y Volume Profile.
- [Figma contract](figma/README.md): archivo maestro, masters, variantes, anotaciones y trazabilidad.
- [Decisions](decisions/README.md): decisiones duraderas y consecuencias.
- [Verification](verification/2026-08-28-landing-direction-b-local.md): última verificación local de la landing y el routing de demo.
- [Bounded replay verification](verification/2026-08-29-bounded-replay-window-local.md):
  timeframe inicial, ventana 16:30–24:00 UTC y regresión local del replay profesional.
- [Future chart space verification](verification/2026-08-29-future-chart-space-local.md): drag
  hacia espacio futuro en Candles, Footprint y Step Profile sin modificar el zoom.
- [Heatmap drag stability verification](verification/2026-08-29-liquidity-heatmap-drag-stability-local.md):
  continuidad del Canvas y de los tiles de liquidez durante pan fraccional.
- [Timeframe future-space default verification](verification/2026-08-29-timeframe-future-space-default-local.md):
  separación inicial del Volume Profile tras cambiar timeframe y overlay recuperable por drag.
- [Historical replay recovery verification](verification/2026-08-29-historical-replay-recovery-local.md):
  retries deterministas, conservación de la terminal y degradación no fatal del prefetch.
- [Settings popovers and Activity keyboard verification](verification/2026-08-29-settings-popovers-activity-keyboard-local.md):
  foco cíclico, restauración, cierre exterior y tabs con roving `tabIndex` en los tres motores.
- [Volume panel persistence cleanup verification](verification/2026-08-29-volume-panel-persistence-cleanup-local.md):
  migración de la key de tamaños del chart a `volume` únicamente, manteniendo fijo el Volume Profile.
- [UI color tokenization verification](verification/2026-08-30-ui-color-tokenization-local.md):
  colores ejecutables de la interfaz encapsulados en tokens semánticos sin cambio visual.
- [Professional frontend maintainability verification](verification/2026-08-30-professional-maintainability-p1-local.md):
  descomposición contractual del chart, E2E por contratos, cobertura y regresión visual local.
- [Legacy terminal cleanup release verification](verification/2026-08-29-legacy-terminal-cleanup-production.md):
  commit funcional, despliegue Railway y comprobación directa de rutas, bundles, datos v3 y UI pública.

Los documentos [apex-trader-verification-report.md](apex-trader-verification-report.md), [figma-implementation-inventory.md](figma-implementation-inventory.md) y `plans/` son snapshots históricos. Pueden aportar evidencia, pero no describen por sí solos el estado actual.

## Jerarquía y estados

Código más comprobación directa de producción mandan sobre lo que se ejecuta. Figma manda sobre el contrato visual y la intención. Esta documentación conserva reglas, decisiones, gaps y referencias.

Cada documento canónico declara `status`, `last_verified` y `owners`. `current` significa comprobado, no propuesto. Si una regla existe en Figma pero no en código, se marca como gap o planned.

## Cuándo actualizar

Actualiza en el mismo cambio que altere estructura de panel, datos, cálculo, persistencia, estado inicial, teclado, foco, roles, tokens, variantes, masters, fixtures o política responsive. Después ejecuta `pnpm run check:docs`.
