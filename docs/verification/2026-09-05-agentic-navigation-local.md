---
status: current
last_verified: 2026-09-05
owners: product-design-engineering
---

# Agentic navigation - production verification

## Baseline pública

`https://apex.devsigner.xyz/llms.txt` devolvía `index.html` por el fallback de la SPA, con HTTP 200 y
`Content-Type: text/html`. Lighthouse 13.4.1 daba 0,67 en Agentic Browsing y fallaba `llms-txt` por
ausencia de H1 y enlaces Markdown.

## Implementación

- `public/llms.txt` sigue el orden H1, resumen en blockquote, contexto breve y secciones H2 con listas
  de enlaces descriptivos.
- `public/index.md` ofrece una versión Markdown concisa de la landing, las vistas de mercado, el
  comportamiento de la demo, las rutas y sus límites.
- `index.html` enlaza `/llms.txt` con `rel="describedby"` y `/index.md` como alternativa
  `text/markdown`.
- `serve.json` declara tipos de contenido explícitos y una caché revalidable de una hora para ambos
  recursos.
- `tests/llmsTxt.test.js` replica las comprobaciones de contenido de Lighthouse y valida el orden y
  el descubrimiento recomendados.

## Referencia

La implementación sigue la propuesta llms.txt v2 publicada en agosto de 2026: un H1 inicial, un
resumen en blockquote y secciones H2 cuyos elementos son enlaces Markdown con descripciones breves.
La propuesta recomienda `rel="describedby"` para descubrir el índice y `rel="alternate"` con
`type="text/markdown"` para descubrir una versión Markdown de la página.

## Estado

Lighthouse 13.4.1 contra el build servido localmente dio 100 en Agentic Browsing. La auditoría
`llms-txt` obtuvo 1 y mostró `llms.txt follows recommendations`, sin detalles de error.

También pasaron `pnpm run check:docs`, `pnpm run lint`, los 21 tests unitarios, `pnpm run build` y
`git diff --check`.

El commit funcional `6ace8232b9b305790997fb5c77b89f2befa5f56a` llegó al deployment Railway
`85b0d887-0983-4778-b4a2-f4b583386a01` con estado `SUCCESS`. En producción, `/llms.txt` responde
HTTP 200 como `text/plain; charset=utf-8`, `/index.md` responde HTTP 200 como
`text/markdown; charset=utf-8` y la landing publica ambas relaciones de descubrimiento.

La repetición de Lighthouse 13.4.1 contra `https://apex.devsigner.xyz/` dio 100 en Agentic Browsing.
La auditoría `llms-txt` obtuvo 1 y mostró `llms.txt follows recommendations`, sin detalles de error.
La corrección está publicada y verificada en producción.
