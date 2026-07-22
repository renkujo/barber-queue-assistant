# Web icon derivatives

The active runtime icon family derives from the human-approved Joined Tail Q geometry:

- source: `docs/assets/logo-q-joined-tail-svg-r1/joined-tail-q-r1.svg`
- SHA-256: `023ade5d84638328cd3a8e65c80cc01bd468e3351e8b3e1e0c070f4631659de4`
- human gate: `PASS_BARBER_QUEUE_JOINED_TAIL_Q_SVG_R1`

The previous pastel barber-pole/ticket runtime family is historical. Its original generated source remains preserved at `app/public/assets/generated-v1/app-icon-pastel.png`.

## Delivered files

| File | Role | Size | Notes |
| --- | --- | --- | --- |
| `app/src/app/favicon.ico` | Browser favicon | 16, 32, 48px | Opaque warm-cream frames keep the cocoa Q visible across browser themes. |
| `app/src/app/apple-icon.png` | Apple touch icon | 180px | Opaque warm cream with a centered 132px mark. |
| `app/src/app/icon.png` | Next metadata icon | 512px | Transparent 376px cocoa mark; metadata route remains `/icon.png`. |
| `app/public/icons/joined-tail-q-r1-ui-512.png` | Versioned UI mark | 512px | RGBA and byte-identical to `app/src/app/icon.png`; used by customer/owner surfaces to avoid stale optimized-image caches. |
| `app/public/icons/joined-tail-q-r1-any-192.png` | PWA any icon | 192px | Opaque warm cream with a centered 140px mark. |
| `app/public/icons/joined-tail-q-r1-any-512.png` | PWA any icon | 512px | Opaque warm cream with a centered 376px mark. |
| `app/public/icons/joined-tail-q-r1-maskable-512.png` | PWA maskable icon | 512px | Opaque warm cream with a centered 312px mark inside the central 80% safe circle. |

## QA rules

- Browser favicon must remain recognizable as a capital Q at 16px and 32px; the diagonal junction slot must not turn into an arrow barb.
- Transparent metadata/UI icons use real alpha with no cream fringe on dark or checker backgrounds.
- Favicon, Apple, PWA any, and maskable applications stay opaque for cross-theme/system-crop consistency.
- The maskable essential bowl, counter, tail, and slot stay inside the central 80% safe-zone circle.
- The manifest must expose separate `192x192 any`, `512x512 any`, and `512x512 maskable` entries.
- `tests/e2e/ui-rendering.spec.ts` verifies metadata links, manifest entries, response status, and image content types.
