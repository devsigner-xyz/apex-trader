# AGENTS.md

Guía operativa para mantener Apex Trader alineado entre producto, código, Figma y documentación.

## Fuentes de verdad

1. El código y una verificación directa de la web describen el comportamiento ejecutable.
2. Figma describe el contrato visual, las variantes, los estados y la intención de interacción.
3. `docs/` explica las especificaciones, decisiones, limitaciones y trazabilidad que no deben depender de una captura o de memoria conversacional.
4. Las anotaciones nativas de Figma aportan contexto local al nodo, pero no sustituyen una especificación versionada.

Cuando estas capas discrepen, identifica la diferencia, decide qué capa está desactualizada y sincronízala. Una captura prueba apariencia, no variables, bindings, accesibilidad ni comportamiento.

## Documentación obligatoria

Lee [docs/README.md](docs/README.md) antes de cambiar comportamiento de producto o patrones visuales.

Actualiza en el mismo cambio:

- `docs/product/` cuando cambien datos, cálculos, filtros, persistencia, navegación o estados vacíos.
- `docs/design-system/` cuando cambien tokens, composición, headers, settings, tablas, overlays o accesibilidad.
- `docs/figma/` cuando cambien masters, variantes, node IDs, anotaciones o la relación Figma ↔ código.
- `docs/decisions/` cuando se tome una decisión duradera con alternativas o consecuencias relevantes.
- `docs/verification/` cuando una auditoría o release deba conservar evidencia fechada.

No reescribas un documento histórico como si fuera actual. Añade un aviso de snapshot o crea una verificación nueva. Ejecuta `pnpm run check:docs` después de cambios documentales.

## Figma

Archivo maestro: `Ze9eGnPaNDj8u0oB1iUt3C`.

- Preserva IDs, propiedades, variantes, bindings e instancias existentes siempre que sea posible.
- Modifica masters antes que instancias de producción.
- Reutiliza variables y componentes locales; no crees un segundo sistema de tokens.
- Documenta comportamiento repetible en la descripción del componente y con anotaciones `AT-<AREA>-NNN`.
- Valida estructura y captura del master; después valida las composiciones de `01 Production UI`.
- No uses una anotación como única fuente de una regla crítica: represéntala también en `docs/`.

## Contratos de producto

- Un único reloj histórico alimenta chart, DOM y Time & Sales.
- El volume profile visible, VAH, POC y VAL se calculan sobre las velas agregadas actualmente visibles.
- Las tablas inferiores no comparten un esquema genérico; Account & Risk no es una tabla.
- Los datos sintéticos deben identificarse de manera consistente.
- No sustituyas L2 histórico ausente por profundidad generada sin documentarlo expresamente.

## Calidad y publicación

Para cambios visuales o de producto ejecuta, como mínimo:

```bash
pnpm run check:docs
pnpm run lint
pnpm run test:unit
pnpm run build
```

Añade E2E según el riesgo. Antes de publicar, verifica Railway y la UI de producción; un build local no demuestra que el despliegue esté activo.

No hagas commit, push o despliegue salvo autorización explícita. Conserva cambios del usuario y evita operaciones destructivas.
