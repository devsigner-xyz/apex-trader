---
status: current
last_verified: 2026-08-31
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

## Patrón vigente: módulos de mercado aislados

El contrato R2 evita reducir el terminal completo dentro de una sección editorial. Cada módulo usa
una fila compacta con visual a la izquierda y explicación a la derecha:

- El contenedor desktop tiene 324 px de altura mínima, padding de 32 px, gap de 64 px y un visual
  máximo de 560 × 260.
- Candles usa cinco barras; Footprint y Step Profile una barra cada uno. No se muestran headers,
  tabs, settings, resizers ni chrome de chart.
- Volume Profile se representa sin candles y conserva POC, VAH y VAL mediante líneas discretas y
  punteadas.
- DOM limita su lectura a 3 asks + last + 3 bids. Last Trades limita su stream a tres impresiones.
- Verde y rojo conservan significado de buy/bid y sell/ask. El naranja sigue reservado a acción y
  POC; no se usa como decoración arbitraria.
- Las escenas reutilizan capas, geometría, filas, formato y tokens profesionales; no copian una
  captura del componente.
- Un reloj determinista compartido actualiza cantidades cada 1,4 s. `IntersectionObserver` lo activa
  cerca del viewport, `document.hidden` lo pausa y reduced motion fija un estado final legible.
- En mobile el layout pasa a una columna manteniendo la proporción de cada visual. No hay zoom de una
  terminal de 1920 px ni overflow horizontal.

Las únicas imágenes de producto permitidas en la composición vigente son contextos donde se enseña
la UI completa: Opening thesis y The workspace.
