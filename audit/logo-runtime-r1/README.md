# Q Path R2 runtime replacement audit R1

Status: **SUPERSEDED_AND_ROLLED_BACK_BEFORE_RUNTIME_PASS**

This audit preserves a technically complete Q Path R2 runtime candidate and its browser evidence. Kiattisak chose to stop this candidate and reopen logo exploration through real Image Gen before giving runtime PASS. Every tracked runtime/code/test/documentation file was restored byte-for-byte to `HEAD`, the versioned Q Path runtime files were removed, and the old pastel runtime hashes match their protected values. Q Path assets in this audit are historical evidence only.

Date: 2026-07-22 (Asia/Bangkok)

## Authority checks

The four approved source authorities matched `docs/logo-runtime-replacement-plan-r1.md` before every clean rebuild:

| source | SHA-256 | result |
| --- | --- | --- |
| `docs/assets/logo-redesign-r2/q-path-r2.svg` | `e357ad2e9953f5fd1108d379a993fa7fe5f0f57e175a271f38e7b250f8eb3353` | PASS |
| `docs/assets/logo-redesign-r2/q-path-r2-color.svg` | `9bd0bdcc24e5afe738f6fd4691193aee939b38a9e50d415bb180029058df23f1` | PASS |
| `docs/assets/logo-redesign-r2/q-path-r2-app-icon.svg` | `4e39ccca67f45a37dd2bd5af6430861eb4aa7e7c9450bd2a163d662a7ac1b798` | PASS |
| `docs/assets/logo-redesign-r2/q-path-r2-maskable.svg` | `d83ad18e861f3f6a09d5515e3705ba6c63465ebfe49eaacd0e85d351c710b008` | PASS |

The five protected old-runtime hashes also matched before replacement:

| old runtime file | protected SHA-256 | result |
| --- | --- | --- |
| `app/src/app/icon.png` | `292da2bce9990ace199550034d85f89612ef637158fb90a2701ab5f05caac4d7` | PASS |
| `app/src/app/apple-icon.png` | `b38a39ef51ad57947a04a1fe7f6d09df5f21f23ce564994262ed6478a6e9f2c8` | PASS |
| `app/src/app/favicon.ico` | `2118e960d646075a004a491f8e48970b68c785a23dee5933a89d71f2249e8b5d` | PASS |
| `app/public/icons/icon-192.png` | `a29ea18628abc315aea1e8f0ffa4763157f0d17564e60cd1b702c6204296da2b` | PASS |
| `app/public/icons/icon-maskable-512.png` | `9eba7c834cb51b4b4c0eb7adbb10cdd72627eba9692cc50a0a40ae364e9032fd` | PASS |

## Historical candidate outputs — not current runtime

| runtime file | SHA-256 | format validation |
| --- | --- | --- |
| `app/src/app/icon.png` | `f083e8153dd7b85724400f6e58149d8a4358c1e1b17eca0e6e3ed1e340464800` | PNG, 512×512, 8-bit RGBA, real alpha |
| `app/src/app/apple-icon.png` | `a43e54f4479425c35c8e1c0a33684d6ce053a630b0dfccd8cdbb8c004d8cf9b3` | PNG, 180×180, 8-bit RGB, opaque |
| `app/src/app/favicon.ico` | `8cce89b9ce62206e990fae1fdbc95112f5446e09b1954146b42b8c52d6cade1e` | ICO, 16/32/48, three 32-bit opaque warm-cream/two-color frames |
| `app/public/icons/q-path-r2-192.png` | `9c1356daa5de0bac32f7079aa7d3f08b65d2064ff52e282845207031b5bdf7e8` | PNG, 192×192, 8-bit RGBA, real alpha |
| `app/public/icons/q-path-r2-512.png` | `f083e8153dd7b85724400f6e58149d8a4358c1e1b17eca0e6e3ed1e340464800` | PNG, 512×512, byte-identical cache-busting UI/PWA copy of the metadata icon |
| `app/public/icons/q-path-r2-maskable-512.png` | `1a3f0e571d2637df4daf10b672434673a86435227df4729b7c52d414efc4bab5` | PNG, 512×512, 8-bit RGB, opaque |

Browser QA caught one stale 40px Next Image derivative on the owner mobile header while components still used `/icon.png`. Customer/owner components and the manifest now use `/icons/q-path-r2-512.png`; the versioned file is byte-identical to `app/src/app/icon.png`. Manifest shortcuts use `/icons/q-path-r2-192.png`. A tracked-reference check passed before deleting exactly `app/public/icons/icon-192.png` and `app/public/icons/icon-maskable-512.png`; final tracked search finds no old PWA filename or old `/icon.png` component reference.

## Deterministic export record

Exporter: `/opt/homebrew/bin/magick`, ImageMagick `7.1.2-27 Q16-HDRI`.

