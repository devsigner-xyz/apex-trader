---
status: current
last_verified: 2026-08-29
owners: product-engineering
---

# Historical replay recovery local verification

## Alcance

Verificación local de la recuperación del replay histórico ante fallos transitorios de transporte
y respuestas recuperables. No cambia dataset, manifest, templates, reloj, velocidad, geometría,
JSX visible, CSS, rutas, persistencia ni Railway.

## Política verificada

- Tres intentos totales por operación con esperas sustituibles de 100 ms y 200 ms.
- Retry para `TypeError`, `NetworkError`, `TimeoutError`, HTTP 408, 429 y 5xx.
- Sin retry para `AbortError`, otros 4xx, schemas inesperados o payloads JSON/gzip corruptos.
- Loading inicial hasta éxito o agotamiento; última vista conservada durante el retry de un chunk.
- Promesa fallida eliminada tras agotamiento y solicitud posterior libre para volver a cargar.
- Prefetch y liquidez opcional degradan de forma aislada, sin desmontar la terminal.

## Evidencia

- `node --test tests/historicalAssetCache.test.js tests/proPlayback.test.js`: pass. Las esperas se
  sustituyeron por una función espía; los tests comprueban intentos y delays exactos.
- `pnpm exec playwright test e2e/historical-recovery.spec.js --workers=1 --retries=1`: 6 passed
  en Chromium, Firefox y WebKit. El test intercepta el chunk 066 durante loading y el 067 durante
  prefetch y transición a chunk actual; comprueba requests exactos, identidad de la terminal y
  estabilidad de la última vista sin añadir sleeps a la prueba.

## Gates de cierre

- `git diff --check`: pass.
- `pnpm run check:docs`: `Documentation contract OK (20 required files)`.
- `pnpm run lint`: pass.
- `pnpm run test:unit`: 12 test files passed.
- `pnpm run build`: pass con Vite 4.3.9.
- `pnpm run test:e2e --workers=1 --retries=1`: 102 passed en 7.8 min.

WebKit requirió únicamente `NO_PROXY=localhost,127.0.0.1`,
`no_proxy=localhost,127.0.0.1` y `TMPDIR=/tmp` para evitar el fallo de proxy del entorno WSL. No se
modificaron Playwright, sus timeouts, retries, configuración o aserciones existentes.
