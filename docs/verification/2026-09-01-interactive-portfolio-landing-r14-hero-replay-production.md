---
status: current
last_verified: 2026-09-01
owners: product-design-engineering
---

# Interactive portfolio landing R14 — hero replay production

## Release

- Commit publicado: `da5e6166939a559b14313bde5e9054a3a7762ff7` (`feat: publish replay video hero`).
- Railway deployment: `2b300a52-fd66-4840-b3a3-199c0e51289c`.
- Railway status: `SUCCESS`, deployment activo en el servicio `apex-trader`.
- Dominio: `https://apex.devsigner.xyz/`.

## Comprobación pública

- `https://apex.devsigner.xyz/` responde `HTTP/2 200`.
- `https://apex.devsigner.xyz/media/hero-replay.mp4` responde `HTTP/2 200`, `video/mp4`, 1.259.386 bytes.
- `https://apex.devsigner.xyz/media/hero-replay.webm` responde `HTTP/2 200`, `video/webm`.
- Playwright contra producción confirmó `toolbar: false`, `video: true`, las dos fuentes públicas,
  `data-active-mode: candles`, duración `12.12` s y consola sin errores.
- La barra `ONE SESSION / THREE MARKET VIEWS` ya no forma parte del DOM; los controles inferiores
  mantienen los nombres Candles, Footprint y Step Profile.

## Alcance

R14 publica el hero de vídeo generado desde la workstation real, mantiene el fallback PNG y conserva
la landing sin requests al replay histórico `/data/tardis/**`. El resto de la landing (primitivas
aisladas, banner Devsigner y footer) se publica junto con el mismo commit.
