---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing R3 · production verification

## Release

- Rama: `master`.
- Commit funcional: `874648af51d5af496a3fde26d634dff84ba91bcc`.
- Mensaje: `feat: refine interactive landing presentation`.
- Railway project: `13bffae0-3a6e-4d62-ae53-2b54d433ced9` (`apex-trader`).
- Environment: `3f049efd-d83e-485d-b2b0-12236272cf74` (`production`).
- Service: `c8ac903b-a7e3-46c0-85f5-6d5d40b934a7` (`apex-trader`).
- Deployment: `59df0562-4a17-4109-a226-e8a76c13113a`.
- Estado: `SUCCESS`.
- Image digest: `sha256:dd7ad3e8b6bdd4fba414042ff2d073491b3675c1df8467b777b28ee98a30d1b6`.

## HTTP y assets

Se comprobó directamente `https://apex.devsigner.xyz`:

| Recurso                     | Resultado |
| --------------------------- | --------- |
| `/`                         | 200       |
| `/demo`                     | 200       |
| `/demo/footprint`           | 200       |
| `/demo/step-profile`        | 200       |
| `/storybook/`               | 200       |
| `assets/index-e6599eb3.js`  | servido   |
| `assets/index-5151e186.css` | servido   |

## Navegador público

La comprobación directa con Chromium sobre el dominio público confirmó:

- tres slides y tres selectores en el carrusel; elegir Step Profile fija `activeMode=step-profile`,
  `aria-pressed=true` y pausa la rotación;
- seis `.landing-primitive`, sin `.market-chart`;
- alternancia desktop `visual copy` → `copy visual`;
- dos `.footprint-bar` y dos `.step-profile-bar`;
- ningún texto `NaN`;
- viewport móvil 390 px con `scrollWidth=clientWidth=390`;
- mobile recompone todas las filas como `visual` → `copy`;
- reduced motion fija carrusel y primitivas en estado `static`, fase 0;
- cero requests `/data/tardis/**` desde `/`;
- cero errores y cero warnings de consola.

## Límite de evidencia

Esta verificación prueba código, despliegue Railway y comportamiento público R3. Figma conserva R2
`688:21215` como referencia aprobada y todavía no refleja el carrusel, la alternancia ni las dos
barras de order flow; ese gap permanece documentado y no invalida el runtime publicado.
