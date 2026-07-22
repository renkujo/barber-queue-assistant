# Barber Queue — Joined Tail Q Runtime R1 Audit

Status: **technical QA PASS; human runtime PASS**

Human decision — 2026-07-22: Kiattisak selected `PASS runtime R1`. This approves the exact Joined Tail runtime asset/path state recorded here. Commit, push, deploy, production smoke, and all Pilot operations remain separately gated.

Gate result: `PASS_BARBER_QUEUE_JOINED_TAIL_RUNTIME_R1`

No commit, push, deploy, production smoke, Pilot Measurement, Pilot Execution, invitation, or Daily Close work is authorized by this receipt.

## Authorization and source

Kiattisak approved `docs/logo-joined-tail-runtime-plan-r1.md` for execution after approving the canonical SVG geometry.

- source: `docs/assets/logo-q-joined-tail-svg-r1/joined-tail-q-r1.svg`
- source SHA-256: `023ade5d84638328cd3a8e65c80cc01bd468e3351e8b3e1e0c070f4631659de4`
- geometry gate: `PASS_BARBER_QUEUE_JOINED_TAIL_Q_SVG_R1`
- palette: cocoa `#3A2D25`, warm cream `#FFF8EE`

The source hash was verified before and after derivative work.

## Protected pre-execution receipt

All five old runtime authorities matched the approved plan before replacement:

| File | Protected SHA-256 | Result |
| --- | --- | --- |
| `app/src/app/icon.png` | `292da2bce9990ace199550034d85f89612ef637158fb90a2701ab5f05caac4d7` | match |
| `app/src/app/apple-icon.png` | `b38a39ef51ad57947a04a1fe7f6d09df5f21f23ce564994262ed6478a6e9f2c8` | match |
| `app/src/app/favicon.ico` | `2118e960d646075a004a491f8e48970b68c785a23dee5933a89d71f2249e8b5d` | match |
| `app/public/icons/icon-192.png` | `a29ea18628abc315aea1e8f0ffa4763157f0d17564e60cd1b702c6204296da2b` | match |
| `app/public/icons/icon-maskable-512.png` | `9eba7c834cb51b4b4c0eb7adbb10cdd72627eba9692cc50a0a40ae364e9032fd` | match |

The two superseded public derivatives were deleted only after all tracked runtime/manifest/test references moved. Historical source `app/public/assets/generated-v1/app-icon-pastel.png` was not changed.

## Deterministic build

- Tool: ImageMagick `7.1.2-27 Q16-HDRI` at `/opt/homebrew/bin/magick`.
- A temporary rendering copy replaced only the token `currentColor` with exact `#3A2D25`; canonical SVG bytes were not changed.
- Vector input was rendered at density 384, resized to target mark dimensions, centered in exact canvases, stripped, forced to depth 8, and written with PNG ancillary chunks excluded.
- Opaque applications were flattened onto exact `#FFF8EE` and written as 8-bit RGB.
- Favicon frames were rendered separately at 16/32/48 and assembled into one three-frame ICO.
- Two clean temporary builds produced byte-identical results for every delivered derivative: `DETERMINISTIC_REBUILD=PASS`.

Mark/canvas sizes:

- UI/metadata 512: 376px mark, 68px nominal inset, transparent;
- Apple 180: 132px mark, 24px inset, opaque;
- PWA any 192: 140px mark, 26px inset, opaque;
- PWA any 512: 376px mark, 68px inset, opaque;
- maskable 512: 312px mark, central-80% safe, opaque;
- favicon 16/32/48: 14/28/42px mark, opaque warm cream.

## Delivered runtime assets

| File | Dimensions/mode | SHA-256 |
| --- | --- | --- |
| `app/src/app/icon.png` | 512×512 RGBA | `e5451cb0f088869f9a6636d6a79159517458440d62b465ed49804fb5b417c3e6` |
| `app/public/icons/joined-tail-q-r1-ui-512.png` | 512×512 RGBA; byte-identical to metadata icon | `e5451cb0f088869f9a6636d6a79159517458440d62b465ed49804fb5b417c3e6` |
| `app/src/app/apple-icon.png` | 180×180 RGB | `c8e67f1a3a7c307d86f827a02dd5af46ad6b794b45b95891197edb6738408935` |
| `app/src/app/favicon.ico` | 16/32/48 ICO frames | `77b467b6049f46d60ba3378d6ccc7b6d58b36bf100afb98682ba6abaff68c310` |
| `app/public/icons/joined-tail-q-r1-any-192.png` | 192×192 RGB | `a4ca6d9aef3577af122065341e2e25e1331c9dbef7af8faf792af4d3ef03e620` |
| `app/public/icons/joined-tail-q-r1-any-512.png` | 512×512 RGB | `6cdc78695daf5755bdd45e75d95edf9c845e5a4eba7838616f3f7bd75717fb9b` |
| `app/public/icons/joined-tail-q-r1-maskable-512.png` | 512×512 RGB | `85162f8a96810964e50e5eef9b2f8ae8bb308c1ec88dcd5346cab943da9dfb3d` |

Mechanical checks:

