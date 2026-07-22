# Barber Queue — Joined Tail Q Runtime Derivative Plan R1

Status: **executed; technical QA PASS; human runtime PASS; git/deploy pending**

Final human result — 2026-07-22: `PASS_BARBER_QUEUE_JOINED_TAIL_RUNTIME_R1`. Exact implementation/QA authority is `audit/logo-joined-tail-runtime-r1/README.md`. This result does not authorize commit, push, deploy, production smoke, or any Pilot operation.

## Objective

Replace the current pastel barber-pole/ticket runtime icon family with the human-approved Joined Tail Q geometry while preserving every route, queue condition, interaction, layout, copy string, theme token, and Pilot boundary.

Approved geometry authority:

- `docs/assets/logo-q-joined-tail-svg-r1/joined-tail-q-r1.svg`
- SHA-256 `023ade5d84638328cd3a8e65c80cc01bd468e3351e8b3e1e0c070f4631659de4`
- Human gate `PASS_BARBER_QUEUE_JOINED_TAIL_Q_SVG_R1`

Every execution must verify this hash and the protected runtime hashes below before writing derivatives.

## Protected current runtime hashes

| File | Current SHA-256 | Current role |
| --- | --- | --- |
| `app/src/app/icon.png` | `292da2bce9990ace199550034d85f89612ef637158fb90a2701ab5f05caac4d7` | Next metadata icon and current UI source `/icon.png` |
| `app/src/app/apple-icon.png` | `b38a39ef51ad57947a04a1fe7f6d09df5f21f23ce564994262ed6478a6e9f2c8` | Apple touch icon |
| `app/src/app/favicon.ico` | `2118e960d646075a004a491f8e48970b68c785a23dee5933a89d71f2249e8b5d` | 16/32/48 browser icon |
| `app/public/icons/icon-192.png` | `a29ea18628abc315aea1e8f0ffa4763157f0d17564e60cd1b702c6204296da2b` | Current PWA any icon |
| `app/public/icons/icon-maskable-512.png` | `9eba7c834cb51b4b4c0eb7adbb10cdd72627eba9692cc50a0a40ae364e9032fd` | Current PWA maskable icon |

Fail closed if any protected hash differs when execution begins.

The historical generated source `app/public/assets/generated-v1/app-icon-pastel.png` remains untouched as provenance/history.

## Proposed derivative set

All raster derivatives use exact cocoa `#3A2D25` and warm cream `#FFF8EE`. The SVG geometry itself remains unchanged.

### Metadata and browser assets

- Replace `app/src/app/icon.png`: 512×512 RGBA; transparent canvas; 376px cocoa mark centered (68px nominal inset).
- Replace `app/src/app/apple-icon.png`: 180×180 RGB/opaque; full-bleed warm cream; 132px cocoa mark centered (24px inset), matching the approved preview.
- Replace `app/src/app/favicon.ico`: valid 16/32/48 32-bit frames; full-bleed warm cream with optically fitted cocoa mark. Opaque cream is required for reliable visibility on both light and dark browser chrome.

### Versioned UI and PWA assets

Add under `app/public/icons/`:

- `joined-tail-q-r1-ui-512.png`: 512×512 RGBA; byte-identical to `app/src/app/icon.png`; transparent UI source and cache-busting path.
- `joined-tail-q-r1-any-192.png`: 192×192 RGB/opaque; warm cream; 140px cocoa mark centered (26px inset).
- `joined-tail-q-r1-any-512.png`: 512×512 RGB/opaque; warm cream; 376px cocoa mark centered (68px inset).
- `joined-tail-q-r1-maskable-512.png`: 512×512 RGB/opaque; full-bleed warm cream; 312px cocoa mark centered; essential geometry stays within the central 80% safe circle.

After every reference moves to versioned files, delete the superseded runtime derivatives:

- `app/public/icons/icon-192.png`
- `app/public/icons/icon-maskable-512.png`

Do not delete historical generated source art.

## Scoped code/reference changes

Change image source only; do not alter component structure, business logic, copy, spacing, or CSS:

- `app/src/app/page.tsx`: `brandMarkPath` → `/icons/joined-tail-q-r1-ui-512.png`.
- `app/src/app/owner/login/page.tsx`: `imageSrc` → versioned UI path.
- `app/src/app/owner/_components/owner-navigation.tsx`: both mobile/desktop sources → versioned UI path.