ImageMagick's installed SVG coder parsed the approved `<path>` nodes but returned fully transparent path rasters (and only the background rectangle for opaque SVGs). The final exporter therefore uses ImageMagick vector drawing with the exact hash-verified SVG path data, colors, stroke width, and application transforms. It does not modify source SVG geometry. Each target size is rasterized directly to avoid resize halos.

The following commands are the exact final per-build exports, where `$out` is one isolated clean temporary directory:

```sh
magick=/opt/homebrew/bin/magick

"$magick" -size 512x512 canvas:none \
  -fill none -stroke "#3A2D25" -strokewidth 18 \
  -draw "push graphic-context scale 4.266666666666667,4.266666666666667 path 'M85 75A40 40 0 1 0 75 85' pop graphic-context" \
  -fill none -stroke "#E7A77C" -strokewidth 18 \
  -draw "push graphic-context scale 4.266666666666667,4.266666666666667 path 'M91 91L112 112' pop graphic-context" \
  -strip -define png:exclude-chunks=date,time PNG32:"$out/icon.png"

"$magick" -size 192x192 canvas:none \
  -fill none -stroke "#3A2D25" -strokewidth 18 \
  -draw "push graphic-context scale 1.6,1.6 path 'M85 75A40 40 0 1 0 75 85' pop graphic-context" \
  -fill none -stroke "#E7A77C" -strokewidth 18 \
  -draw "push graphic-context scale 1.6,1.6 path 'M91 91L112 112' pop graphic-context" \
  -strip -define png:exclude-chunks=date,time PNG32:"$out/q-path-r2-192.png"

"$magick" -size 180x180 canvas:"#FFF8EE" \
  -fill none -stroke "#3A2D25" -strokewidth 18 \
  -draw "push graphic-context translate 26.71875,26.71875 scale 1.0546875,1.0546875 path 'M85 75A40 40 0 1 0 75 85' pop graphic-context" \
  -fill none -stroke "#E7A77C" -strokewidth 18 \
  -draw "push graphic-context translate 26.71875,26.71875 scale 1.0546875,1.0546875 path 'M91 91L112 112' pop graphic-context" \
  -alpha off -strip -define png:exclude-chunks=date,time PNG24:"$out/apple-icon.png"

"$magick" -size 512x512 canvas:"#FFF8EE" \
  -fill none -stroke "#3A2D25" -strokewidth 18 \
  -draw "push graphic-context translate 100,100 scale 2.6,2.6 path 'M85 75A40 40 0 1 0 75 85' pop graphic-context" \
  -fill none -stroke "#E7A77C" -strokewidth 18 \
  -draw "push graphic-context translate 100,100 scale 2.6,2.6 path 'M91 91L112 112' pop graphic-context" \
  -alpha off -strip -define png:exclude-chunks=date,time PNG24:"$out/q-path-r2-maskable-512.png"

"$magick" -size 16x16 canvas:"#FFF8EE" \
  -fill none -stroke "#3A2D25" -strokewidth 18 \
  -draw "push graphic-context translate 2.375,2.375 scale 0.09375,0.09375 path 'M85 75A40 40 0 1 0 75 85' pop graphic-context" \
  -fill none -stroke "#E7A77C" -strokewidth 18 \
  -draw "push graphic-context translate 2.375,2.375 scale 0.09375,0.09375 path 'M91 91L112 112' pop graphic-context" \
  -strip -define png:exclude-chunks=date,time PNG32:"$out/favicon-16.png"

"$magick" -size 32x32 canvas:"#FFF8EE" \
  -fill none -stroke "#3A2D25" -strokewidth 18 \
  -draw "push graphic-context translate 4.75,4.75 scale 0.1875,0.1875 path 'M85 75A40 40 0 1 0 75 85' pop graphic-context" \
  -fill none -stroke "#E7A77C" -strokewidth 18 \
  -draw "push graphic-context translate 4.75,4.75 scale 0.1875,0.1875 path 'M91 91L112 112' pop graphic-context" \
  -strip -define png:exclude-chunks=date,time PNG32:"$out/favicon-32.png"

"$magick" -size 48x48 canvas:"#FFF8EE" \
  -fill none -stroke "#3A2D25" -strokewidth 18 \
  -draw "push graphic-context translate 7.125,7.125 scale 0.28125,0.28125 path 'M85 75A40 40 0 1 0 75 85' pop graphic-context" \
  -fill none -stroke "#E7A77C" -strokewidth 18 \
  -draw "push graphic-context translate 7.125,7.125 scale 0.28125,0.28125 path 'M91 91L112 112' pop graphic-context" \
  -strip -define png:exclude-chunks=date,time PNG32:"$out/favicon-48.png"

"$magick" "$out/favicon-16.png" "$out/favicon-32.png" "$out/favicon-48.png" \
  -strip "$out/favicon.ico"
```

