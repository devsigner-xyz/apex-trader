---
status: current
last_verified: 2026-08-31
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
- [Interactive portfolio landing plan](plans/interactive-portfolio-landing.md): dirección planificada para presentar Apex como demo funcional de portfolio mediante componentes React animados y escenas de scroll.
- [Panel patterns](design-system/panel-patterns.md): headers, settings, tablas, overlays y accesibilidad.
- [Chart patterns](design-system/chart-patterns.md): significado de Candles/OHLC, Footprint, Step Profile y Volume Profile.
- [Figma contract](figma/README.md): archivo maestro, masters, variantes, anotaciones y trazabilidad.
- [Decisions](decisions/README.md): decisiones duraderas y consecuencias.
- [Verification](verification/2026-08-28-landing-direction-b-local.md): última verificación local de la landing y el routing de demo.
- [Interactive portfolio landing baseline](verification/2026-08-30-interactive-portfolio-landing-baseline.md):
  checkout, requests, responsive, chunks y contrato Figma antes de la nueva exploración.
- [Interactive portfolio landing Figma gate](verification/2026-08-30-interactive-portfolio-landing-figma.md):
  propuesta desktop/mobile, storyboard, auditoría estructural y frontera de aprobación antes de React.
- [Interactive portfolio landing phase 2](verification/2026-08-30-interactive-portfolio-landing-phase2-local.md):
  snapshot histórico del prototipo R1 con `MarketChart` completo, sustituido por R2.
- [Interactive portfolio landing isolated modules](verification/2026-08-31-interactive-portfolio-landing-isolated-modules-local.md):
  contrato R2, seis módulos React compactos, carga diferida, responsive y evidencia local.
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
- [Historical replay engine modularization verification](verification/2026-08-30-replay-engine-modularization-local.md):
  fachada pública compatible, límites internos, cobertura estricta y regresión local del replay.
- [Settings popovers and Activity keyboard verification](verification/2026-08-29-settings-popovers-activity-keyboard-local.md):
  foco cíclico, restauración, cierre exterior y tabs con roving `tabIndex` en los tres motores.
- [Volume panel persistence cleanup verification](verification/2026-08-29-volume-panel-persistence-cleanup-local.md):
  migración de la key de tamaños del chart a `volume` únicamente, manteniendo fijo el Volume Profile.
- [UI color tokenization verification](verification/2026-08-30-ui-color-tokenization-local.md):
  colores ejecutables de la interfaz encapsulados en tokens semánticos sin cambio visual.
- [Professional frontend maintainability verification](verification/2026-08-30-professional-maintainability-p1-local.md):
  descomposición contractual del chart, E2E por contratos, cobertura y regresión visual local.
- [Professional frontend maintainability release verification](verification/2026-08-30-professional-maintainability-production.md):
  publicación del commit de modularización y comprobación de Railway, dominios y assets públicos.
- [Storybook local verification](verification/2026-08-30-storybook-local.md):
  catálogo estático de componentes, enlace desde la landing y límites de verificación local.
- [Storybook production verification](verification/2026-08-30-storybook-production.md):
  commit, despliegue Railway y comprobación pública de la biblioteca de componentes.
- [Storybook coverage local verification](verification/2026-08-30-storybook-coverage-local.md):
  foundations y superficies de producto tras la auditoría de Storybook.
- [Legacy terminal cleanup release verification](verification/2026-08-29-legacy-terminal-cleanup-production.md):
  commit funcional, despliegue Railway y comprobación directa de rutas, bundles, datos v3 y UI pública.

Los documentos [apex-trader-verification-report.md](apex-trader-verification-report.md),
[figma-implementation-inventory.md](figma-implementation-inventory.md) y los planes marcados como
históricos son snapshots. El [plan de landing interactiva](plans/interactive-portfolio-landing.md)
está en progreso: la revisión Figma R2 y sus seis módulos React están implementados localmente,
pendientes de gates finales y publicación verificada.

## Jerarquía y estados

Código más comprobación directa de producción mandan sobre lo que se ejecuta. Figma manda sobre el contrato visual y la intención. Esta documentación conserva reglas, decisiones, gaps y referencias.

Cada documento canónico declara `status`, `last_verified` y `owners`. `current` significa comprobado, no propuesto. Si una regla existe en Figma pero no en código, se marca como gap o planned.

## Cuándo actualizar

Actualiza en el mismo cambio que altere estructura de panel, datos, cálculo, persistencia, estado inicial, teclado, foco, roles, tokens, variantes, masters, fixtures o política responsive. Después ejecuta `pnpm run check:docs`.
