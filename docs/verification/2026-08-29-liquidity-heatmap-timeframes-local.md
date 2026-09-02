---
status: current
last_verified: 2026-08-29
owners: product-engineering
---

# Liquidity heatmap timeframe aggregation · local

## Alcance

Verificación local de la alineación y densidad temporal del heatmap histórico de liquidez en
Candles al cambiar desde 5 min a 15 min, 30 min, 1 h y 4 h.

## Resultado

- 5 min conserva el muestreo visual L2 de 5 segundos.
- Las temporalidades superiores usan la media temporal por nivel y vela, incluidos los periodos
  sin liquidez, para enfatizar órdenes persistentes y reducir ruido de microestructura.
- El canvas comparte el dominio temporal completo de slots con las velas. En 1 h, el heatmap
  termina junto al último intervalo disponible y los slots posteriores permanecen vacíos.
- La comprobación visual se realizó en `/demo`, Candles, 1 hour, con Chromium mediante Playwright
  CLI. Evidencia local: `output/playwright/liquidity-heatmap-1h-aggregated.png`.

## Gates

- `node --test tests/*.test.js` - 16/16 archivos de tests pasan.
- `node scripts/check-docs.mjs` - contrato documental correcto.
- ESLint local - sin errores.
- Vite build local - correcto.
- `git diff --check` - correcto.

Esta evidencia es local. No se hizo commit, push, despliegue ni verificación de producción.
