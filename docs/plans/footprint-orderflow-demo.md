# Plan: modo Footprint / Order Flow de demostración

## Objetivo

Añadir una visualización opcional de footprint chart para ApexTrader que sea didáctica, visualmente coherente con el terminal actual y basada **exclusivamente en datos sintéticos locales**. No se conectará a exchanges, websockets ni APIs de trading.

## Principio de producto

Un footprint real agrupa operaciones tick a tick por nivel de precio e identifica el lado agresor:

- `bid`: volumen de ventas agresivas.
- `ask`: volumen de compras agresivas.
- `total = bid + ask`.
- `delta = ask - bid`.
- POC: nivel con mayor volumen de cada barra.
- Imbalance: desequilibrio diagonal entre Ask y Bid de niveles adyacentes.

Los datos OHLCV y el orderbook actual no permiten reconstruir un footprint real. Esta visualización será una simulación educativa explícita y no una representación del mercado.

## UX propuesta

### Activación

- Añadir un selector visible junto al gráfico: `Precio` | `Footprint`.
- Mantener `Precio` como modo inicial.
- Al activar `Footprint`, usar la zona principal del gráfico y colapsar el rail lateral de profundidad para ganar ancho de lectura.
- La profundidad puede mostrarse como panel secundario mediante un toggle, no simultáneamente por defecto.

### Etiquetado obligatorio

Mostrar siempre, dentro de la visualización:

`DEMO — datos sintéticos generados localmente. No son cotizaciones, no son ejecutables y no representan actividad de mercado.`

Cambiar cualquier título que diga `Kraken` en este modo por:

`BTC-USD · Simulación educativa`

### Contenido visual

Cada barra tendrá entre 8 y 20 niveles de precio y mostrará:

- Bid a la izquierda y Ask a la derecha, con formato `Bid × Ask`.
- Fondo de intensidad proporcional al volumen total.
- Menta de la paleta actual para presión compradora y lavanda para presión vendedora.
- POC con una marca lateral y etiqueta `POC`; no usar un color adicional.
- Imbalances con borde o marcador discreto.
- Delta y volumen total de la barra en la cabecera o pie.
- Contorno OHLC tenue para conservar la lectura de rango.
- Leyenda persistente: `Bid × Ask · Δ = Ask − Bid · SIMULADO`.

### Controles de demo

- Presets: `Balance`, `Ruptura compradora`, `Absorción`, `Ruptura fallida`, `Agotamiento`.
- Reproducción local: pausa, paso por barra y velocidad.
- `Reiniciar semilla`: el mismo escenario debe ser reproducible.
- Toggles: `POC`, `Imbalances`, `Delta`, `Totales`.
- En pantallas estrechas, ocultar los detalles más densos por defecto.

### Interacción y accesibilidad

- Hover/crosshair: resaltar barra y celda, y mostrar Bid, Ask, Total, Delta, ratio y banderas POC/imbalance.
- Click en una barra: abrir resumen educativo, no señal de trading.
- Proporcionar tabla/resumen textual de la barra seleccionada para teclado y lectores de pantalla.
- No usar solo color: añadir etiquetas, iconos y texto de ayuda.
- No conectar clics de una celda footprint al formulario de orden.

## Datos sintéticos

### Fuente de verdad

Generar primero operaciones locales y derivar el footprint de ellas:

```js
{ timestamp, price, qty, aggressor: 'buy' | 'sell' }
```

Agrupar después por intervalo de barra y tick. Esto garantiza coherencia entre operaciones, footprint, total, delta, POC e imbalances.

### Reglas de coherencia

- `total = bid + ask`.
- `delta = ask - bid`.
- Todos los ticks pertenecen al rango OHLC de su barra.
- El POC es el nivel con mayor total real de la barra.
- Los imbalances se calculan con una única convención diagonal documentada.
- La semilla y el preset determinan exactamente los mismos resultados.

### Escenarios