The owner desktop Queue Workspace V2 already provides a light backing around the 44px mark; preserve it byte-for-byte. Customer, login, and owner-mobile surfaces are already light. No CSS change is planned.

Update `app/src/app/manifest.ts`:

- `192x192 any` → `/icons/joined-tail-q-r1-any-192.png`;
- `512x512 any` → `/icons/joined-tail-q-r1-any-512.png`;
- `512x512 maskable` → `/icons/joined-tail-q-r1-maskable-512.png`;
- all three shortcut entries → the versioned 192 any icon.

Update only the icon-path expectations/request checks in `app/tests/e2e/ui-rendering.spec.ts`.

Update `docs/assets/web-icons.md` so Joined Tail Q is the active geometry authority and the pastel family is historical.

## Deterministic export

Use installed `/opt/homebrew/bin/magick` without adding project dependencies.

1. Verify Magick version, approved SVG hash, and protected runtime hashes.
2. Render into two separate temporary directories.
3. Apply exact flat cocoa/warm-cream values; no provider raster enters the export.
4. Render standard/UI alpha and opaque Apple/PWA/maskable variants at the exact dimensions/insets above.
5. Render favicon frames separately at 16/32/48 and assemble one multi-image ICO.
6. Strip nondeterministic metadata where supported.
7. Compare both clean builds byte-for-byte before copying into runtime paths.
8. Record source, command, dimensions, mode, alpha, safe-zone, and final hashes.

Fail closed if clean rebuilds differ, geometry/hash drifts, any dimension/mode is wrong, transparent variants lose real alpha, opaque variants gain alpha, the slot closes, or the tail/mark clips.

## Mechanical QA

- SVG source remains byte-exact before/after execution.
- `icon.png` and `joined-tail-q-r1-ui-512.png`: 512×512 RGBA with real transparent outer/counter/slot pixels and identical bytes.
- Apple/any/maskable PNGs: RGB and fully opaque.
- ICO contains exact 16×16, 32×32, and 48×48 frames.
- No cream fringe on transparent variants over dark/checker surfaces.
- No clipped tail, detached alpha residue, filled counter, or closed junction slot.
- The 16px favicon reads as Q; low-quality raster review must explicitly inspect the one-pixel-scale slot.
- Maskable essential geometry stays inside central 80% safe circle.
- `git grep` finds no tracked current reference to deleted filenames or old `/icon.png` UI sources outside metadata behavior.

## Evidence package

Create `audit/logo-joined-tail-runtime-r1/`:

- `README.md`: source/output hashes, exact commands, protected-hash receipt, dimensions/modes/alpha, tests, and decision status.
- `icon-contact-sheet.png`: 16/32/48 favicon, 40/44 UI, 180 Apple, 192/512 any, 512 maskable, light/dark/checker, central-80% circle.
- `customer-home-390.png`
- `owner-login-390.png`
- `owner-mobile-390.png`
- `owner-desktop-1440.png`

The contact sheet and screenshots are human-review transports, not runtime assets.

## Application validation

Run from the real project scripts:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:integration`
- `pnpm build`
- focused Playwright metadata/PWA checks and customer/owner screenshot flows

Verify live responses/content types for:

- `/favicon.ico`
- `/apple-icon.png`
- `/icon.png`
- `/icons/joined-tail-q-r1-ui-512.png`
- `/icons/joined-tail-q-r1-any-192.png`
- `/icons/joined-tail-q-r1-any-512.png`
- `/icons/joined-tail-q-r1-maskable-512.png`
- `/manifest.webmanifest`

Browser-inspect customer home and owner login at 390px; owner mobile at 390px; owner desktop at 1440px. Confirm Q recognition, slot survival, no backing leak, no layout shift, no clipping, and no horizontal overflow.

Stop every dev/preview server after validation and verify the port/process is closed.

## Boundaries and gate

This plan changes only logo/icon derivatives, image paths, manifest icon paths, focused icon tests, web-icon docs, and audit evidence.

It does **not** authorize Pilot Measurement, Pilot Execution, invitations, Daily Close, queue behavior, copy changes, unrelated CSS/layout changes, commit, push, deploy, or production smoke.

Execution requires explicit approval of this plan. After execution and technical QA, stop at:

`HUMAN_REVIEW_BARBER_QUEUE_JOINED_TAIL_RUNTIME_R1`

Human runtime PASS remains separate from commit, push, and deployment approval.
