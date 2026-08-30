---
status: current
last_verified: 2026-08-29
owners: product-design-engineering
---

# Landing and routing specification

## Landing pública

`/` presenta Direction B · Beyond the candle. El copy público está en inglés y sigue el contrato Figma `609:7459` desktop y `621:7636` mobile. Comunica únicamente hechos observables del dataset y del producto: tres chart modes, un reloj sincronizado, una sesión BTCUSDT de 24 horas y 420,562 trades reales.

Las secciones son navegables mediante `#modes`, `#session` y `#workspace`. Los CTA principales son anchors reales hacia `/demo`; la navegación primaria incluye `Components`, un enlace mismo-origen hacia `/storybook/` para explorar superficies aisladas con datos deterministas. Los enlaces externos a Devsigner abren una pestaña nueva con `noopener noreferrer`. La atribución declara discretamente que Apex Trader está diseñado y construido por Devsigner y presentado como case study público interactivo.

## Rutas

| URL                  | Resultado           | Política                              |
| -------------------- | ------------------- | ------------------------------------- |
| `/`                  | Landing Direction B | Canónica                              |
| `/demo`              | Candles             | Canónica                              |
| `/demo/footprint`    | Footprint           | Canónica                              |
| `/demo/step-profile` | Step Profile        | Canónica                              |
| `/storybook/`        | Component library   | Catálogo estático generado en el build |
| `/price-chart`       | Candles             | `replaceState` a `/demo`              |
| `/footprint`         | Footprint           | `replaceState` a `/demo/footprint`    |
| `/step-profile`      | Step Profile        | `replaceState` a `/demo/step-profile` |
| Cualquier otra       | Landing             | `replaceState` a `/`                  |

`src/app/routes.js` es la fuente pura para resolver y construir rutas. `App.jsx` es el único propietario de `pushState`, `replaceState` y `popstate`; `ProfessionalTerminal` solo solicita un cambio de modo.

## Biblioteca de componentes

`pnpm run storybook` abre el explorador local en el puerto 6006. `pnpm run build:storybook` genera su salida en `dist/storybook`; el build de producción lo ejecuta después de Vite para publicar la ruta `/storybook/` junto con la landing. Las historias Canvas importan los estilos ejecutables de Apex y presentan fixtures locales; no cargan el replay histórico ni solicitan assets bajo `/data/tardis/**`.

## Frontera de carga

La landing no importa ni inicializa `ProfessionalTerminal` ni `useProfessionalPlayback`.
`DemoPage` se carga mediante `React.lazy` y es el único propietario del hook de replay. Visitar `/`
no debe solicitar ningún asset bajo `/data/tardis/**`.

Los PNG de `public/media/` son exports exactos de Figma y se sirven con caché immutable. Opening thesis usa carga eager; toda imagen por debajo del fold usa lazy loading.

## Estado de publicación

El contrato está implementado en el checkout local. No se considera desplegado ni verificado en `apex.devsigner.xyz` hasta una release autorizada con comprobación directa de Railway, rutas, UI y assets públicos.
