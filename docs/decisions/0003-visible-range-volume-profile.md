---
status: current
last_verified: 2026-08-27
owners: product-engineering
---

# 0003 - Visible-range volume profile

## Context

VAH, POC y VAL aparecían agrupados y no comunicaban el rango visible esperado.

## Decision

Calcular profile, POC y value area sobre velas agregadas visibles. Barras y niveles tienen toggles independientes. Las etiquetas son chips sólidos en el borde izquierdo del plot, opuesto al Volume Profile, y permanecen con sus líneas al ocultar barras. Cada nivel usa una única línea edge-to-edge punteada y tenue; no añade un segundo segmento dentro del overlay.

## Consequences

Pan, zoom y timeframe pueden cambiar los niveles. Tests y documentación cubren la matriz profile/valueArea y persistencia.
