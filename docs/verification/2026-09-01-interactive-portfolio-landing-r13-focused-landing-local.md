---
status: current
last_verified: 2026-09-01
owners: product-design-engineering
---

# Interactive portfolio landing R13 — focused landing local

## Alcance

R13 simplifica `/` para conservar solo el hero, las seis vistas de Market primitives y un banner
final de Devsigner. Se retiran One clock, Session evidence y The workspace, junto con sus métricas,
callouts, imagen de terminal completa y CTA de cierre.

La navegación deja de apuntar a `#session` y `#workspace`; mantiene Market views, Component library,
Devsigner y Open workspace. El banner final enlaza directamente a `https://devsigner.xyz` y conserva
la atribución del estudio sin añadir afirmaciones de broker u operativa en vivo.

No cambia el replay de `/demo` ni sus rutas. El carrusel de imágenes del hero se sustituye por el
vídeo grabado `hero-replay.mp4`/`hero-replay.webm`, con poster estático y controles de segmento.

## Verificación local

Completada el 2026-09-01:

- `git diff --check` — correcto;
- `pnpm run check:docs` — correcto, 20 documentos requeridos;
- `pnpm run lint` — correcto;
- `pnpm run test:unit` — 19/19 suites/casos correctos;
- `pnpm run build` — aplicación y Storybook correctos;
- `PLAYWRIGHT_PORT=5190 NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 TMPDIR=/tmp pnpm exec playwright test e2e/landing.spec.js --project=chromium --project=firefox --project=webkit --reporter=line` — 21/21 correctos;
- QA visual en 1440×1000 y 390×844 — `#session` y `#workspace` ausentes, CTA del banner con URL `https://devsigner.xyz`, sin overflow horizontal y consola sin errores ni warnings.

Evidencia visual:

- `output/playwright/landing-r13-focused/landing-r13-focused-desktop.png`;
- `output/playwright/landing-r13-focused/landing-r13-focused-mobile.png`.

## Límites

- Estado local: sin commit, push ni despliegue.
- R11 permanece publicado en producción; R12 tampoco se ha publicado.
- Figma conserva R2 como referencia aprobada y no refleja R3–R13.
