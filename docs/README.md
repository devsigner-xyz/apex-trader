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
- [Umami product events verification](verification/2026-09-01-umami-product-events-local.md):
  instrumentación de intención y comprobación local de sus payloads.
- [Landing AI context](verification/2026-09-02-landing-ai-context-local.md): sección contextual,
  prompt público, acciones de proveedor y comprobación responsive local.
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
- [Interactive portfolio landing R3 refinement](verification/2026-08-31-interactive-portfolio-landing-r3-local.md):
  carrusel de modos, OHLC válido, dos barras order-flow, alternancia y evidencia local.
- [Interactive portfolio landing R3 production](verification/2026-08-31-interactive-portfolio-landing-r3-production.md):
  commit funcional, Railway, rutas, assets y comprobación directa de la UI pública R3.
- [Interactive portfolio landing R4 full-workstation hero](verification/2026-08-31-interactive-portfolio-landing-r4-full-workstation-hero-local.md):
  tres capturas completas y coherentes del workstation, responsive, assets y evidencia local.
- [Interactive portfolio landing R5 order-flow refinement](verification/2026-08-31-interactive-portfolio-landing-r5-order-flow-unframed-local.md):
  separación vertical sutil y tratamiento unframed de Footprint y Step Profile.
- [Interactive portfolio landing R5 production](verification/2026-08-31-interactive-portfolio-landing-r5-production.md):
  commit funcional, Railway, assets y comprobación visual pública de R4/R5.
- [Interactive portfolio landing R6 narrative simplification](verification/2026-08-31-interactive-portfolio-landing-r6-narrative-simplification-local.md):
  retirada de The blind spot, CTA directo, renumeración y evidencia local.
- [Interactive portfolio landing R7 panel settings](verification/2026-08-31-interactive-portfolio-landing-r7-panel-settings-unframed-local.md):
  DOM ampliado, settings funcionales en DOM/Trades y seis módulos sin card exterior.
- [Interactive portfolio landing R6/R7 production](verification/2026-08-31-interactive-portfolio-landing-r7-production.md):
  commit funcional, Railway, rutas, bundles y comprobación pública desktop/mobile.
- [Interactive portfolio landing R8 Volume Profile price scale](verification/2026-08-31-interactive-portfolio-landing-r8-volume-profile-price-scale-local.md):
  eje derecho, alineación de nueve precios, responsive y evidencia local.
- [Interactive portfolio landing R8 production](verification/2026-08-31-interactive-portfolio-landing-r8-production.md):
  commit funcional, Railway, rutas y comprobación visual pública desktop/mobile.
- [Interactive portfolio landing R9 ambient depth](verification/2026-08-31-interactive-portfolio-landing-r9-ambient-depth-local.md):
  seis trades, backdrops vectoriales diferenciados, motion reducido y evidencia local.
- [Interactive portfolio landing R9 production](verification/2026-08-31-interactive-portfolio-landing-r9-production.md):
  commit funcional, Railway, rutas y comprobación visual pública desktop/mobile.
- [Interactive portfolio landing R10 static grid](verification/2026-08-31-interactive-portfolio-landing-r10-static-grid-local.md):
  sustitución local del fondo animado por una retícula estática y desvanecida.
- [Interactive portfolio landing R10 production](verification/2026-08-31-interactive-portfolio-landing-r10-production.md):
  commit funcional, Railway, rutas y comprobación visual pública desktop/mobile.
- [Interactive portfolio landing R11 user-value copy](verification/2026-08-31-interactive-portfolio-landing-r11-user-value-copy-local.md):
  revisión local de hero, navegación, secciones, módulos, CTAs y copy de soporte orientada a valor
  de producto.
- [Interactive portfolio landing R11 production](verification/2026-08-31-interactive-portfolio-landing-r11-production.md):
  commit funcional, Railway, rutas, assets y comprobación pública desktop/mobile del copy R11.
- [Interactive portfolio landing R12 clean hierarchy](verification/2026-09-01-interactive-portfolio-landing-r12-clean-hierarchy-local.md):
  retirada local de la numeración decorativa de las seis filas de modos y regresión estructural.
- [Interactive portfolio landing R13 focused landing](verification/2026-09-01-interactive-portfolio-landing-r13-focused-landing-local.md):
  retirada local de las secciones de contexto y nuevo banner final de Devsigner con CTA externo.
- [Interactive portfolio landing R14 hero replay](verification/2026-09-01-interactive-portfolio-landing-r14-hero-replay-local.md):
  vídeo local de la workstation real, secuencia de modos, fallback y regresión de la landing.
- [Interactive portfolio landing R14 hero replay production](verification/2026-09-01-interactive-portfolio-landing-r14-hero-replay-production.md):
  publicación del vídeo, eliminación de la barra superior y comprobación pública del dominio y assets.
- [Interactive portfolio landing R15 liquidity heatmap](verification/2026-09-01-interactive-portfolio-landing-r15-liquidity-heatmap-local.md):
  nueva escena aislada de heatmap con intensidad configurable y fixtures locales.
- [Interactive portfolio landing R15 production](verification/2026-09-01-interactive-portfolio-landing-r15-production.md):
  publicación del heatmap, CTA de Devsigner, disclaimer y verificación pública del dominio y assets.
- [Interactive portfolio landing production](verification/2026-08-31-interactive-portfolio-landing-production.md):
  commit funcional, Railway, rutas, assets y comprobación directa de la UI pública R2.
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
- [Professional UI refinement verification](verification/2026-09-02-professional-ui-refinement-local.md):
  filas de trades, contraste del current price, viewport inicial, settings de Candles, Account &
  Risk y guard de móvil/tablet.
- [Step Profile colors verification](verification/2026-09-02-step-profile-colors-local.md):
  settings de color contextuales para Candles y Step Profile, persistencia independiente y
  captura del caso de estudio.
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
históricos son snapshots. En el [plan de landing interactiva](plans/interactive-portfolio-landing.md),
R2–R11 y R14 están publicados y verificados. R12 y R13 permanecen verificados solo en local; R3–R14
siguen pendientes de sincronización con Figma.

## Jerarquía y estados

Código más comprobación directa de producción mandan sobre lo que se ejecuta. Figma manda sobre el contrato visual y la intención. Esta documentación conserva reglas, decisiones, gaps y referencias.

Cada documento canónico declara `status`, `last_verified` y `owners`. `current` significa comprobado, no propuesto. Si una regla existe en Figma pero no en código, se marca como gap o planned.

## Cuándo actualizar

Actualiza en el mismo cambio que altere estructura de panel, datos, cálculo, persistencia, estado inicial, teclado, foco, roles, tokens, variantes, masters, fixtures o política responsive. Después ejecuta `pnpm run check:docs`.
