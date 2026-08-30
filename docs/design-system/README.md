---
status: current
last_verified: 2026-08-30
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

Los nuevos componentes enlazan propiedades a variables existentes cuando exista un rol aplicable.
Las reglas de UI y JSX no introducen literales de color: `--pro-*` cubre superficies, estados de
mercado, profile, Footprint, ejes, acciones, actualizaciones y popovers. Los valores físicos viven
solamente en las definiciones de token, preservando la paleta independiente de Apex.

El chevron de los selects usa `--pro-select-chevron`: el navegador no puede interpolar una variable
CSS dentro del SVG data-URI, por lo que su color se conserva dentro de ese token de recurso. La
prueba de tokens recorre los CSS, JS y JSX ejecutables de `src` para impedir nuevos literales fuera
de los ficheros que los definen.

La extensión de marketing añade los espacios `--pro-space-24`, `32`, `48`, `64`, `80` y `96`, además de `--pro-button-marketing-height: 44px`, en la misma raíz canónica de `professional.css`. No constituye un tema nuevo y mantiene los roles de color existentes.

Consulta [Panel patterns](panel-patterns.md), [Chart patterns](chart-patterns.md), [Marketing patterns](marketing-patterns.md) y [Figma contract](../figma/README.md).

## Storybook

`/storybook/` documenta los roles CSS ejecutables bajo Foundations y las superficies de producto sin crear una segunda implementación. MarketChart se presenta con barras, profile y volumen generados localmente; el heatmap se mantiene desactivado en esas historias porque depende de tiles históricos y no es un fixture determinista. Las capas SVG internas del chart permanecen privadas: se verifican a través de las historias compuestas, no como una API pública del sistema.
