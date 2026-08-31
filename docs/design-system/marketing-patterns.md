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

El orden contractual R6 es Header, Opening thesis, Market primitives, One clock, Session evidence,
The workspace, Case study endorsement y Footer. Opening thesis ya muestra el terminal completo en
su carrusel; `The blind spot` se elimina porque repetía la tesis sin aportar una interacción o una
lectura adicional. El CTA secundario del hero salta directamente a Market primitives.

- Header sólido y sticky, sin blur ni transparencia.
- Canvas y panel alternan la jerarquía sin gradientes, glass o neón.
- El carrusel de apertura usa tres exports 16:9 del workstation real con el mismo encuadre. Solo
  cambia el modo activo entre Candles, Footprint y Step Profile; el crossfade es ligero y conserva
  controles manuales y pausa explícita. Las imágenes usan `contain`, no `cover`, para mantener
  visibles watchlist, chart, DOM, ejecución, tape y activity en cada estado.
- Las acciones primarias enlazan con elementos `<a href="/demo">` reales.
- Foco visible, skip link y heading hierarchy son obligatorios.

## Responsive y motion

- Desktop conserva padding lateral de 80 px dentro de una referencia de 1440 px.
- Tablet reduce el padding y reorganiza carrusel, evidence y módulos alternos sin reducir texto hasta hacerlo ilegible.
- Mobile usa 24 px laterales y 64 px verticales; lecturas y paneles pasan a una columna y las métricas a 2 × 2.
- La landing no depende de hover ni de movimiento para explicar contenido. `prefers-reduced-motion` conserva todo el contenido en estado estático.
- Ningún breakpoint debe introducir overflow horizontal.

## Patrón vigente: módulos de mercado aislados

El ajuste R3 evita reducir el terminal completo dentro de una sección editorial. Cada módulo usa una
fila compacta de dos columnas. La primera coloca visual a la izquierda y copy a la derecha; las
siguientes alternan ese orden:

- El contenedor desktop tiene 360 px de altura mínima, padding vertical de 48 px, gap de 64 px y un
  visual máximo de 560 px de ancho.
- Candles usa cinco barras próximas entre sí y mantiene high/low estables mientras cambia el close
  de la última. Footprint y Step Profile usan dos barras: una cerrada estable y una actual. No se
  muestran headers, tabs, settings, resizers ni chrome de chart.
- En Footprint y Step Profile la barra cerrada baja 6 px y la actual sube 6 px para distinguir sus
  siluetas sin convertir el desplazamiento en protagonista.
- Las seis filas son unframed: tanto la fila como el área visual eliminan surface, borde, radio y
  shadow. DOM y Last Trades mantienen únicamente el panel real que contiene sus datos y controles.
- Volume Profile se representa sin candles y conserva POC, VAH y VAL mediante líneas discretas y
  punteadas. Su eje derecho reutiliza surface, borde, ticks y formato del price axis profesional;
  cada precio queda alineado con el centro de su nivel, sin reintroducir un wrapper exterior.
- DOM limita su lectura a 3 asks + last + 3 bids y ocupa hasta 500 px, centrado, con columnas sin
  elipsis. Last Trades muestra seis impresiones en filas de 42 px para ganar contexto sin duplicar
  la altura del módulo.
- DOM y Last Trades conservan su context header, cabeceras y trigger de settings. El price grouping
  del DOM y el filtro all/buy/sell de Trades son funcionales, transitorios y reutilizan el foco,
  cierre y tokens del producto.
- Verde y rojo conservan significado de buy/bid y sell/ask. El naranja sigue reservado a acción y
  POC; no se usa como decoración arbitraria.
- Las escenas reutilizan capas, geometría, filas, formato y tokens profesionales; no copian una
  captura del componente.
- Un reloj determinista compartido actualiza cantidades cada 1,4 s. `IntersectionObserver` lo activa
  cerca del viewport, `document.hidden` lo pausa y reduced motion fija un estado final legible.
- Cada visual incorpora un backdrop SVG neutral y `aria-hidden`, sin surface, gradiente ni sombra.
  Los seis comparten línea fina, puntos, baja opacidad y movimiento lento, pero abstraen una
  geometría propia: trayectoria, celdas, escalones, perfil, ladder o flujo de impresiones. Solo el
  grupo primario se anima, con ciclos de 11–15 s; `prefers-reduced-motion` conserva la composición
  estática.
- En mobile el layout pasa a una columna manteniendo la proporción de cada visual. No hay zoom de una
  terminal de 1920 px ni overflow horizontal.

Las imágenes de producto se limitan al carrusel de modos en Opening thesis y al contexto completo de
The workspace. Las seis explicaciones de Market primitives siguen siendo componentes React reales.
