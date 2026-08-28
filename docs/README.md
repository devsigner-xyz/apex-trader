---
status: current
last_verified: 2026-08-28
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
- [Verification](verification/2026-08-28-bybit-spot-v4-local.md): última verificación local del dataset Bybit Spot v4 y su frontera de runtime.

Los documentos [apex-trader-verification-report.md](apex-trader-verification-report.md), [figma-implementation-inventory.md](figma-implementation-inventory.md) y `plans/` son snapshots históricos. Pueden aportar evidencia, pero no describen por sí solos el estado actual.

## Jerarquía y estados

Código más comprobación directa de producción mandan sobre lo que se ejecuta. Figma manda sobre el contrato visual y la intención. Esta documentación conserva reglas, decisiones, gaps y referencias.

Cada documento canónico declara `status`, `last_verified` y `owners`. `current` significa comprobado, no propuesto. Si una regla existe en Figma pero no en código, se marca como gap o planned.

## Cuándo actualizar

Actualiza en el mismo cambio que altere estructura de panel, datos, cálculo, persistencia, estado inicial, teclado, foco, roles, tokens, variantes, masters, fixtures o política responsive. Después ejecuta `pnpm run check:docs`.
