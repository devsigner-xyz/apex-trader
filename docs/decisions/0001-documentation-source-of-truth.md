---
status: current
last_verified: 2026-08-27
owners: product-design-engineering
---

# 0001 — Documentation source of truth

## Context

El producto evolucionó más rápido que los documentos históricos y Figma contenía masters anteriores a producción.

## Decision

Código y verificación directa describen ejecución; Figma describe contrato visual; `/docs` conserva especificaciones, decisiones, gaps y trazabilidad. `AGENTS.md` obliga a sincronizar las capas.

Las anotaciones complementan el nodo, pero una regla crítica o transversal siempre tiene representación versionada.

## Consequences

- Cada cambio funcional incluye documentación o explica por qué no altera contratos.
- Los snapshots históricos no se presentan como estado actual.
- La paridad requiere evidencia visual y estructural.
