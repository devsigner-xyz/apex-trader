---
status: current
last_verified: 2026-08-29
owners: product-design-engineering
---

# Panel patterns

## Headers contextuales

| Variante       | Altura | Uso                  | Contrato                                  |
| -------------- | -----: | -------------------- | ----------------------------------------- |
| Search toolbar |  42 px | Markets              | Search flexible; settings termina la fila |
| Chart toolbar  |  46 px | Chart                | OHLC/contexto, timeframe, modo y settings |
| Context header |  44 px | DOM, Time & Sales    | Metadata izquierda, settings derecha      |
| Tab bar        |  38 px | Orders and positions | Tabs sin métricas globales                |
| Headerless     |   0 px | Execution            | El primer control inicia el panel         |

No añadas títulos para compensar metadata poco clara. Corrige la metadata o el nombre accesible.

Los separadores de Markets, DOM, Execution y Time & Sales usan una sola línea de 1 px con el
token `border`, igual que los controles de formulario. El token `strong` se reserva para énfasis
temporal como popovers, focos o asas; no se apilan dos bordes en una misma unión.

## Settings popover

- Anclado al trigger superior derecho.
- Raised opaco o casi opaco, borde strong, sombra y padding 12 px.
- Título terracota uppercase de 10 px y filas de 28–30 px.
- Cierre con Escape y pointer fuera.
- Trigger con `aria-controls`, `aria-expanded` y nombre; dialog con nombre.
- El trigger conserva foco al abrir; el primer Tab llega al primer control habilitado.
- Tab y Shift+Tab ciclan el trigger y los controles habilitados del panel. Los disabled no entran
  en ese scope.
- Escape desde un control cierra y restaura foco al trigger; reactivar el trigger cierra sin mover
  el foco. Un `pointerdown` exterior cierra sin impedir que el destino reciba su foco nativo.
- El listener de teclado y pointer existe solo mientras el panel está abierto y debe limpiarse al
  cerrar o desmontar. No se usa `aria-modal="true"`: los settings siguen siendo popovers no modales.

| Contexto     | Control                        | Persistencia       |
| ------------ | ------------------------------ | ------------------ |
| Markets      | Checkboxes con obligatorios    | Persistente        |
| Chart        | Tres checkboxes independientes | Persistente        |
| DOM          | Select de grouping             | Transitorio actual |
| Time & Sales | Radio single-select            | Transitorio        |

Una medida única de ancho/anclaje sigue sin normalizar.

## Tablas y vistas

Cada tab declara columnas, acciones, vacío, densidad y disclosure. Account & Risk usa métricas y límites, no una tabla genérica.

La tab bar de Activity usa roving `tabIndex`: la seleccionada tiene `0` y las demás `-1`.
ArrowLeft/ArrowRight circulan y activan la tab anterior/siguiente; Home y End activan los extremos.
Click, Enter y Space conservan la activación nativa. Las relaciones `aria-selected`,
`aria-controls` y `aria-labelledby` se actualizan junto con el `tabpanel` activo.

- Danger: Close y Cancel.
- Neutral navigation: Details.
- Positive/negative: resultados y lados de mercado, no todas las últimas celdas.

## Visible-range profile markers

VAH, POC y VAL son independientes de las barras:

- chip sólido 38 × 16 px, radio 2 px;
- texto centrado con contraste;
- borde izquierdo alineado a 8 px del inicio del plot, opuesto al Volume Profile;
- POC usa POC/accent; VAH y VAL usan profile value;
- cada nivel conserva una única línea edge-to-edge, punteada y de baja opacidad;
- el chip cubre su línea y no añade un segundo segmento dentro del Volume Profile;
- el toggle oculta o muestra líneas y chips conjuntamente.

## Fixtures y responsive

La demostración se identifica coherentemente. No uses verde como “live” para datos simulados.

La terminal es una workstation horizontal. Hasta decidir otra cosa, 1920 px es el ancho recomendado y por debajo se conserva scroll horizontal. Un layout compacto debe especificar paneles plegados, estado y recuperación de foco.
