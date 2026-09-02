---
status: current
last_verified: 2026-08-27
owners: product-design
---

# 0002 - Contextual panel headers

## Context

Markets, DOM, Execution y Time & Sales repetían títulos que consumían espacio sin añadir contexto.

## Decision

Usar variantes según función: search toolbar, chart toolbar, context header, tab bar y contenido sin header. DOM y Time & Sales comparten metadata + settings; Markets integra búsqueda; Execution empieza por Buy/Sell.

## Rejected alternative

Forzar una altura y título comunes. Añadía densidad y no resolvía los controles distintos.

## Consequences

Las alturas no son idénticas, pero quedan especificadas. Se conserva nombre accesible aunque no haya título visible.
