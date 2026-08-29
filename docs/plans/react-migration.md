# Plan de migración Vue a React

> **Snapshot histórico.** Este plan documenta la primera migración desde Vue y la terminal React
> anterior. No describe la arquitectura profesional actual ni autoriza conservar sus módulos,
> estilos, datasets o dependencias legacy.

## Objetivo

Migrar ApexTrader de Vue 3 a React manteniendo la apariencia terminal oscura, la cuadrícula de escritorio y los flujos de demostración actuales. Los estilos se consolidarán en un sistema de diseño local; no se añadirá una biblioteca de componentes ni se conectarán servicios de trading reales.

## Línea base observada

- Aplicación Vue 3 con Vite y Vuex; Pinia está instalada pero no es necesaria para el flujo actual.
- Vista de escritorio de cuatro columnas: formulario de orden, libro de órdenes, gráfico de precio y profundidad, lista de operaciones; barra superior y footer.
- Paneles deslizables: selector de mercado y ajustes.
- Interacciones a conservar: abrir/cerrar ambos paneles, seleccionar un activo, marcar favoritos, cambiar compra/venta y tipo de orden, seleccionar un precio desde el orderbook y reflejarlo en el formulario.
- Datos demo: mercados, libro de órdenes, trades y CSV OHLCV de BTC/USD.
- Hooks de regresión: filas de compra y venta y sus acumulados deben conservar `data-test` estables.
- Paleta existente: fondo `#262d38`, superficie `#131722`, contenido `rgb(204, 208, 220)`, texto tenue `rgb(117, 134, 150)`, compra `#76d1aa` y venta `#ad9be3`; tipografía Roboto Mono.
- Referencia visual comprobada localmente en `http://127.0.0.1:5173` a 1280 px: interfaz oscura, densa y rectangular. La captura con la CLI de Playwright no está disponible porque su binario de Chromium no está instalado; se realizará la comparación visual con el navegador de Hermes durante la validación.

## Arquitectura objetivo

```text
src/
  app/                 App, layout y estado React
  components/
    layout/            Grid y Topbar
    trading/           formulario, orderbook, paneles y trades
    charts/            gráficos Highcharts con refs y cleanup
  data/                datos demo JavaScript
  domain/              cálculos puros del orderbook
  services/            formato monetario y carga/parsing CSV
  styles/
    tokens.css         tokens semánticos del sistema de diseño
    globals.css        reset, tipografía y elementos HTML
    components.css     primitivas reutilizables y patrones UI
public/data/           CSV servido de forma estática
```

El estado compartido se implementará con un contexto React y `useReducer` pequeño: activo, moneda, visibilidad de paneles, precio seleccionado y pestaña operativa. Los datos estáticos no entrarán en estado mutable salvo las preferencias locales de la demo.

## Sistema de diseño

1. Traducir los valores SCSS existentes a variables CSS semánticas: superficies, texto, acciones, compra, venta, borde, foco, espaciado, tipografía, tamaño, transición y capas.
2. Centralizar en `tokens.css` los valores; los componentes no contendrán colores o medidas globales equivalentes duplicadas.
3. Centralizar patrones en `components.css`: botón, botón icono, campo, panel lateral, tab, tabla de mercado, superficie de panel, cabecera y filas del libro de órdenes.
4. Mantener el lenguaje actual: densidad alta, geometría rectangular, contraste suficiente, Roboto Mono, compra verde y venta lavanda.
5. Añadir estados de foco visibles y atributos/etiquetas accesibles sin alterar el aspecto normal.

## Fases

### 1. Línea base y plan

- Inventariar componentes, datos, estado e interacciones Vue.
- Registrar equivalencias de comportamiento y estilos.
- Capturar y comprobar la referencia visual local.

Criterio: este documento y un listado verificable de comportamientos a conservar.

### 2. Foundation React y diseño

- Reemplazar el plugin Vue por React y actualizar dependencias, scripts, lint y configuración de Vite.
- Crear entrada React y sistema de diseño CSS centralizado.
- Mantener la carga de fuente y el shell base.

Criterio: React arranca y un build de producción termina correctamente antes de migrar pantallas.

### 3. Shell, estado y paneles

- Migrar Grid, Topbar, PairSelector, Settings, Operative, Orderbook, Price, Change, Favorite y Trades.
- Extraer cálculos puros del orderbook y el formateo a módulos reutilizables.
- Preservar exactamente los hooks `data-test` usados por E2E y los flujos de la línea base.

Criterio: cada interacción observada se puede realizar en el navegador React y usa tokens/primitivas.

### 4. Gráficos y datos estáticos

- Migrar Chart y DepthChart con refs React.
- Crear, actualizar y destruir cada instancia Highcharts de forma explícita.
- Mover los CSV a `public/data` y encapsular parsing/carga en un servicio.

Criterio: gráfico de velas, volumen y profundidad se muestran sin solicitudes fallidas ni errores de consola.

### 5. Integración, limpieza y calidad

- Retirar archivos, paquetes y configuración Vue ya sustituidos.
- Actualizar pruebas Playwright para que prueben el comportamiento observable React.
- Ejecutar lint sin modificaciones automáticas, build, E2E, `git diff --check` y smoke visual/console.

Criterio: no quedan imports, dependencias de runtime ni archivos `.vue`; todos los gates pasan.

### 6. Revisión independiente

- Revisar cambios, centralización de tokens y evidencia de verificación desde un perfil diferente.
- Corregir hallazgos antes del cierre del trabajo raíz.

Criterio: veredicto `APPROVED` documentado en Kanban.

## Reversión y seguridad

- El trabajo se realiza únicamente en `migration/react` y no se publica.
- El trabajo Vue anterior permanece protegido en el stash `backup local antes de eliminar migration/vue-to-svelte para migracion a react` y en el reflog local.
- Si un slice React no supera build o smoke, se revierte ese slice antes de continuar; no se elimina una implementación Vue hasta contar con reemplazo verificado.
- Esta es una demo local: no se introducen credenciales ni conexiones a exchanges.

## Gates obligatorios

- `pnpm run lint` o script equivalente sin modo `--fix`.
- `pnpm run build`.
- `CI=1 pnpm run test:e2e` con servidor local gestionado por Playwright o comando equivalente reproducible.
- Smoke en navegador: carga de la raíz, apertura/cierre de paneles, selección de par, selección de precio de orderbook y ausencia de errores de consola.
- `git diff --check`.
- Revisión independiente registrada en Kanban.
