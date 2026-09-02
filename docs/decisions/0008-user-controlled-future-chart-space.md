---
status: accepted
date: 2026-08-29
owners: product-design-engineering
---

# 0008 - User-controlled future chart space

## Context

Cuando el histórico llena todos los slots visibles, el último dato queda junto al borde derecho y
puede compartir espacio visual con el Volume Profile superpuesto. El zoom-out crea separación, pero
también cambia la densidad elegida por el usuario y no equivale a ordenar el viewport mediante pan.

## Decisión

El offset temporal admite valores negativos mediante drag horizontal. Esos valores representan
slots futuros vacíos a la derecha y se limitan al 30% del número de barras visibles. La densidad y
el timeframe no cambian durante el gesto.

El margen se aplica al modelo temporal compartido por Candles, Footprint, Step Profile, volumen y
heatmap. Mientras el último dato siga visible, el replay conserva follow-latest y mantiene el margen
elegido cuando aparece una barra nueva. La tecla `0` vuelve al offset cero.

Un cambio real de timeframe usa el límite negativo como posición inicial para priorizar la
separación respecto al Volume Profile. El margen no se convierte en padding: el usuario puede
arrastrar en sentido contrario y recuperar cualquier grado de overlay. La primera carga y `0`
continúan usando offset cero.

## Consecuencias

- El usuario puede separar los datos del Volume Profile sin recurrir al zoom.
- El espacio futuro no contiene datos, ticks artificiales ni liquidez posterior al reloj histórico.
- El heatmap conserva tiles resueltos durante el gesto y repinta antes del frame visible para evitar
  flashes al cruzar límites de carga.
- Al reservar margen, salen por la izquierda barras reales equivalentes; el Volume Profile visible
  se recalcula únicamente con los datos cuyo centro continúa dentro del plot.
- Drag, rueda horizontal y flechas comparten los mismos límites, aunque el drag es el gesto principal.

## Alternativas descartadas

- Añadir padding fijo: reduce siempre el área útil y no deja la composición en manos del usuario.
- Resolverlo con zoom-out: altera simultáneamente densidad y escala temporal.
- Mover solo las velas: desalinearía volumen, heatmap, hit-testing y cálculos visibles.