- transparent UI/metadata icons contain real outer/counter/slot alpha and exact cocoa bowl/tail pixels;
- opaque assets have no alpha and exact cream/cocoa pixels;
- ICO contains exact 16×16, 32×32, and 48×48 frames;
- no clipped tail, detached residue, filled counter, cream fringe, or rectangular backing on transparent UI source;
- maskable essential geometry remains within the central 80% safe circle.

## Scoped runtime changes

- Customer home, owner login, owner mobile, and owner desktop image sources now use `/icons/joined-tail-q-r1-ui-512.png` to invalidate old Next Image derivatives.
- Manifest any/maskable and shortcut paths use the versioned Joined Tail files.
- Focused e2e path and response expectations were updated.
- `docs/assets/web-icons.md` now records Joined Tail Q as active authority.
- Existing owner desktop light backing, all CSS, layout, copy, routes, and queue/business conditions remained unchanged.

`git grep` finds no remaining tracked current reference to the deleted old public icon filenames or old `/icon.png` UI sources. `/icon.png` remains intentionally available as the Next metadata route.

## Validation

- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS, no issues.
- `pnpm test:integration`: PASS — 14 files / 81 tests.
- `pnpm build`: PASS — Next.js 16.2.9 production build.
- `pnpm exec playwright test tests/e2e/ui-rendering.spec.ts`: first run 2/3 because one customer-image assertion still expected the old UI path; assertion was updated to the authorized versioned source; rerun PASS 3/3.
- The rerun command's shell wrapper returned 1 after tests because `status` is a zsh read-only variable; this was a wrapper-only error after Playwright reported `PASS (3) FAIL (0)`. A separate check confirmed port 3000 clean.
- Production response/content checks: PASS for favicon, Apple, metadata icon, four versioned assets, and manifest.
- Manifest returns exact Joined Tail 192 any / 512 any / 512 maskable entries.
- Production QA server was stopped; port 3000 and process tree were verified clean.

## Live response evidence

| Path | HTTP/content type | Bytes |
| --- | --- | --- |
| `/favicon.ico` | 200 `image/x-icon` | 15086 |
| `/apple-icon.png` | 200 `image/png` | 1109 |
| `/icon.png` | 200 `image/png` | 11720 |
| `/icons/joined-tail-q-r1-ui-512.png` | 200 `image/png` | 11720 |
| `/icons/joined-tail-q-r1-any-192.png` | 200 `image/png` | 1200 |
| `/icons/joined-tail-q-r1-any-512.png` | 200 `image/png` | 3497 |
| `/icons/joined-tail-q-r1-maskable-512.png` | 200 `image/png` | 3226 |
| `/manifest.webmanifest` | 200 `application/manifest+json` | 1408 |

## Human-review transports

| File | Dimensions | SHA-256 |
| --- | --- | --- |
| `icon-contact-sheet.png` | 1600×1802 | `6f94aec485c99b83b809b2c1f8c40a1baa6cecea153d9986b76558442df5ed32` |
| `customer-home-390.png` | 390×1671 | `a721ea16b8defc5f407cbc5b022f733b42203fd2a972545f3554395d7b55e887` |
| `owner-login-390.png` | 390×844 | `87b8e152924810e2e67e417ecdeba659d99659808931fbd4fa0c03e2252ff383` |
| `owner-mobile-390.png` | 390×3468 | `040559cb4fc0b30057a100d03a1a0aca57ab86c3323a39ec2834c6794689a1d5` |
| `owner-desktop-1440.png` | 1440×1967 | `7a42118811bdd53ae7ba28363c0aa572fe37482e46d79e84c8213c69485176da` |

Browser runtime evidence:

- customer: rendered box 58×58, optimized image 64×64, no horizontal overflow;
- owner login: 54×54, optimized image 64×64, no horizontal overflow;
- owner mobile: 40×40, optimized image 48×48, no horizontal overflow;
- owner desktop: 36×36 inside the existing 44px/light-backed owner mark container, optimized image 48×48, no horizontal overflow;
- every `currentSrc` contains the versioned `joined-tail-q-r1-ui-512.png` path.

Visual inspection found the approved Joined Tail Q recognizable across all four product surfaces, the owner dark-sidebar backing intact, no square-backing leak on transparent UI surfaces, no clipping, and no layout shift attributable to the path replacement.

## Human gate

Open and compare:

1. `audit/logo-joined-tail-runtime-r1/icon-contact-sheet.png`
2. `audit/logo-joined-tail-runtime-r1/customer-home-390.png`
3. `audit/logo-joined-tail-runtime-r1/owner-login-390.png`
4. `audit/logo-joined-tail-runtime-r1/owner-mobile-390.png`
5. `audit/logo-joined-tail-runtime-r1/owner-desktop-1440.png`

Judge Q recognition, tail weight, 16px junction slot, browser-theme backing, mobile scale, and desktop sidebar balance.

Gate result: `PASS_BARBER_QUEUE_JOINED_TAIL_RUNTIME_R1`.

Human PASS approves the runtime asset state only. Commit, push, deploy, and production smoke remain separate explicit approvals.
