---
status: current
last_verified: 2026-08-29
owners: product-engineering
---

# Settings popovers and Activity keyboard · local

## Alcance

Verificación local de la normalización de teclado y foco de los settings de Markets, Chart, DOM y
Time & Sales, y de las tabs de Activity. No cambia CSS, layout, dimensiones, textos, iconos,
Figma, rutas, fixtures, persistencia, reloj histórico, replay, datos de mercado ni geometría del
chart.

## Reproducción previa

Antes del cambio, el E2E focalizado fallaba en Chromium: Shift+Tab desde el trigger no envolvía al
último control, un range disabled de Chart dejaba escapar el foco y ninguna tab de Activity
declaraba el único `tabIndex=0`. Los cuatro paneles mantenían por separado los mismos listeners
globales de Escape y `pointerdown`.

## Contrato verificado

- `useSettingsPopoverFocus` es el único propietario reutilizable de listeners, cierre y recorrido
  de foco; cada panel conserva su markup, clases, estado local, IDs y atributos ARIA.
- Abrir mediante teclado conserva foco en el trigger; Tab llega al primer control habilitado y
  Tab/Shift+Tab envuelven trigger y controles habilitados. Los disabled quedan fuera del scope.
- Escape restaura el trigger, reactivar el trigger cierra conservando el foco y un `pointerdown`
  exterior permite que su destino reciba foco nativo.
- Activity mantiene un único `tabIndex=0`, selección y foco cíclicos con ArrowLeft/ArrowRight,
  Home/End y relaciones ARIA coherentes. Click, Enter y Space siguen usando activación nativa.

## Evidencia E2E

- `e2e/accessibility-focus.spec.js` separa cada settings panel en un caso determinista, sin
  screenshots ni esperas artificiales. Observa foco real con `toBeFocused`, disabled, wrap,
  Escape, trigger, cierre exterior y atributos ARIA.
- Chromium: 6/6 pass en 22.5 s.
- Firefox: 6/6 pass en 1.0 min.
- WebKit: 6/6 pass en 24.4 s usando únicamente `NO_PROXY=localhost,127.0.0.1`,
  `no_proxy=localhost,127.0.0.1` y `TMPDIR=/tmp` como workaround local del proxy.
- Suite completa: `pnpm run test:e2e --workers=1 --retries=1` con el mismo workaround: 120/120
  pass en 9.5 min.

## Gates de cierre

- `git diff --check`: pass.
- `pnpm run check:docs`: `Documentation contract OK (20 required files)`.
- `pnpm run lint`: pass.
- `pnpm run test:unit`: 12/12 pass.
- `pnpm run build`: pass con Vite 4.3.9.

## Límites

Esta evidencia es local. No se hizo commit, push, despliegue, cambio de Figma ni verificación de
producción.
