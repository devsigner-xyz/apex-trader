---
status: accepted
date: 2026-08-29
owners: product-engineering
---

# 0007 - Bounded replay window for the one-day demo

## Context

La sesión histórica Spot BTCUSDT contiene un día de datos base de 5 min. Ampliar la demo a varios
días aumentaría assets, ingesta, caché y mantenimiento. Mantener 4 h con un solo día produce muy
pocas velas, mientras que empezar el replay cerca de medianoche tampoco llena la densidad inicial
de Candles.

## Decisión

- Mantener sin cambios el dataset Spot actual de un día.
- Ofrecer 5 min, 15 min, 30 min y 1 h en Candles y Step Profile; Footprint ofrece solo 1 h.
- Iniciar Candles en 30 min.
- Acotar el replay al tramo 16:30–24:00 UTC. La carga inicial, el seek y el reinicio usan el mismo
  límite inferior; al terminar, el reloj vuelve a las 16:30.

## Consecuencias

La primera vista dispone de 34 velas de 30 min y 17 de 1 h, incluida en ambos casos la vela activa.
La demo gana densidad visual sin nuevos assets ni datos simulados. A cambio, 4 h deja de ser una
opción y el tramo anterior a las 16:30 no forma parte de la navegación normal del replay.

## Alternativas descartadas

- Incorporar seis o siete días de Bybit: aporta más historia, pero amplía innecesariamente la
  ingesta, el almacenamiento y el contrato de replay para esta demo.
- Mantener 4 h con un día: conserva el selector, pero no ofrece suficientes velas para una lectura
  útil.
