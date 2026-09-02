---
status: current
last_verified: 2026-08-28
owners: product-design-engineering
---

# 0005 - Public landing and canonical demo routes

## Context

La raíz y cualquier pathname desconocido cargaban implícitamente la terminal en Candles. Los modos se inferían mediante substrings y `ProfessionalTerminal` escribía history directamente. Añadir una landing bajo `/` sin separar esa arquitectura habría descargado el replay histórico y ejecutado el reloj aun cuando el usuario solo visitara contenido de marketing.

## Decision

`/` es la landing canónica. La demo usa `/demo`, `/demo/footprint` y `/demo/step-profile`. Las rutas públicas anteriores se conservan como aliases client-side que sustituyen la URL mediante `replaceState`; una ruta desconocida vuelve deliberadamente a `/`.

La resolución y construcción de rutas se implementa como lógica pura en `src/app/routes.js`. `App` posee history y carga `DemoPage` mediante `React.lazy`. `DemoPage` posee `useProfessionalPlayback` y compone el terminal. `ProfessionalTerminal` deja de conocer URLs concretas.

## Alternatives considered

- Mantener `/price-chart` como destino principal del CTA: no cumple el nuevo contrato de producto y deja la demo fragmentada.
- Renderizar landing y terminal desde el mismo `App`: mantiene el fetch de Tardis y el reloj en `/`.
- Añadir `react-router-dom`: introduce una dependencia para cuatro rutas estáticas que el resolver actual cubre de forma explícita y testeable.
- Eliminar las rutas antiguas: rompe bookmarks y enlaces publicados sin necesidad.

## Consequences

- `/` puede mantenerse ligero y no solicita datos históricos.
- Back/forward y cambios de chart mode se sincronizan desde un único propietario.
- Los E2E del terminal deben usar rutas `/demo/*` y la landing debe cubrir aliases y rutas desconocidas.
- El fallback SPA de `serve -s dist` sigue siendo necesario para accesos directos.
- La release debe verificar aliases, rutas canónicas y que la raíz pública no carga `/data/tardis/**`.
