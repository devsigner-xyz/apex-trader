---
status: current
last_verified: 2026-08-27
owners: product-design-engineering
---

# 0004 - Fractional chart viewport

## Context

El pan temporal estaba expresado como un número entero de barras. Cada movimiento menor que un slot no producía ningún cambio y, al cruzar el umbral, todas las capas saltaban una barra completa. Los límites de zoom compartían además densidades que permitían overflow en Footprint y Step Profile o una separación excesiva en Candles.

## Decision

El viewport conserva un offset lógico fraccional y separa dos responsabilidades:

1. La geometría renderiza barras buffer y las traslada de forma continua. El plot las recorta y admite que una barra quede parcialmente visible en sus bordes.
2. El rango analítico incluye una barra cuando su centro temporal cae dentro del plot. Las barras buffer cuyo centro queda fuera no participan en Visible-range Volume Profile, POC, VAH o VAL.

El pan comienza únicamente con el botón principal pulsado. El cursor en reposo es neutral y cambia a `grabbing` durante el gesto. El hover resuelve la barra bajo el puntero después de aplicar la traslación y actualiza su OHLC, delta y volumen sin cambiar el reloj compartido.

Los límites son específicos del modo: Candles 28–160, Footprint 4–13 y Step Profile 1–12 barras. La escala temporal elige ticks mediante separación mínima en píxeles renderizados y deja de mostrar el antiguo resumen naranja del rango.

## Alternatives considered

- Mantener offsets enteros y suavizar solo con CSS: no conserva una posición real entre barras ni permite sincronizar correctamente las capas.
- Incluir toda barra parcialmente dibujada en los cálculos: hace saltar el profile al asomar un fragmento mínimo y vuelve ambiguo el significado de rango visible.
- Aplicar un único límite de zoom a todos los modos: ignora que Candles, Footprint y Step Profile tienen requisitos de densidad distintos.

## Consequences

- Chart, volumen, Footprint, Step Profile y overlays consumen el mismo desplazamiento fraccional.
- Los cambios visuales son continuos, pero el conjunto analítico cambia solo cuando un centro cruza el borde del plot.
- Reset y follow-latest deben eliminar también cualquier fracción residual.
- Las pruebas necesitan comprobar geometría parcial, ausencia de overflow, cursor por estado y separación real de ticks, no solo timestamps inicial/final.
