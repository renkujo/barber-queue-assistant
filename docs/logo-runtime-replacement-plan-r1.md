# Barber Queue — Q Path Runtime Replacement Plan R1

Status: **historical/superseded — executed as a candidate, QA passed, then rolled back before runtime PASS**

## Objective

Replace the current pastel barber-pole/ticket runtime icon family with human-approved Q Path R2 while preserving every route, interaction, queue condition, and layout contract.

Approved source authority:

- canonical: `docs/assets/logo-redesign-r2/q-path-r2.svg` — SHA-256 `e357ad2e9953f5fd1108d379a993fa7fe5f0f57e175a271f38e7b250f8eb3353`
- color: `docs/assets/logo-redesign-r2/q-path-r2-color.svg` — SHA-256 `9bd0bdcc24e5afe738f6fd4691193aee939b38a9e50d415bb180029058df23f1`
- opaque app application: `docs/assets/logo-redesign-r2/q-path-r2-app-icon.svg` — SHA-256 `4e39ccca67f45a37dd2bd5af6430861eb4aa7e7c9450bd2a163d662a7ac1b798`
- maskable application: `docs/assets/logo-redesign-r2/q-path-r2-maskable.svg` — SHA-256 `d83ad18e861f3f6a09d5515e3705ba6c63465ebfe49eaacd0e85d351c710b008`

Every execution must verify these hashes before producing derivatives.

## Current protected runtime authorities

Record and verify before replacement:

| file | current SHA-256 | role |
| --- | --- | --- |
| `app/src/app/icon.png` | `292da2bce9990ace199550034d85f89612ef637158fb90a2701ab5f05caac4d7` | Next 512px metadata icon and `/icon.png` used by app headers |
| `app/src/app/apple-icon.png` | `b38a39ef51ad57947a04a1fe7f6d09df5f21f23ce564994262ed6478a6e9f2c8` | Apple touch icon |
| `app/src/app/favicon.ico` | `2118e960d646075a004a491f8e48970b68c785a23dee5933a89d71f2249e8b5d` | 16/32/48 browser icon |
| `app/public/icons/icon-192.png` | `a29ea18628abc315aea1e8f0ffa4763157f0d17564e60cd1b702c6204296da2b` | PWA any icon |
| `app/public/icons/icon-maskable-512.png` | `9eba7c834cb51b4b4c0eb7adbb10cdd72627eba9692cc50a0a40ae364e9032fd` | PWA maskable icon |

The historical generated source `app/public/assets/generated-v1/app-icon-pastel.png` stays untouched as provenance/history. Git history preserves replaced derivatives; do not duplicate them into another archive folder.

## Scoped runtime changes

### Replace in place

- `app/src/app/icon.png` — 512×512 RGBA, transparent background, Q Path R2 color geometry.
- `app/src/app/apple-icon.png` — 180×180 RGB, opaque warm-cream application derived from `q-path-r2-app-icon.svg`.
- `app/src/app/favicon.ico` — 16/32/48px two-color frames on full-bleed warm cream. Initial transparent monochrome execution disappeared against dark cocoa browser chrome; the opaque approved app-icon application fixes cross-theme visibility.

Initial execution attempted to keep `/icon.png` as the stable component path. Browser QA proved Next Image retained the old 40px optimized derivative on the owner mobile header. Runtime execution therefore requires the cache-busting amendment below; no layout or business behavior changes.

### Version PWA paths to avoid stale installed-icon caches

- Add `app/public/icons/q-path-r2-192.png` — 192×192 RGBA, transparent two-color mark.
- Add `app/public/icons/q-path-r2-512.png` — 512×512 RGBA, byte-identical to `app/src/app/icon.png`; use it for UI components and the manifest to invalidate old optimized-image/PWA caches.
- Add `app/public/icons/q-path-r2-maskable-512.png` — 512×512 RGB, opaque full-bleed warm cream, central-80% safe.
- Update customer home, owner login, owner mobile navigation, and owner desktop navigation image sources to `/icons/q-path-r2-512.png`.
- Update `app/src/app/manifest.ts` and all shortcut icon entries to the versioned filenames.
- Update `app/tests/e2e/ui-rendering.spec.ts` expected manifest paths and request checks.
- Delete the superseded `app/public/icons/icon-192.png` and `app/public/icons/icon-maskable-512.png` only after no tracked reference remains.

