---
status: current
last_verified: 2026-08-27
owners: product-design
---

# Figma contract

Archivo maestro: [Apex Trader](https://www.figma.com/design/Ze9eGnPaNDj8u0oB1iUt3C?node-id=11-2).

## Producción

| Route concept | Production frame | MarketChart variant     |
| ------------- | ---------------- | ----------------------- |
| Footprint     | `61:2`           | `132:867` / `132:1261`  |
| Price Chart   | `62:1697`        | `132:3266` / `132:3521` |
| Step Profile  | `169:4796`       | `167:2377` / `167:2633` |

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

## Anotaciones

Categorías: Development, Interaction, Accessibility y Content. Identificador: `AT-<AREA>-NNN`, por ejemplo `AT-CHART-VA-001`.

Una anotación contiene una regla local observable. No almacena secretos, rutas locales ni una especificación completa. Si afecta a más de un componente, también se documenta en `docs/design-system/` o `docs/decisions/`.

## Sincronización

1. Verificar web y código.
2. Localizar master, variantes e instancias por ID.
3. Reutilizar variables y componentes locales.
4. Modificar incrementalmente y validar estructura, descripción y anotaciones.
5. Capturar master y las tres composiciones de `01 Production UI`.
6. Actualizar Figma docs y especificación de producto.

Una captura es evidencia visual, no prueba bindings, variantes, accesibilidad o persistencia.
