---
status: current
last_verified: 2026-08-30
owners: product-design-engineering
---

# Professional frontend maintainability · production release

## Release publicado

- Commit: `6c6e2fac796b2627f044d985590ba56f9d98ccc9` (`refactor: modularize professional frontend`).
- Rama publicada: `origin/master`.
- Railway: proyecto `apex-trader`, entorno `production`, servicio `apex-trader`.
- Deployment `20318c48-b40f-49e6-b070-62322cde253f`: `SUCCESS` para el hash exacto del commit.

## Comprobación pública

- `https://apex.devsigner.xyz/` y `https://apex.devsigner.xyz/demo` responden correctamente.
- El dominio de servicio `https://apex-trader-production-16ae.up.railway.app/` responde correctamente.
- El HTML publicado carga `assets/index-ba6dee51.js` y `assets/index-74dde0c1.css`; el bundle de
  entrada referencia y sirve `assets/DemoPage-1f250ad9.js`.
- El documento, CSS y chunks corresponden al build local validado de la modularización profesional.

La evidencia local asociada está en
[Professional frontend maintainability P1 · local](2026-08-30-professional-maintainability-p1-local.md).
