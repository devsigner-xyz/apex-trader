---
status: current
last_verified: 2026-08-28
owners: product-design
---

# Apex Trader design system

El sistema visual vive en CSS (`src/styles/professional.css`) y en las variables, estilos y componentes locales del archivo maestro de Figma.

Figma organiza 28 primitivos, 37 roles semánticos y 24 dimensiones bajo `Apex Proposal / Primitives`, `Semantic` y `Dimensions`. El producto usa roles CSS `--pro-*`. La equivalencia debe mantenerse explícita; no se crea un segundo set de tokens para resolver un caso aislado.

## Principios

- Canvas carbón, superficies densas y bordes discretos.
- Texto primario claro; metadata y ejes quietos.
- Naranja como acento limitado, no estado universal.
- Verde y rojo expresan buy/positive y sell/negative; no decoran filtros neutros.
- Roboto Mono para datos densos; Inter para labels y estructura cuando lo define el patrón.
- Estados no dependen solo del color.
- Un panel puede omitir título visible, pero conserva nombre accesible.

## Capas

1. Primitivos físicos: neutral, orange, green, red, blue y profile.
2. Roles semánticos: canvas, panel, raised, text, border, market, chart y action.
3. Dimensiones: spacing, radius, row/control sizes, strokes y font sizes.
4. Patrón/componente: headers, popovers, filas, tabs y markers.

Los nuevos componentes enlazan propiedades a variables existentes cuando exista un rol aplicable. Los colores hard-coded de grid/profile son deuda a promover antes de ampliar temas.

La extensión de marketing añade los espacios `--pro-space-24`, `32`, `48`, `64`, `80` y `96`, además de `--pro-button-marketing-height: 44px`, en la misma raíz canónica de `professional.css`. No constituye un tema nuevo y mantiene los roles de color existentes.

Consulta [Panel patterns](panel-patterns.md), [Chart patterns](chart-patterns.md), [Marketing patterns](marketing-patterns.md) y [Figma contract](../figma/README.md).
