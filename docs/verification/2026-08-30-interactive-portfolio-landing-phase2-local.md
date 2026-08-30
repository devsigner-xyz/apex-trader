---
status: historical
last_verified: 2026-08-30
owners: product-design-engineering
---

# Interactive portfolio landing · phase 2 local verification

> Snapshot sustituido: el usuario revisó este prototipo el 31 de agosto de 2026 y pidió reemplazar
> el `MarketChart` completo por seis módulos aislados y compactos. La evidencia vigente continúa en
> `2026-08-31-interactive-portfolio-landing-isolated-modules-local.md`. Este documento conserva los
> resultados reales de R1 y no describe el checkout actual.

## Alcance verificado

Esta evidencia cubre únicamente el prototipo técnico vertical de la fase 2 sobre
`c3a1fe97621fa530987c2da6123b966f25f9b837` en la rama local `master`. No demuestra la landing
completa, un commit de esta iniciativa, un push, un despliegue Railway ni el estado de
`apex.devsigner.xyz`.

La dirección Figma fue aprobada por el usuario el 30 de agosto de 2026 y quedó sincronizada como
`APPROVED DIRECTION · IMPLEMENTATION IN PROGRESS` en el storyboard `656:7415`. Direction B y los
masters existentes permanecen intactos.

## Contrato implementado

- `ScrollScene` activa la escena cerca del viewport, calcula progreso en
  `requestAnimationFrame`, conserva el progreso continuo en CSS y solo notifica a React al cambiar
  de threshold semántico.
- `ChartModesShowcase` mantiene una sola instancia real de `MarketChart` para Candles, Footprint y
  Step Profile, con el mismo fixture, rango y contexto.
- Los tabs admiten click, flechas, Home y End. La selección manual pausa el avance por scroll y una
  acción explícita permite reanudarlo.
- Mobile 390 px y `prefers-reduced-motion` usan Footprint como estado estático completo y mantienen
  los tres tabs operables.
- `DeferredChartModesShowcase` difiere el chunk pesado hasta que la sección se aproxima al viewport.
- El chart usa preferencias memory-only. Los valores persistidos de `/demo` no se leen ni se
  modifican desde la landing.
- El fixture se etiqueta `DEMO FIXTURE · SAME MARKET EVENT` y no se presenta como replay histórico.

## Datos y frontera de carga

La landing no importa `useProfessionalPlayback`, no monta `ProfessionalTerminal` y no solicita
assets bajo `/data/tardis/**`. El chunk compartido `MarketChart` conserva definiciones internas del
layer de liquidez necesarias para `/demo`, pero el showcase desactiva esa capacidad y las pruebas de
red confirman que no ejecuta requests Tardis.

El runtime local referencia cinco PNG de `public/media/`. Los tres exports que dejó de consumir la
sección sustituida no se han borrado; su auditoría y retirada recuperable pertenecen a la fase 4.

## Bundle de producción

`pnpm run build` completó Vite y Storybook. Chunks principales del build local:

| Artefacto                        |       Raw |     Gzip | Lectura                             |
| -------------------------------- | --------: | -------: | ----------------------------------- |
| `index-d220c8af.js`              | 155.15 kB | 49.50 kB | shell inicial                       |
| `ChartModesShowcase-80a06da0.js` |   6.31 kB |  2.86 kB | escena lazy                         |
| `MarketChart-06967768.js`        |  58.21 kB | 19.98 kB | chart compartido por landing y demo |
| `DemoPage-62055817.js`           |  23.74 kB |  8.17 kB | replay y terminal lazy              |
| `index-7961f10e.css`             |  46.29 kB |  9.01 kB | estilos globales y escena           |

La línea base anterior tenía `DemoPage` en 81.50 kB y no tenía un consumidor landing del chart. El
build actual extrae `MarketChart` como chunk compartido: la landing solo lo solicita al acercarse a
la escena y `DemoPage` permanece separado del shell inicial.

## Verificación automatizada

Comandos ejecutados desde `/home/pablo/projects/apex-trader`:

```bash
pnpm run check:docs
pnpm run lint
pnpm run test:unit
pnpm run build
NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 TMPDIR=/tmp pnpm exec playwright test e2e/landing.spec.js
NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 TMPDIR=/tmp pnpm exec playwright test e2e/professional-terminal-modes.spec.js e2e/professional-terminal-panels.spec.js e2e/accessibility-focus.spec.js --project=chromium
```

Resultados:

- Documentación: contrato aprobado para los 20 archivos requeridos.
- ESLint: aprobado.
- Unit: 19/19 archivos aprobados, incluido `tests/scrollSceneState.test.js`.
- Build: aprobado; Vite y Storybook generados.
- Landing E2E: 18/18 en Chromium, Firefox y WebKit.
- Regresión `/demo`: 10/10 en Chromium para modos, paneles, persistencia, settings, foco y tabs.

La cobertura E2E prueba que el módulo de la escena no se carga en el primer fold, aparece al
aproximarse al viewport, no hace requests Tardis, reutiliza una única instancia de chart, conserva
preferencias sentinela, respeta prioridad manual y vuelve al control por scroll de forma explícita.
También prueba 390 px sin overflow horizontal y el fallback de reduced motion.

## Inspección visual y accesibilidad

- Desktop 1440 × 1000:
  `output/playwright/interactive-landing-phase2-desktop-viewport.png`.
- Mobile 390 × 844:
  `output/playwright/interactive-landing-phase2-mobile-390.png`.
- Storyboard Figma aprobado:
  `output/figma/interactive-landing-motion-storyboard-approved.png`.
- Consola del navegador local: 0 errores y 0 warnings.

La inspección confirmó jerarquía legible, chart contenido, tabs visibles, ausencia de clipping
horizontal y composición estática completa en mobile. Las capturas bajo `output/` son evidencia
local ignorada por Git; no forman parte del artefacto publicado.

## Gate y siguiente fase

La implementación técnica de fase 2 está completa localmente. El gate permanece abierto hasta que
el usuario revise y apruebe este prototipo. No se integrarán `DomShowcase` ni `MarketFlowShowcase`, y
no se publicará este estado híbrido como landing final, antes de superar esa revisión.