1. `Balance`: aceptación alrededor de una zona media, delta alternante y cierre cercano a apertura.
2. `Ruptura compradora`: Ask creciente, varios imbalances positivos consecutivos y desplazamiento gradual del rango.
3. `Absorción`: compras agresivas altas cerca del máximo, pero cierre sin continuación o de vuelta al rango.
4. `Ruptura fallida`: salida inicial, poco seguimiento y delta contrario en barras posteriores.
5. `Agotamiento`: volumen y tamaños de trade decrecientes cerca de un extremo antes de rotar.

Evitar números redondos, simetría perfecta y alternancias mecánicas. Usar ruido controlado, tamaños sesgados y concentración alrededor de zonas de aceptación.

## Diseño técnico

### Archivos nuevos

- `src/services/demoOrderFlow.js`
  - Generador seeded de trades sintéticos.
  - Agregador por barra/tick.
  - Cálculo de POC, delta, volumen, imbalances y stacked imbalances.
  - Fixtures deterministas por escenario.

- `src/components/ChartModeToggle.jsx`
  - Selector accesible `price | footprint`.

- `src/components/FootprintChart.jsx`
  - Crea/destroye su instancia Highcharts en mount/cleanup.
  - Renderiza cuadrícula SVG sobre ejes del gráfico con `chart.renderer`.
  - Muestra celdas, texto monoespaciado, POC, imbalances y tooltip.

- `src/components/FootprintInspector.jsx`
  - Resumen textual de la barra seleccionada y aviso educativo.

### Cambios de integración

- Extender `src/app/tradingState.jsx` con:
  - `chartMode: 'price' | 'footprint'`.
  - `demoScenario`.
  - `footprintOptions`.
  - `selectedFootprintBar`.
  - Estado de reproducción local.

- Actualizar `Grid.jsx`:
  - Renderizar `Chart` o `FootprintChart` según `chartMode`.
  - Ajustar el layout del área central y colapsar profundidad al activar footprint.

- Extender `src/styles/tokens.css`:
  - Intensidad de celda, borde imbalance, selección, POC y estados de simulación.
  - Reutilizar `--color-positive`, `--color-negative`, texto y superficies existentes; no añadir colores saturados independientes.

- Extender `src/styles/components.css`:
  - Cuadrícula footprint, leyenda, toolbar y panel inspector.

### Decisión de render

Usar Highcharts para escalas, crosshair y zoom, pero renderizar las celdas y etiquetas footprint con SVG usando `chart.renderer`.

Razón: una serie heatmap sirve para fondos de intensidad, pero no resuelve correctamente dos valores por celda, POC, imbalances y tipografía monoespaciada. El renderer SVG permite control preciso con una cantidad limitada de barras.

## Fases de implementación

1. **Modelo y tests puros**
   - Implementar generador seeded y agregación.
   - Testear invariantes numéricas, POC e imbalances.

2. **Estado y selector de modo**
   - Añadir `ChartModeToggle` y estado React.
   - Mantener `Precio` por defecto y sin regresiones.

3. **Renderer footprint mínimo**
   - Implementar 20–30 barras y 8–20 ticks por barra.
   - Añadir tooltip, POC y leyenda DEMO.

4. **Escenarios y reproducción**
   - Añadir presets, reinicio de semilla, pausa y paso por barra.

5. **Accesibilidad, responsive y validación**
   - Inspector textual, navegación por teclado y ajuste mobile.
   - Validar que profundidad, orderbook y formulario siguen funcionando.

## Criterios de aceptación

- El usuario puede cambiar entre `Precio` y `Footprint` sin recargar.
- El modo footprint deja claro que es una simulación local.
- Todos los valores derivados respetan las invariantes matemáticas.
- Los escenarios son reproducibles mediante semilla.
- No hay conexión de red nueva ni credenciales.
- Build, lint, `git diff --check` y E2E Chromium pasan.
- Existe smoke de los presets, toggle, tooltip/inspector y cambio de modo.
- La visualización mantiene la estética oscura, densa y monoespaciada de ApexTrader.
