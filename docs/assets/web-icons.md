# Web icon derivatives

The web icon set preserves `app/public/assets/generated-v1/app-icon-pastel.png` as the visual source and does not redesign the Barber Queue mark.

## Delivered files

| File | Role | Size | Notes |
| --- | --- | --- | --- |
| `app/src/app/favicon.ico` | Browser favicon | 16, 32, 48px | Transparent tighter crop keeps the barber pole and ticket readable in a tab. |
| `app/src/app/apple-icon.png` | Apple touch icon | 180px | Opaque icon required for the iOS home screen. |
| `app/public/icons/icon-192.png` | PWA standard icon | 192px | Transparent standard install icon referenced by the manifest. |
| `app/src/app/icon.png` | PWA standard icon | 512px | Transparent derivative; the original generated RGB source remains preserved under `app/public/assets/generated-v1/`. |
| `app/public/icons/icon-maskable-512.png` | PWA maskable icon | 512px | Full-bleed warm background with the mark inside the central safe zone. |

## QA rules

- Browser favicon must remain recognizable at 16px and 32px.
- Browser and standard PWA icons use real alpha with no white outer box, detached frame line, or light fringe visible on dark backgrounds.
- Apple and maskable icons remain opaque because operating systems crop those formats into their own home-screen shapes.
- The maskable icon must not reuse the rounded standard icon unchanged. Its essential pole, ticket, badge, and foliage stay inside the central 80% safe-zone circle.
- The manifest must expose separate `192x192 any`, `512x512 any`, and `512x512 maskable` entries.
- `tests/e2e/ui-rendering.spec.ts` verifies metadata links, manifest entries, response status, and image content types.
