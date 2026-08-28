---
status: accepted
last_verified: 2026-08-28
owners: product-design-engineering
---

# 0006 · Historical liquidity tiles behind Candles

## Contexto

El runtime dispone del L2 exacto, pero cada chunk de 15 minutos contiene miles de grupos y el
viewport de Candles puede cubrir más de trece horas. Reconstruir todos los chunks originales por
frame elevaría red, memoria y CPU; convertir la liquidez en rectángulos SVG también multiplicaría
el DOM.

## Decisión

Mantener los chunks L2 como fuente y generar tiles derivados versionados para presentación:

- 5 segundos por muestra;
- 1 USDT por bin;
- tamaño agregado bid + ask;
- valores `uint16` en centésimas de BTC;
- normalización logarítmica global basada en el percentil 99,5;
- Canvas 2D bajo el SVG de Candles;
- carga por viewport y corte estricto en el reloj del replay.

La visibilidad y la intensidad son persistentes, pero no alteran los datos. La capa es Candles-only
para evitar competir con la densidad semántica de Footprint y Step Profile.

## Alternativas descartadas

- **Renderizar el L2 crudo en cliente:** conserva resolución innecesaria para el píxel visible y
  exige decenas de chunks grandes en zoom-out.
- **SVG por celda:** degrada pan, zoom y replay por volumen de nodos.
- **Imagen prerenderizada:** dificulta respetar price scale, reloj, intensidad y temas sin perder
  trazabilidad cuantitativa.
- **Normalización por viewport o tile:** hace que el mismo tamaño cambie de color al navegar.

## Consecuencias

La presentación es determinista, ligera y comparable durante la sesión, pero no representa cada
microsegundo ni cada tick de 0,01 USDT. Cambiar resolución, agregación o percentil requiere una
nueva versión de tiles y actualización de manifest, procedencia, pruebas y documentación.
