---
status: published
last_verified: 2026-09-01
owners: product-design-engineering
---

# Interactive portfolio landing R15 - production verification

## Release

- Commit publicado: `a9d71bb7769c57b514dcfd9f5e4375aff7ad421e` (`feat: refine interactive landing experience`).
- Repositorio: `devsigner-xyz/apex-trader`, rama `master`.
- Railway deployment: `4662103f-9868-46d8-a943-3063d7f29a6a`.
- Railway production: `SUCCESS`, instancia `RUNNING`.
- Dominio: `https://apex.devsigner.xyz`.

## Verificación local

- `pnpm run check:docs` - correcto.
- `pnpm run lint` - correcto.
- `pnpm run test:unit` - 19/19 correctos.
- `pnpm run build` - aplicación y Storybook correctos.

## Verificación pública

- `https://apex.devsigner.xyz/` responde `HTTP 200`.
- `hero-replay.mp4` y `hero-terminal-candles.png` responden `HTTP 200`.
- El CTA secundario del hero apunta a `https://devsigner.xyz`, usa `target="_blank"` y
  `rel="noopener noreferrer"`.
- El disclaimer visible identifica la demo como portfolio de `devsigner.xyz` y aclara que no es
  trading en vivo.
- Liquidity Heatmap es visible y no contiene la etiqueta `TIME`.
- La comprobación headless de la UI pública no registró errores de consola.

## Límites

- La suite E2E local no pudo iniciar el servidor Vite en este entorno por la restricción local
  `listen EPERM`; la UI pública se verificó directamente con navegador headless.
- Figma conserva R2 como referencia aprobada y no refleja R3-R16.
