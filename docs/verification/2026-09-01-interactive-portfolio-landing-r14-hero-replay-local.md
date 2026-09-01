---
status: current
last_verified: 2026-09-01
owners: product-design-engineering
---

# Interactive portfolio landing R14 — hero replay local

## Alcance

El hero de `/` usa una grabación real de la workstation generada con Playwright contra `/demo`.
La captura se realiza a 1600 × 900, espera 4 s para estabilizar Candles y cambia el gráfico con el
selector accesible, sin abrir ningún desplegable visible: Candles → Footprint → Step Profile.
Después se recortan los 4 s iniciales y se generan `public/media/hero-replay.mp4` y
`public/media/hero-replay.webm`, ambos de 12,12 s.

`HeroModeCarousel` reproduce el vídeo en loop, mantiene el poster `hero-terminal-candles.png` como
fallback y estado de `prefers-reduced-motion`, y conserva controles manuales que buscan el inicio de
cada segmento y pausan la reproducción. La landing sigue sin inicializar el replay histórico ni
solicitar `/data/tardis/**` durante la navegación pública.

La barra superior de cartela `ONE SESSION / THREE MARKET VIEWS` se elimina para que la workstation
ocupe todo el escenario del hero; los nombres de modo permanecen en los controles inferiores.

## Verificación local

- `pnpm run record:landing-hero` — correcto; genera ambos formatos con FFmpeg.
- `ffprobe` — MP4 y WebM, 1600 × 900, 12,12 s; H.264 y VP9 respectivamente.
- `pnpm run lint` — correcto.
- `pnpm run check:docs` — correcto, 20 documentos requeridos.
- `pnpm run test:unit` — 19/19 correctos.
- `pnpm run build` — aplicación y Storybook correctos.
- `PLAYWRIGHT_PORT=5190 NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 TMPDIR=/tmp pnpm exec playwright test e2e/landing.spec.js --project=chromium --project=firefox --project=webkit --reporter=line` — 21/21 correctos.
- QA visual 1440 × 1000 y 390 × 844 — el vídeo carga, reproduce, conserva 1600 × 900, no hay overflow, la consola está limpia y no hay requests `/data/tardis/**`.

Evidencia visual y fuente:

- `public/media/hero-replay.mp4`;
- `public/media/hero-replay.webm`;
- `output/playwright/landing-hero-video/landing-video-desktop.png`;
- `output/playwright/landing-hero-video/landing-video-mobile.png`;
- `scripts/record-landing-hero.mjs`.

## Límites

- Estado local: sin commit, push ni despliegue.
- El vídeo se sirve como asset estático; la landing no ejecuta Playwright ni el replay histórico en
  producción.
- Figma conserva R2 como referencia aprobada y no refleja R3–R14.
