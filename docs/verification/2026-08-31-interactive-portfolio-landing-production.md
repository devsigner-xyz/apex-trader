---
status: current
last_verified: 2026-08-31
owners: product-design-engineering
---

# Interactive portfolio landing · production verification

## Release verificado

| Campo          | Valor                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Proyecto       | `apex-trader` · `13bffae0-3a6e-4d62-ae53-2b54d433ced9`                    |
| Entorno        | `production` · `3f049efd-d83e-485d-b2b0-12236272cf74`                     |
| Servicio       | `apex-trader` · `c8ac903b-a7e3-46c0-85f5-6d5d40b934a7`                    |
| Commit         | `23879f6e6c669b4dae471d46add8c4eadaa05300`                                |
| Deployment     | `f701cd73-23d4-4b91-aaff-c97340401928`                                    |
| Estado Railway | `SUCCESS`                                                                 |
| Image digest   | `sha256:7373d4bb8ad3898a1f32f2ea25d8aa6a5234d021554733b93fea995006f4c0a2` |
| Dominio        | `https://apex.devsigner.xyz`                                              |

Railway recibió el commit desde `origin/master`, ejecutó `pnpm run build` con Railpack y publicó el
servicio mediante `pnpm run start`.

## Comprobación HTTP y assets

Comprobación directa posterior a `SUCCESS`:

| Ruta                 | HTTP | Tipo        |
| -------------------- | ---: | ----------- |
| `/`                  |  200 | `text/html` |
| `/demo`              |  200 | `text/html` |
| `/demo/footprint`    |  200 | `text/html` |
| `/demo/step-profile` |  200 | `text/html` |
| `/storybook/`        |  200 | `text/html` |

El HTML público referencia `assets/index-06d0549f.js` y `assets/index-af8cf21b.css`. El bundle
inicial referencia los chunks esperados `MarketPrimitivesShowcase-a0241a41.js`,
`TimeSales-2f93afed.js` y `DemoPage-09601bc5.js`.

## Comprobación de navegador

Chromium ejecutó dos verificaciones contra el dominio público:

- Desktop 1440 × 1000: seis módulos, cero `.market-chart`, DOM 3 asks + last + 3 bids, tres Last
  Trades, reduced motion estático, cero errores/warnings de consola y cero requests
  `/data/tardis/**` desde `/`.
- Mobile 390 × 844: cero overflow horizontal, reduced motion estático y carga correcta de
  `/demo/footprint` y `/demo/step-profile` con sus charts accesibles.

Resultado: 2/2. Captura local ignorada por Git:
`output/playwright/interactive-landing-production-desktop.png`.

## Contrato publicado

La producción implementa Figma R2 `688:21215`. R1 permanece como snapshot; Direction B y los masters
profesionales no se sustituyeron. Las únicas imágenes completas de UI en la landing son Opening
thesis y The workspace. Los seis conceptos de mercado se muestran mediante escenas React aisladas.
