---
status: accepted
last_verified: 2026-08-29
owners: product-design-engineering
---

# 0009 — Retirada de la arquitectura de terminal legacy

## Contexto

La aplicación pública carga la landing y la terminal profesional. El repositorio conservaba además
una terminal React anterior, sus servicios de datos sintéticos y replay v1, estilos globales,
datasets monolíticos y dependencias de gráficos que ya no eran alcanzables desde `src/main.jsx`.
Mantener ambos árboles ampliaba el bundle potencial, el volumen de assets publicados y la superficie
de mantenimiento sin representar una ruta soportada.

## Decisión

Retirar la arquitectura anterior solo cuando el grafo de imports, los scripts del paquete y las
referencias de tests demuestren que no participa en las entradas activas. La limpieza incluye sus
módulos, tests exclusivos, CSS, assets OHCLVT, replay Tardis v1, ingestor v1 y dependencias que
queden sin consumidor después de eliminar el código.

La terminal profesional conserva su arquitectura, su estado y su reloj histórico compartido. El
runtime continúa leyendo `public/data/tardis/manifest-v3.json` y el dataset versionado apuntado por
ese manifest. `src/services/chartTransforms.js` conserva `createFixedChartSlots`, utilizado por la
geometría profesional. Los aliases públicos de rutas también se mantienen porque siguen siendo un
contrato de compatibilidad documentado.

## Consecuencias

- La landing y la terminal profesional quedan como únicas superficies ejecutables.
- No se publican los CSV OHCLVT ni el JSON monolítico Tardis v1.
- La ingesta soportada usa `tardis-ingest-v2.mjs` y, para el heatmap, el paso separado de tiles de
  liquidez.
- El CSS de la terminal anterior deja de formar parte del producto; cualquier declaración todavía
  efectiva en la UI profesional se conserva explícitamente hasta poder integrarla en su hoja
  canónica sin alterar la cascada.
- Cada dependencia se retira únicamente después de que desaparezca su último consumidor.
- La decisión no autoriza cambios de diseño, refactors del chart profesional ni sustitución del
  dataset activo.

## Alternativas descartadas

- Mantener el árbol antiguo como referencia: Git y los snapshots documentales ya conservan esa
  historia sin incluirla en el runtime.
- Borrar por nombres o antigüedad: no prueba alcanzabilidad y arriesga módulos compartidos.
- Reescribir la terminal profesional durante la limpieza: ampliaría el alcance y haría imposible
  atribuir una regresión a la retirada legacy.