The transparent/Apple/maskable export ran independently in `/private/tmp/q-path-r2-final-a.DGfUix` and `/private/tmp/q-path-r2-final-b.b2LEz0`. `cmp` passed byte-for-byte. Dark-browser inspection then showed the transparent monochrome favicon disappearing on cocoa browser chrome. The opaque warm-cream/two-color favicon amendment ran independently in `/private/tmp/bqa-q-path-favicon-opaque-a` and `...-b`; all three intermediate frames and the final ICO were byte-identical before runtime copy. `q-path-r2-512.png` is a byte-exact copy of the validated metadata icon.

## Mechanical and visual asset QA

- PASS — all four source SVGs pass `xmllint --noout` and approved SHA-256 checks.
- PASS — final dimensions, formats, 8-bit depths, RGB/RGBA modes, and alpha/opacity requirements.
- PASS — ICO contains exactly 16×16, 32×32, and 48×48 32-bit frames and remains visible on light, dark, and checker browser surfaces.
- PASS — 512 and 192 standard marks have real transparent pixels and no cream/white backing rectangle.
- PASS — source geometry has positive exterior clearance (`118.36 < 120` modeled maximum); direct-size rasterization avoids the rejected 192px Lanczos edge halo.
- PASS — the browser-rendered contact sheet confirms the favicon at 16/32/48, transparent standard icons on light/checker, actual owner dark-surface use with its cream wrapper, Apple/PWA applications, and maskable safe zone. Direct transparent use on a cocoa surface is explicitly unsupported because the cocoa route blends into that surface.
- PASS — maskable non-cream pixels have a measured maximum radius of `193.743px` from center, leaving `11.057px` inside the `204.8px` central-80% safe-circle radius.
- PASS — `git diff --check` and final tracked-reference checks.

## Application QA

| command/check | result |
| --- | --- |
| `pnpm typecheck` | PASS — no TypeScript errors |
| `pnpm lint` | PASS |
| `pnpm test:integration` | PASS — 14 files, 81 tests |
| `pnpm build` | PASS — standard Next 16.2.9 Turbopack production build, 16 static pages |
| `pnpm exec next build --webpack` | PASS — production build compiled, typechecked, generated all 16 static pages, and finalized traces |
| `pnpm exec playwright test tests/e2e/ui-rendering.spec.ts` | PASS — 3/3 |
| production route visual QA | PASS — customer home and owner login at 390px; owner mobile header at 390px; owner desktop sidebar at 1440px |
| live asset/manifest responses | PASS — six image endpoints returned 200/image content types; manifest exposes only versioned Q Path PWA paths |
| cache-busting regression | PASS — initial stale 40px owner-mobile image was reproduced; versioned 512 path removed it in the final production screenshot |
| final port check | PASS — TCP port 3000 is clear |

No seed, migration, queue mutation, customer mutation, commit, push, or deploy command was run. Owner-login rate-limit test buckets were cleared before and after the authenticated screenshot run; no queue/customer rows were created.

## Human review evidence

The following exact browser-rendered evidence is ready:

- `audit/logo-runtime-r1/icon-contact-sheet.png` — SHA-256 `1bfc30d9e91296bf14fe6bfdd8d647d13138d02366b83bc5d02cffc760dedb9a`
- `audit/logo-runtime-r1/customer-home-390.png` — SHA-256 `55a37eb81117a83a414662a55299ca4a2730f420f18381a8ce4890b494a066e0`
- `audit/logo-runtime-r1/owner-login-390.png` — SHA-256 `b8e5dc5b0c5c077ee943320f985633435ab675e034aeeaf364d037be450a81ef`
- `audit/logo-runtime-r1/owner-mobile-390.png` — SHA-256 `0639d10a17e6f289c72f0e6821da1f682050454e2bccea033f57944b9b0ee781`
- `audit/logo-runtime-r1/owner-desktop-1440.png` — SHA-256 `e85c26db8198d8aba9bb1d74011c072ae4d3a2ba086a01158c10ebec7758f4f7`

Human inspection confirms no icon clipping, square-backing leak on transparent UI applications, or icon-induced layout shift. Customer home and owner login have zero horizontal overflow. The mobile owner header and desktop sidebar both show Q Path R2 through the versioned cache-busting path.

## Closed gate and next action

`HUMAN_REVIEW_Q_PATH_R2_RUNTIME_ASSETS_R1` was **closed without PASS**. Technical and browser QA passed, but the candidate was rolled back before promotion.

Current direction is a new imagegen-first concept round. Do not restore or promote the Q Path runtime derivatives unless Kiattisak explicitly reopens this historical lane.
