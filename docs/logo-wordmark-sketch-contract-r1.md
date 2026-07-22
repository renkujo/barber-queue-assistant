# Barber Queue — Queue Word Rhythm Vector Sketch Contract R1

Status: **three vector wordmark sketches authorized; no icon or runtime promotion**

Final human result: **REJECT_ALL**. Quiet Rhythm, Measured Slots, and Open Turn are historical sketch evidence only. Do not iterate this contract until the visual-direction failure is diagnosed with Kiattisak.

Authority: `docs/logo-reference-led-brief-r1.md`, approved by Kiattisak.

## Core thesis

Design the name first. Every sketch uses the lowercase text `barber queue` and makes the natural `u-e-u-e` rhythm inside `queue` carry the product idea. The identity should feel Friendly Practical Modern: useful, compact, calm, locally human, and adult.

Reference roles remain strict:

- Booksy: wordmark-first category positioning and one restrained custom gesture only;
- Gusto: approachable owned lettering only;
- Square: future application-role discipline only.

Do not reproduce their glyphs, spacing, geometry, palette, assets, or lockups.

## Base font authority

Use the app's established official LINE Seed Sans TH sources as the only base:

- Regular: `app/public/fonts/line-seed-sans-th/LINESeedSansTH_W_Rg.woff2` — SHA-256 `caf74c95ba957707253e40747d8364c937970df80551ab0766afc073d1fd90d6`
- Bold: `app/public/fonts/line-seed-sans-th/LINESeedSansTH_W_Bd.woff2` — SHA-256 `63a428a7989a73de4e908092717de3a70a2c128b7b01b35a3821f39db22a2003`
- Extra Bold: `app/public/fonts/line-seed-sans-th/LINESeedSansTH_W_XBd.woff2` — SHA-256 `d3650b99c0ba298365c7a8a95fcc628421d5a8e23fc99484a23a52f3c855c99b`

The self-hosted files came from the official LINE Seed package (`https://seed.line.me/index_th.html`) and already define the live app's Thai-first typography.

Final sketch SVGs must contain outlined path geometry rather than live `<text>`. Transient `uv`/fontTools use is allowed; do not add project dependencies or modify the font sources.

## Shared construction rules

- Exact visible wording: `barber queue`, lowercase, one line.
- Cocoa `#3A2D25` is primary; apricot `#E7A77C` may mark exactly one next-turn intervention.
- No standalone icon, Q circle, magnifier, comb, chair, barber tool, badge, dot queue, arrow, detached punctuation square, gradient, shadow, or texture.
- Preserve easy reading before conceptual cleverness.
- Custom intervention must stay inside or directly attached to approved letter geometry; no floating decorative piece.
- Compact enough for approximately 120–180px-wide headers and readable at 18/24/32/48px heights.
- One-color cocoa and reversed-white forms must preserve all meaning.
- Do not derive or approve a favicon/app glyph in this pass. A small `bq`/queue-module box may appear only as clearly labelled diagnostic potential, never as a candidate asset.

## Three sketches

### A — Quiet Rhythm

- Minimal intervention.
- One consistent Bold construction.
- Own the mark through spacing and repeated `ueue` rhythm.
- Exactly one subtle apricot terminal/cut attached to the final `e`; cocoa monochrome must still work.
- Goal: calmest, clearest, closest to category restraint.

### B — Measured Slots

- Medium intervention.
- Regular or Bold `barber`; heavier `queue` is allowed.
- Deliberately equalize repeated counter/spacing rhythm across `u-e-u-e` while preserving normal reading.
- Use one integrated opening/notch as “next slot,” not a literal comb/fence or repeated holes.
- Goal: strongest product-action idea without becoming an icon row.

### C — Open Turn

- Strongest intervention, still wordmark-first.
- Customize the lowercase `q` descender and one later terminal so movement through `queue` feels continuous.
- The intervention may link baseline rhythm but must not create a standalone arrow, loop icon, or script flourish.
- Goal: most ownable source lettering while staying practical and legible.

## Deliverables

Under `docs/assets/logo-wordmark-r1/` only:

- `quiet-rhythm.svg`
- `measured-slots.svg`
- `open-turn.svg`
- `comparison.html`
- `comparison.png`
- `manifest.md`

Each SVG must identify its sketch status in metadata/title/description and use source-owned path geometry. The browser board must show:

- large cocoa/cream source view;
- one-color and reversed proof;
- exact 18/24/32/48px-height wordmark samples;
- customer header, owner dark-sidebar with approved light backing, and compact owner-mobile context;
- diagnostic-only future glyph-source box clearly marked as not approved.

## QA and gate

- Verify font hashes before outlining.
- Verify SVG XML, bounds, no clipping, no unexpected live text, and one-line wording.
- Browser-render all external SVGs and record natural/load state plus exact sample boxes.
- Inspect visual reading at every named size and on light/dark surfaces.
- Record font/provenance, custom geometry, limitations, and source hashes in the manifest.
- No runtime/code/package/test/old-logo/provider/commit/push/deploy changes.

Stop at `HUMAN_REVIEW_BARBER_QUEUE_WORDMARK_R1`. Human selection approves one vector sketch direction only, not runtime integration or a derived app glyph.
