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

El orden contractual vigente es Header, Opening thesis, Market primitives, Devsigner banner y Footer.
Opening thesis muestra el terminal completo en su carrusel; las secciones de contexto One clock,
Session evidence y The workspace se mantienen como snapshots históricos, pero no forman parte de la
landing actual. `The blind spot` se elimina porque repetía la tesis sin aportar una interacción o
una lectura adicional. El CTA secundario del hero dirige a Devsigner en una pestaña nueva.

- Header sólido y sticky, sin blur ni transparencia.
- Canvas y panel alternan la jerarquía sin gradientes, glass o neón.
- El hero usa un vídeo 16:9 del workstation real con el mismo encuadre. Recorre Candles, Footprint y
  Step Profile, conserva controles manuales y pausa explícita. El vídeo usa `contain`, no `cover`,
  para mantener visibles watchlist, chart, DOM, ejecución, tape y activity en cada estado; el poster
  cubre carga inicial y movimiento reducido. Su marco mantiene un borde neutro, sin franja superior
  de color acento.
- Las acciones primarias enlazan con elementos `<a href="/demo">` reales.
- Foco visible, skip link y heading hierarchy son obligatorios.

## Responsive y motion

- Desktop conserva padding lateral de 80 px dentro de una referencia de 1440 px.
- Tablet reduce el padding y reorganiza el hero y los módulos alternos sin reducir texto hasta hacerlo ilegible.
- Mobile usa 24 px laterales y 64 px verticales; lecturas y paneles pasan a una columna.
- La landing no depende de hover ni de movimiento para explicar contenido. `prefers-reduced-motion` conserva todo el contenido en estado estático.
- Ningún breakpoint debe introducir overflow horizontal.

## Copy orientado a producto

- El copy público explica qué puede entender o hacer el usuario. No presenta cantidades de filas,
  estados de animación, detalles de fixtures ni notas de implementación como argumentos de valor.
- Los eyebrows de los módulos anticipan una lectura concreta: dirección, presión, concentración,
  aceptación, liquidez o ritmo de ejecución. El heading desarrolla esa lectura y el body explica
  cuándo resulta útil.
- Los términos del producto —Candles, Footprint, Step Profile, Volume Profile, DOM y Time & Sales—
  se conservan cuando ayudan a reconocer la herramienta, pero siempre acompañados de una
  explicación comprensible.
- La navegación usa `Component library` y `Devsigner`. Las acciones
  principales usan `Open demo`; la acción secundaria del hero usa `Visit devsigner.xyz` y abre
  `https://devsigner.xyz` en una pestaña nueva. El hero incluye un disclaimer breve que identifica
  la demo de portfolio de `devsigner.xyz` y aclara que no es trading en vivo.
- La promesa debe ser verificable por el producto mostrado. No se afirma conexión a broker,
  operativa en vivo ni funcionalidad que la demo no exponga.

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
- Las siete filas son unframed: tanto la fila como el área visual eliminan surface, borde, radio y
  shadow. La columna de copy tampoco añade separadores verticales. DOM y Last Trades mantienen
  únicamente el panel real que contiene sus datos y controles.
- Volume Profile se representa sin candles y conserva POC, VAH y VAL mediante líneas discretas y
  punteadas. La escena no añade un eje de precios lateral ni un wrapper exterior.
- Liquidity Heatmap se representa como líneas continuas por precio y tiempo, con un glow muy sutil y
  un header de contexto inspirado en el chart profesional; su fixture local procede de una muestra
  estática del replay de 30 min y su settings popover reutiliza el slider real de intensidad, de 20%
  a 100% en pasos de 5%, sin cargar tiles.
- DOM limita su lectura a 3 asks + last + 3 bids y ocupa hasta 500 px, centrado, con columnas sin
  elipsis. Su last price y spread forman parte de la animación y cambian entre estados alineados al
  tick. Last Trades muestra seis impresiones en filas de 42 px para ganar contexto sin duplicar la
  altura del módulo.
- DOM y Last Trades conservan su context header, cabeceras y trigger de settings. El price grouping
  del DOM y el filtro all/buy/sell de Trades son funcionales, transitorios y reutilizan el foco,
  cierre y tokens del producto.
- Verde y rojo conservan significado de buy/bid y sell/ask. El naranja sigue reservado a acción y
  POC; no se usa como decoración arbitraria.
- Las escenas reutilizan capas, geometría, filas, formato y tokens profesionales; no copian una
  captura del componente.
- Un reloj determinista compartido actualiza cantidades cada 1,4 s. `IntersectionObserver` lo activa
  cerca del viewport, `document.hidden` lo pausa y reduced motion fija un estado final legible.
- Cada visual incorpora un fondo CSS neutral y `aria-hidden`, sin surface, borde ni sombra. Dos
  `linear-gradient` forman una retícula de 36 px y una máscara radial la desvanece hacia los bordes.
  La capa comparte `--pro-subtle`, usa opacidad 0.26 y permanece estática en todos los estados; el
  motion se reserva para los datos que explican el producto.
- En mobile el layout pasa a una columna manteniendo la proporción de cada visual. No hay zoom de una
  terminal de 1920 px ni overflow horizontal.

El media de producto del hero se sirve como vídeo con poster estático; las siete explicaciones de
Market primitives siguen siendo componentes React reales.
Las filas de Market primitives no muestran numeración decorativa; el orden se comunica mediante la
posición, el nombre de la herramienta y su explicación.
