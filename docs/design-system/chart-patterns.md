---
status: current
last_verified: 2026-08-29
owners: product-design-engineering
---

# Chart patterns

Estas definiciones son el vocabulario canónico para producto, Figma, accesibilidad y handoff. `Volume=Shown/Hidden` modifica la composición del panel inferior, pero no cambia lo que codifica el tipo de gráfico.

## Candles · OHLC

Cada vela resume `Open`, `High`, `Low` y `Close` de un intervalo seleccionado:

- el cuerpo conecta apertura y cierre;
- la mecha alcanza máximo y mínimo;
- el color expresa dirección del intervalo, no agresión compradora o vendedora.

`OHLC` es el acrónimo contractual. No usar `PHCL` ni variantes locales para nombrar el patrón.

En hover, la toolbar sustituye temporalmente los valores de la barra actual por `O`, `H`, `L`, `C`, `Δ` y `V` de la vela bajo el puntero. La vista permite entre 28 y 160 barras: el límite inferior evita una separación excesiva en el zoom-in y el superior conserva la lectura de cuerpos y mechas.

## Footprint

Cada barra precio-tiempo distribuye las ejecuciones por nivel de precio. El lado bid representa ventas agresivas ejecutadas contra bids y el lado ask compras agresivas ejecutadas contra asks.

Las celdas permiten leer volumen bid/ask, imbalance, delta y POC local del intervalo. No debe describirse como una reconstrucción visual del libro de órdenes: representa operaciones ejecutadas.

La vista permite entre 4 y 13 barras. En el zoom-out máximo, cada mitad bid/ask reserva ancho suficiente para su valor compacto y padding; el texto no desborda la celda ni invade la barra vecina.

## Step Profile

Cada intervalo contiene su propio perfil horizontal de volumen bid/ask por precio, un POC local y una espina high–low. La repetición de perfiles permite comparar la estructura de la subasta a lo largo del tiempo.

Se diferencia del Volume Profile de rango en que Step Profile genera una distribución por intervalo; el overlay genera una sola distribución para todo el rango visible.

La vista permite entre 1 y 12 barras. El ancho central, los valores y los perfiles laterales mantienen una caja mínima legible en el zoom-out máximo y no se solapan con el siguiente intervalo.

## Densidad temporal e interacción

- El cursor en reposo es neutral; la mano cerrada aparece únicamente durante pan con click principal mantenido.
- El hover dentro del plot muestra un crosshair neutral de 1 px, punteado y con mayor contraste que VAH/POC/VAL. La guía horizontal se limita al área de precio y la vertical continúa por el panel de volumen cuando está visible.
- El viewport admite offsets temporales fraccionales y recorta barras parciales en los bordes del plot.
- Una barra participa en cálculos visibles cuando su centro temporal cae dentro del plot. Las barras buffer parcialmente dibujadas cuyo centro queda fuera son solo presentación.
- Los ticks temporales se reducen dinámicamente según el ancho disponible y nunca se apoyan en un conteo fijo que pueda provocar solapamientos.
- El resumen textual del rango visible no se dibuja sobre la escala temporal.

## Visible-range Volume Profile

Agrega volumen ejecutado por precio usando las velas actualmente visibles:

- el ancho expresa volumen total en cada nivel;
- la división de color expresa contribución bid/ask;
- POC identifica el nivel de máximo volumen;
- VAH y VAL delimitan el área que cubre al menos el 70 % del volumen visible.

Se recalcula después de pan, zoom o cambio de timeframe. Las barras y los niveles VAH/POC/VAL son capas de visibilidad independientes.

## Historical liquidity heatmap

Candles puede incorporar una capa Canvas bajo el SVG con liquidez limit resting agregada por
precio y tiempo. Azul verdoso expresa niveles menores; arena y terracota, concentraciones mayores.
La intensidad cromática usa una escala logarítmica global y el control `INTENSITY` modifica solo la
opacidad del overlay.

En 5 min la textura conserva la evolución de 5 segundos. En temporalidades superiores cada nivel
se resume por vela mediante una media temporal que incluye ausencias de liquidez. La presentación
resultante enfatiza bandas persistentes, mantiene la alineación con las velas y deja vacío cualquier
slot posterior al reloj histórico.

La capa no sustituye OHLC, Footprint, Volume Profile ni DOM. Las velas, crosshair, ejes y markers
permanecen por encima. Footprint y Step Profile no muestran el heatmap en la primera entrega. La
definición de datos, resolución y límites vive en
[Historical liquidity heatmap](../product/liquidity-heatmap.md).

## Reglas de documentación

- La definición visible vive junto a cada pareja de variantes dentro de `05.10 · Trading · Market Chart`; el comportamiento compartido ocupa un bloque superior y el contexto de página usa `_Documentation/Page intro`.
- Cada variante activa mantiene la misma definición en `description` y una anotación `AT-CHART-TYPE-*`.
- Cada overlay de Volume Profile incorpora `AT-CHART-VP-002` además de las reglas de cálculo del master.
- Line sigue siendo una variante legacy y no forma parte del vocabulario de producto actual.
