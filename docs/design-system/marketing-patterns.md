---
status: current
last_verified: 2026-08-28
owners: product-design-engineering
---

# Marketing patterns

## Alcance

La landing de Apex Trader amplía el lenguaje visual del producto sin crear un tema paralelo. Usa los roles `--pro-canvas`, `--pro-panel`, `--pro-raised`, `--pro-text`, `--pro-muted`, `--pro-border`, `--pro-subtle` y `--pro-accent`. Verde y rojo siguen reservados a significado de mercado dentro de las capturas del producto.

## Dimensiones aprobadas

- Espaciado editorial: `--pro-space-24`, `--pro-space-32`, `--pro-space-48`, `--pro-space-64`, `--pro-space-80` y `--pro-space-96`.
- Altura de acción de marketing: `--pro-button-marketing-height: 44px`.
- Radio local: 3 px, coherente con controles y paneles existentes.
- Roboto Mono identifica navegación, labels, métricas y evidencia. Inter expresa tesis y encabezados editoriales.

Estos valores viven en `src/styles/professional.css`; `src/styles/landing.css` solo los consume y compone.

## Composición Direction B

El orden contractual es Header, Opening thesis, The blind spot, Three readings, One clock, Session evidence, The workspace, Case study endorsement y Footer. La revelación del terminal completo se retrasa hasta `The workspace`: las secciones anteriores explican progresivamente qué se pierde al leer solo OHLC.

- Header sólido y sticky, sin blur ni transparencia.
- Canvas y panel alternan la jerarquía sin gradientes, glass o neón.
- Las imágenes son exports exactos del archivo maestro; no se recrean charts promocionales.
- Las acciones primarias enlazan con elementos `<a href="/demo">` reales.
- Foco visible, skip link y heading hierarchy son obligatorios.

## Responsive y motion

- Desktop conserva padding lateral de 80 px dentro de una referencia de 1440 px.
- Tablet reduce el padding y reorganiza deconstrucción, evidence y paneles conectados sin reducir texto hasta hacerlo ilegible.
- Mobile usa 24 px laterales y 64 px verticales; lecturas y paneles pasan a una columna y las métricas a 2 × 2.
- La landing no depende de hover ni de movimiento para explicar contenido. `prefers-reduced-motion` conserva todo el contenido en estado estático.
- Ningún breakpoint debe introducir overflow horizontal.
