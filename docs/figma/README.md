---
status: current
last_verified: 2026-08-31
owners: product-design
---

# Figma contract

Archivo maestro: [Apex Trader](https://www.figma.com/design/Ze9eGnPaNDj8u0oB1iUt3C?node-id=11-2).

## Landing pública

| Breakpoint   | Frame actual                                 | Estado                           |
| ------------ | -------------------------------------------- | -------------------------------- |
| Desktop 1440 | `609:7459` · Direction B · Beyond the candle | Current implementation reference |
| Mobile 390   | `621:7636` · Direction B · Beyond the candle | Current implementation reference |

Direction B sustituye a Direction A como referencia de la landing. Los roots y exploraciones de Direction A se retiraron del área activa; no deben usarse para reconstruir copy, estructura o responsive.

La implementación conserva el orden Header → Opening thesis → The blind spot → Three readings → One clock + Session evidence → Product reveal → Case study endorsement → Footer. Los ocho media exports de producto se versionan bajo `public/media/`; una captura verifica apariencia, mientras que rutas, lazy loading, semántica y accesibilidad se verifican en código y navegador.

### Dirección interactiva y revisión R2

La sección `656:7412` (`Interactive portfolio landing`) contiene dos generaciones. R1 fue aprobada
el 30 de agosto de 2026 y se conserva como snapshot. Tras revisar el prototipo, el usuario pidió el
31 de agosto que cada gráfico y superficie se explicase de forma aislada y compacta; ese feedback
define R2 `688:21215`, contrato vigente de implementación.

| Artefacto           | Node ID     | Estado                                  |
| ------------------- | ----------- | --------------------------------------- |
| Desktop 1440        | `656:7413`  | Approved direction                      |
| Mobile 390          | `656:7414`  | Approved direction                      |
| Motion storyboard   | `656:7415`  | Approved R1 snapshot · superseded by R2 |
| Isolated modules R2 | `688:21215` | Current implementation contract         |

R1 reutiliza botones, MarketChart, OrderBook/DOM y Time & Sales como instancias de masters locales y
queda documentada en [Interactive portfolio landing — Figma approval
gate](../verification/2026-08-30-interactive-portfolio-landing-figma.md). R2 no modifica esos masters
ni Direction B: recorta instancias editables para definir el encuadre de cada primitivo y usa
geometría vectorial ligada a variables para Volume Profile.

El mapping R2 vigente es:

| Contrato Figma           | Node ID     | Código React                                                                |
| ------------------------ | ----------- | --------------------------------------------------------------------------- |
| Candles · 5 bars         | `688:21217` | `CandlesLayer` dentro de `MarketPrimitivesShowcase.jsx`                     |
| Footprint · 1 bar        | `688:21218` | `FootprintLayer` dentro de `MarketPrimitivesShowcase.jsx`                   |
| Step Profile · 1 bar     | `688:21219` | `StepProfileLayer` dentro de `MarketPrimitivesShowcase.jsx`                 |
| Volume Profile aislado   | `688:21220` | `deriveSessionProfileBarGeometry` en la escena de landing                   |
| DOM · 3 + last + 3       | `688:21221` | `CompactDom` en `src/components/professional/Dom.jsx`                       |
| Last Trades · 3          | `688:21222` | `CompactTimeSales` en `src/components/professional/execution/TimeSales.jsx` |
| Carga y reloj compartido | `688:21215` | `DeferredMarketPrimitivesShowcase.jsx` + `marketPrimitiveFixtures.js`       |

La captura local del contrato completo es
`output/figma/interactive-landing-isolated-modules-r2.png`. Las imágenes bajo `output/` son evidencia
ignorada por Git; el nodo y esta documentación son la referencia durable.

## Producción

| Route concept | Production frame | MarketChart variant     |
| ------------- | ---------------- | ----------------------- |
| Footprint     | `61:2`           | `132:867` / `132:1261`  |
| Price Chart   | `62:1697`        | `132:3266` / `132:3521` |
| Step Profile  | `169:4796`       | `167:2377` / `167:2633` |

Los tres frames de producción están ordenados en una sola columna, en ese mismo orden, con 120 px entre pantallas.

## Masters

| Contrato        | Node ID     | Variantes                                               |
| --------------- | ----------- | ------------------------------------------------------- |
| MarketChart     | `101:3457`  | Mode × Volume; Line es legacy                           |
| Markets         | `102:55`    | Headerless search toolbar                               |
| OrderBook / DOM | `103:59`    | Context header                                          |
| ActivityBlotter | `508:12133` | View=Positions, Orders, Fills, Activity, Account & Risk |
| ExecutionPanel  | `150:6255`  | Side × Order Type, 10 variantes                         |
| TimeSales       | `144:1810`  | Header summary + settings                               |
| PanelSettings   | `328:10006` | Context=Markets, DOM, Chart, Time Sales                 |
| CheckboxOption  | `324:32`    | Value × State                                           |
| RadioOption     | `501:11585` | Unselected/Selected                                     |

Modifica masters antes de instancias. No recrees un master para cambiar documentación o layout si puede preservarse su identidad.

## Estructura del archivo

- Las 25 páginas activas usan canvas negro.
- `03 · Getting Started` conserva el frame `46:14` y funciona como mapa anotado de Markets, Chart, Activity, DOM, Execution, Time & Sales y Footer.
- `05 · Components` (`48:249`) y `06 · Utilities` (`48:264`) contienen resúmenes e índices, no separadores vacíos.
- Los separadores vacíos `46:5` y `46:7` se retiraron.
- `99 · Archive · Superseded Proposals` precede a `99.99 · Graveyard · Legacy UI` (`0:1`), que cierra el archivo.

El encabezado contextual reutilizable es `_Documentation/Page intro` (`530:7371`). Expone las propiedades de texto `Title` y `Description`; usa Roboto Mono, descripción a 14 px con line-height automático y altura Hug. Las páginas de componentes usan instancias de este master y conservan sus notas, variantes y masters existentes por separado.

## Documentación de gráficos

La página `100:2` integra la documentación junto al component set `101:3457`. Las ocho variantes están en una sola columna y completamente contenidas en el set. El comportamiento compartido vive en `542:7884`; Candles, Footprint, Step Profile y Line tienen bloques alineados `542:7896`, `542:7900`, `542:7904` y `542:7908`.

La antigua página independiente `465:9587` se eliminó después de migrar y verificar viewport temporal, escala de precio, persistencia, settings, accesibilidad y definiciones por modo. Los límites visibles se reconciliaron con el contrato actual: Candles 28–160 barras, Footprint 4–13 y Step Profile 1–12. Las variantes activas mantienen además descripciones equivalentes y anotaciones Content:

| Contrato       | Variantes o nodos               | Anotación           |
| -------------- | ------------------------------- | ------------------- |
| Candles / OHLC | `132:3266`, `132:3521`          | `AT-CHART-TYPE-001` |
| Footprint      | `132:867`, `132:1261`           | `AT-CHART-TYPE-002` |
| Step Profile   | `167:2377`, `167:2633`          | `AT-CHART-TYPE-003` |
| Volume Profile | `405:8931`, `405:9026`, `405:2` | `AT-CHART-VP-002`   |

Las definiciones canónicas viven en [Chart patterns](../design-system/chart-patterns.md). `OHLC` es el identificador correcto; no introducir `PHCL` como alias.

## Anotaciones

Categorías: Development, Interaction, Accessibility y Content. Identificador: `AT-<AREA>-NNN`, por ejemplo `AT-CHART-VA-001`.

Una anotación contiene una regla local observable. No almacena secretos, rutas locales ni una especificación completa. Si afecta a más de un componente, también se documenta en `docs/design-system/` o `docs/decisions/`.

## Sincronización

1. Verificar web y código.
2. Localizar master, variantes e instancias por ID.
3. Reutilizar variables y componentes locales.
4. Modificar incrementalmente y validar estructura, descripción y anotaciones.
5. Capturar el master en columna, su documentación asociada y las tres composiciones apiladas de `01 · Production UI`.
6. Actualizar Figma docs y especificación de producto.

Una captura es evidencia visual, no prueba bindings, variantes, accesibilidad o persistencia.
