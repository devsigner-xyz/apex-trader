---
status: current
last_verified: 2026-09-05
owners: product-design-engineering
---

# Landing PageSpeed optimization - local verification

## Alcance y límite

La revisión usa Lighthouse 13.4.1, el motor de PageSpeed, contra la landing pública y contra el
build local. La API alojada de PageSpeed respondió `429`; las capturas de PageSpeed aportadas por el
usuario se usaron para contrastar los diagnósticos. Los dos archivos de vídeo y su reproducción
quedan expresamente fuera del cambio y no se modifican.

## Baseline pública

La medición móvil sobre `https://apex.devsigner.xyz/` en el commit publicado
`bee102576d079122bf91d06b51249ecb7c4d7faa` produjo:

| Métrica | Resultado |
| --- | ---: |
| Performance | 95 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 92 |
| FCP | 1,1 s |
| LCP | 2,9 s |
| TBT | 0 ms |
| CLS | 0 |

El LCP era el poster PNG de 1600 × 900 servido a 206.364 bytes. Lighthouse estimó 195.800 bytes
evitables en móvil y detectó que el recurso no era visible en el HTML inicial ni tenía prioridad
alta. `/robots.txt` devolvía el HTML de la SPA y generaba 43 errores de sintaxis. La hoja inicial
contenía todos los estilos profesionales: 50,78 kB sin comprimir y 9,72 kB gzip en el build.

## Cambios

- Se conservó `hero-terminal-candles.png` y se generaron derivados AVIF de 1600 × 900
  - 70.636 bytes - y 800 × 450 - 26.919 bytes.
- El HTML declara un preload responsive después del viewport meta, con `imagesrcset`, `imagesizes`
  y `fetchpriority="high"`; móvil descarga solo el derivado de 800 px.
- El hero elige el poster compacto bajo 768 px. El aviso de demo para móvil reutiliza el mismo
  derivado.
- `serve.json` entrega `.avif` como `image/avif` y mantiene un año de caché inmutable para media.
- El CSS profesional se movió a los chunks diferidos de demo y primitivas. La hoja inicial queda en
  20,14 kB sin comprimir y 4,78 kB gzip.
- La anticipación del showcase baja de 500 px a 240 px. El fallback conserva su tamaño, de modo que
  el cambio no introduce layout shift y los módulos siguen cargando antes de entrar en viewport.
- `public/robots.txt` responde con reglas válidas para permitir el rastreo.

La comparación del PNG fuente con los AVIF decodificados obtuvo SSIM 0,994963 para 1600 px y
0,981312 para 800 px respecto a la fuente reducida con Lanczos. La revisión visual mantuvo color,
encuadre, texto y geometría del workstation.

## Resultado local

| Perfil | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile - mediana de 3 | 99 | 100 | 100 | 100 | 1,2 s | 1,8 s | 0 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | 0,3 s | 0,6 s | 0 ms | 0 |

Las tres pasadas móviles dieron 99, 99 y 100 en Performance. La carga inicial medida pasa de 14 a
10 solicitudes y de 1.557.992 a 1.357.267 bytes. El vídeo MP4 sin cambios representa 1.259.773
bytes transferidos, por lo que explica casi todo el peso
residual. Lighthouse aún estima 21 KiB evitables en el poster móvil por comparar sus 800 px con
362 px CSS; se conserva la resolución cercana a 2x para no degradar pantallas de alta densidad. La
hoja inicial mantiene un diagnóstico no puntuado de 150 ms: diferirla por completo introduciría un
flash sin estilos o riesgo de CLS.

## Regresión

- `pnpm run check:docs`: correcto.
- `pnpm run lint`: correcto.
- `pnpm run test:unit`: 20/20.
- `pnpm run build`: correcto, incluida la biblioteca de componentes.
- `e2e/landing.spec.js`: 8/8 Chromium, 8/8 Firefox y 8/8 WebKit. WebKit necesitó bypass
  local del proxy para el host público de Umami; sin ese bypass, dos pruebas recibían un fallo de
  red externo y el comportamiento de Apex seguía completándose.
- Aviso móvil de `/demo`: 1/1 Chromium.
- Regresión visual: 10/10 Chromium después de sincronizar el baseline desktop obsoleto con el
  wordmark y la sección contextual de IA ya publicados. No se modificó la UI para satisfacer la
  captura.
- `git diff --check`: correcto.

## Estado

La mejora está verificada solo en local. No se ha hecho commit, push ni despliegue y las métricas de
producción continúan describiendo el baseline hasta una publicación autorizada.
