---
title: Interactive portfolio landing - Figma approval gate
status: current
last_verified: 2026-08-30
owners: product-design-engineering
---

# Interactive portfolio landing - Figma approval gate

Esta verificación documenta la propuesta visual previa a React definida en
`docs/plans/interactive-portfolio-landing.md`. Demuestra que los artefactos existen y fueron
inspeccionados en Figma; no demuestra aprobación del usuario, implementación web, commit,
publicación ni estado de producción.

Al cerrar esta puerta, el checkout está en `c3a1fe97621fa530987c2da6123b966f25f9b837`
(`refactor: modularize historical replay engine`). Este avance respecto al `HEAD` registrado en el
baseline ocurrió fuera de la iniciativa de landing y se conservó sin modificar; la fase React deberá
reinspeccionar el estado vigente cuando sea autorizada.

## Artefactos para revisión

Archivo maestro: `Ze9eGnPaNDj8u0oB1iUt3C`, página `560:7369`
(`02 · Landing · Exploration`).

| Artefacto | Node ID | Dimensiones | Captura local ignorada por Git |
| --- | --- | --- | --- |
| Sección | `656:7412` | 3680 × 7120 | - |
| Desktop | `656:7413` | 1440 × 6920 | `output/figma/interactive-portfolio-landing-desktop.png` |
| Mobile | `656:7414` | 390 × 6920 | `output/figma/interactive-portfolio-landing-mobile.png` |
| Motion storyboard | `656:7415` | 1440 × 3760 | `output/figma/interactive-portfolio-landing-motion-storyboard.png` |

La propuesta conserva copy público en inglés y encuadra Apex como una demo funcional de una UI de
trading avanzada para portfolio. `Product demo`, `historical market data` y `simulated execution`
son visibles; no se presenta como broker, plataforma comercial ni workstation de replay.

## Narrativa y composición

Desktop y mobile comparten ocho bloques: Header, Hero con MarketChart, tres perspectivas del mismo
mercado, Depth of Market, DOM → Time & Sales, interacciones avanzadas, Portfolio / Build y product
reveal con CTA. Mobile recompone las superficies a 390 px mediante estados discretos; no escala una
terminal de 1920 px ni depende de overflow horizontal.

El storyboard define tres secuencias observables:

1. Un MarketChart permanece montado mientras cambia Candles → Footprint → Step Profile en thresholds
   semánticos de scroll; los tabs manuales siguen operables.
2. Un DOM seleccionable avanza por `liquidity appears`, `best prices shift` y `level trades` con un
   fixture determinista.
3. Una ejecución `BUY 7 @ 21,842.25` actualiza el nivel del book y aparece en Time & Sales con el
   mismo timestamp, lado, precio y tamaño.

El contrato de implementación representado en el storyboard exige activación próxima al viewport,
lecturas de scroll agrupadas en `requestAnimationFrame`, prioridad del estado elegido por el usuario,
alternativa estática completa con `prefers-reduced-motion`, pasos discretos a 390 px y pausa fuera de
viewport.

## Reutilización de componentes y sistema visual

La auditoría estructural encontró 14 instancias reales en desktop, 14 en mobile y 8 en el storyboard.
Proceden únicamente de los masters locales ya existentes:

- botón primario `568:7369` y secundario `569:7377`;
- Candles `132:3266`, Footprint `132:867` y Step Profile `167:2377`;
- OrderBook/DOM `103:59`;
- Time & Sales `144:1810`.

Los componentes de producto no son capturas raster. La exploración reutiliza variables, colores y
estilos locales; las 216 capas de texto auditadas usan exclusivamente Inter o Roboto Mono. Code
Connect sigue sin poder consultarse porque requiere un seat Dev o Full de
Organization/Enterprise; esto no impide verificar las instancias y sus masters dentro del archivo.

## Verificación visual y estructural

- Los ocho bloques desktop cubren exactamente `y=0…6920`, sin gaps, overlaps ni hijos directos fuera
  de bounds.
- Los ocho bloques mobile cubren exactamente `y=0…6920` con la misma condición.
- Los cinco bloques del storyboard cubren exactamente `y=0…3760`.
- No se detectaron textos con ancho o alto colapsado ni alturas anómalas.
- Las capturas completas y las secciones individuales se revisaron después de corregir el reflow del
  hero mobile, la escala proporcional de su chart y el ancho de los headings de cierre/contrato.
- Direction B permanece separada y conserva sus IDs, nombres y dimensiones: desktop `609:7459`
  (1440 × 6418), tablet `621:7473` (1024 × 6182) y mobile `621:7636` (390 × 8330).

## Puerta de aprobación

React no se modificó durante esta fase. La fase 2 solo puede comenzar después de una aprobación
explícita del usuario sobre desktop `656:7413`, mobile `656:7414` y storyboard `656:7415`. Cualquier
ajuste solicitado debe realizarse primero sobre esta exploración sin sobrescribir Direction B.