### Documentation and evidence

- Update `docs/assets/web-icons.md` so Q Path R2 is the active source authority and the pastel icon is historical only.
- Create `audit/logo-runtime-r1/README.md` with source/output hashes, exact export commands, dimensions, alpha/opacity checks, browser QA, and human decision.
- Create `audit/logo-runtime-r1/icon-contact-sheet.png` showing favicon 16/32/48, header 40/44/54/58, Apple 180, PWA 192, 512 standard, maskable safe zone, and light/dark/checker surfaces.

Do not change metadata titles, manifest name/short name, theme/background colors, route copy, CSS tokens, component ownership, layout, or any queue behavior in this pass.

## Deterministic export method

Use the installed `/opt/homebrew/bin/magick` without adding package dependencies.

1. Verify Magick version and all four source hashes.
2. Render into an isolated temporary directory first.
3. Use transparent R2 color/canonical SVGs for standard PNG/ICO derivatives.
4. Use the opaque app/maskable SVG applications for Apple and maskable derivatives.
5. Build favicon frames at exact 16/32/48 sizes, then assemble one multi-image ICO.
6. Strip nondeterministic metadata where supported and record final hashes.
7. Compare a second clean rebuild byte-for-byte before copying into runtime paths.

Fail closed if the two rebuilds differ, source hashes drift, a required dimension/mode is wrong, standard icons lose real alpha, opaque icons gain alpha, or any icon clips its stroke.

## Mechanical QA

- `app/src/app/icon.png`: PNG, 512×512, RGBA with real transparent pixels.
- `q-path-r2-192.png`: PNG, 192×192, RGBA with real transparent pixels.
- `apple-icon.png`: PNG, 180×180, RGB/opaque.
- `q-path-r2-maskable-512.png`: PNG, 512×512, RGB/opaque.
- `favicon.ico`: valid ICO containing 16×16, 32×32, and 48×48 32-bit frames.
- Standard mark has no white/cream rectangular residue on dark or checker surfaces.
- No clipped exterior stroke, disconnected alpha residue, or resampling blur that changes the 16px cut.
- Maskable essential geometry remains inside the central 80% safe circle.
- `git grep` finds no remaining tracked reference to the two deleted public icon filenames.

## Application QA

Run against a production build:

- TypeScript, ESLint, existing integration suite, production build.
- `app/tests/e2e/ui-rendering.spec.ts` and the project PWA/metadata checks.
- Confirm `/favicon.ico`, `/apple-icon.png`, `/icon.png`, both versioned PWA icons, and `/manifest.webmanifest` return the expected content types and paths.
- Browser-inspect customer home and owner login at 360/390px.
- Browser-inspect owner mobile header at 390px and desktop dark sidebar at 1024/1440px.
- Confirm no horizontal overflow, image clipping, square backing leak, or unintended layout shift.
- Inspect browser-tab favicon, install-icon previews, and the contact sheet on light/dark/checker backgrounds.

Technical QA does not replace Kiattisak's visual judgment.

## Human gate and rollout boundary

After execution, stop at `HUMAN_REVIEW_Q_PATH_R2_RUNTIME_ASSETS_R1` with exact files:

- `audit/logo-runtime-r1/icon-contact-sheet.png`
- customer/owner browser screenshots named in the audit README
- `docs/assets/logo-redesign-r2/refinement.png` for source comparison

Human PASS approves the runtime assets only. Commit, push, Dokploy auto-deploy, and production visual smoke remain separately authorized steps.
