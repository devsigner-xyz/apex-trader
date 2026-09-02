---
status: current
last_verified: 2026-09-02
owners: product-design-engineering
---

# Panel patterns

El header global de la terminal conserva 44 px de altura y presenta el wordmark vectorial de Apex
Trader a 118 px de ancho. El logo sustituye al nombre compuesto con tipografía de interfaz y no
añade controles ni metadata a esa franja.

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
| Chart común  | Profile, value area y volumen  | Persistente        |
| Candles      | Color up/down y heatmap         | Persistente        |
| DOM          | Select de grouping             | Transitorio actual |
| Time & Sales | Radio single-select            | Transitorio        |

Una medida única de ancho/anclaje sigue sin normalizar.

## Tablas y vistas

Cada tab declara columnas, acciones, vacío, densidad y disclosure. Account & Risk usa un resumen
jerarquizado y un modal de detalle, no una tabla genérica. El CTA del resumen abre un dialog modal,
mueve foco a su cierre, atrapa Tab, cierra con Escape o backdrop y restaura foco al CTA.

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

La terminal es una workstation horizontal. 1920 px es el ancho recomendado. En viewports móviles
y dispositivos tablet de puntero coarse, una capa bloqueante muestra el replay de la home, explica
la restricción desktop y ofrece el CTA al case study. No se presenta el scroll horizontal como una
solución responsive.

Time & Sales conserva filas de 26 px con `flex-grow: 0`: una lista corta deja espacio vacío debajo
y nunca redistribuye la altura disponible entre sus trades.

Cuando una superficie usa `accent` o el cream oficial como fondo, su texto usa `on-accent` oscuro.
El current-price tag, su precio y countdown aplican juntos este contrato; no se permite texto blanco
sobre ese fondo.
