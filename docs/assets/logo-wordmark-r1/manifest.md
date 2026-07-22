# Barber Queue — Wordmark Sketch Manifest R1

Status: **REJECT_ALL — historical candidate/reference assets only**  
Gate result: `REJECT_ALL_BARBER_QUEUE_WORDMARK_R1`  
Exact visible wording: `barber queue`

Human decision — 2026-07-22: Kiattisak rejected A, B, and C. None is a wordmark, refinement, glyph, or runtime authority. Preserve the outlined sources and QA board only as evidence; do not refine or promote them without a new explicit direction.

No winner is approved by this pass. None of these files is authorized for runtime integration, an app icon, favicon, derived glyph, commit, push, or deploy.

## Delivered review files

| file | role | source strategy | required QA |
| --- | --- | --- | --- |
| `quiet-rhythm.svg` | Candidate A source-owned outlined wordmark | LINE Seed Sans TH Bold outlines + one attached custom terminal | XML, path-only visible letters, light/dark, 18/24/32/48px |
| `measured-slots.svg` | Candidate B source-owned outlined wordmark | Regular `barber` + ExtraBold `queue` + one negative notch | XML, path-only visible letters, light/dark, 18/24/32/48px |
| `open-turn.svg` | Candidate C source-owned outlined wordmark | ExtraBold outlines + attached q-foot and final-e terminal geometry | XML, path-only visible letters, light/dark, 18/24/32/48px |
| `comparison.html` | Browser comparison and application board | External `<img>` references to the three SVG files; no inline candidate approximation | 1600px viewport, natural loads, sample boxes, overflow |
| `comparison.png` | Browser-rendered review board | Chromium rendering of `comparison.html` at 1600 × 2500 | Visual inspection for reading, clipping, contrast, and context fit |
| `manifest.md` | Provenance, construction, QA, risk, and handoff record | This document | Scope and hash audit |

## Source authority and verified hashes

The only letterform bases are the existing repo WOFF2 files below. They were read in place and not changed.

| source | SHA-256 required by contract | SHA-256 verified 2026-07-22 | result |
| --- | --- | --- | --- |
| `app/public/fonts/line-seed-sans-th/LINESeedSansTH_W_Rg.woff2` | `caf74c95ba957707253e40747d8364c937970df80551ab0766afc073d1fd90d6` | `caf74c95ba957707253e40747d8364c937970df80551ab0766afc073d1fd90d6` | match |
| `app/public/fonts/line-seed-sans-th/LINESeedSansTH_W_Bd.woff2` | `63a428a7989a73de4e908092717de3a70a2c128b7b01b35a3821f39db22a2003` | `63a428a7989a73de4e908092717de3a70a2c128b7b01b35a3821f39db22a2003` | match |
| `app/public/fonts/line-seed-sans-th/LINESeedSansTH_W_XBd.woff2` | `d3650b99c0ba298365c7a8a95fcc628421d5a8e23fc99484a23a52f3c855c99b` | `d3650b99c0ba298365c7a8a95fcc628421d5a8e23fc99484a23a52f3c855c99b` | match |

The official-source claim is inherited from the approved contract. This pass did not fetch the LINE site or any external font source.

## Outlining method

- A transient Objective-C/CoreText utility was created under `/tmp`, outside the repository.
- Each verified WOFF2 was registered at process scope with `CTFontManagerRegisterFontsForURL`.
- `CTFontCreatePathForGlyph` produced the source glyph `CGPath` at 1000-unit construction size.
- Paths were translated into candidate positions, vertically transformed for SVG coordinates, and serialized as `M`, `L`, `Q`, `C`, and `Z` commands.
- The three final SVGs contain no live `<text>`, embedded font, raster trace, `<image>`, or `<foreignObject>`.
- No package, project dependency, font file, app code, test, or runtime file was added or changed.

## Exact base-outline versus custom-geometry record

Visible outline IDs use this fixed glyph order: `00 b`, `01 a`, `02 r`, `03 b`, `04 e`, `05 r`, `06 q`, `07 u`, `08 e`, `09 u`, `10 e`.

### A — Quiet Rhythm

- Base outlines: all eleven visible glyphs, IDs `a-base-00-b` through `a-base-10-e`, are unredrawn LINE Seed Sans TH Bold glyph paths translated into the compact one-line layout.
- Spacing intervention: manual origin steps of `615, 612, 386, 615, 548, 360, 190, 590, 560, 540, 560` source units across the full character sequence, tightening the name and making the `u-e-u-e` cadence regular without altering counters.
- Custom geometry: `a-custom-final-e-terminal` is one apricot closed Bézier path. It overlaps and is directly attached to the final source `e` crossbar; it is not a detached mark.
- Palette: cocoa `#3A2D25` primary; exactly one apricot `#E7A77C` intervention.
- SVG geometry count: 11 base letter paths + 1 attached custom path.

### B — Measured Slots

- Base outlines: IDs `b-base-00-b` through `b-base-05-r` are LINE Seed Sans TH Regular. IDs `b-base-06-q` through `b-base-10-e` are LINE Seed Sans TH ExtraBold.
- Rhythm intervention: the five `queue` glyph origins are exactly 600 source units apart, equalizing the repeated `u-e-u-e` slot cadence while keeping normal reading order.
- Custom geometry: `b-custom-next-slot-notch` is one transparent trapezoidal negative-space cut applied only to `b-base-10-e` through an even-odd path clip. The source final `e` remains the letter base; the notch opens its crossbar and introduces no detached object.
- Palette: cocoa `#3A2D25` only; zero apricot interventions.
- SVG geometry count: 11 base letter paths + 1 custom negative-space path.

### C — Open Turn

- Base outlines: all eleven visible glyphs, IDs `c-base-00-b` through `c-base-10-e`, are LINE Seed Sans TH ExtraBold source paths.
- Spacing intervention: queue origin steps are `625, 575, 555, 575` source units, using a denser alternating cadence than A or B.
- Custom q geometry: `c-custom-q-descender` overlaps the lower source q stem and adds a continuous rightward foot. It remains physically attached to the `q`; no comma, arrow, or standalone loop is created.
- Custom later terminal: `c-custom-final-e-terminal` is one apricot closed Bézier path overlapping and attached to the final source `e` crossbar. The broad curved terminal is the one next-turn color intervention.
- Palette: cocoa `#3A2D25` primary; exactly one apricot `#E7A77C` intervention.
- SVG geometry count: 11 base letter paths + 2 attached custom paths.

## Shared art-direction boundaries

- All three are lowercase, one line, compact, and wordmark-first.
- There is no standalone icon, Q-circle, magnifier, arrow, barber object, badge, detached punctuation, dot queue, gradient, shadow, or texture in any SVG.
- Monochrome and reversed proofs use the same external SVG geometry with browser color filtering; no alternate inline drawing is substituted.
- The comparison board treats Booksy as category restraint, Gusto as owned-letter rhythm, and Square as future application discipline only. It contains no fetched or copied reference asset.
- The future glyph-source panels are deliberately empty diagnostic boxes. They name possible source zones but draw and approve no favicon/app glyph.
- No old logo, Q Path, Image Gen output, or provider-generated visual was opened or used as a visual input.

## Browser and structural QA

| check | observed result | status |
| --- | --- | --- |
| SVG XML | all three pass `xmllint --noout` | pass |
| Visible live text/raster/embed | no `<text>`, `<image>`, or `<foreignObject>` in the SVGs | pass |
| Candidate status | root data, title, description, and metadata identify candidate/reference-only status and human-review gate | pass |
| Exact wording | glyph IDs map in order to `b a r b e r q u e u e`; root accessibility label is `barber queue`; visual inspection reads `barber queue` in all views | pass |
| External board sources | 30/30 external SVG `<img>` instances completed with positive natural dimensions | pass |
| Natural dimensions | A `720 × 124`, B `720 × 122`, C `720 × 124` browser pixels | pass |
| Viewport and overflow | Chromium viewport `1600`; document width `1600`; no horizontal overflow | pass |
| Exact sample boxes | every A/B/C sample measured exactly `18`, `24`, `32`, and `48` CSS px high | pass |
| Sample widths at 18px | A `104.59375`, B `106.65625`, C `104.21875` CSS px | pass |
| Sample widths at 24px | A `139.453125`, B `142.21875`, C `138.953125` CSS px | pass |
| Sample widths at 32px | A `185.953125`, B `189.625`, C `185.28125` CSS px | pass |
| Sample widths at 48px | A `278.921875`, B `284.4375`, C `277.921875` CSS px | pass |
| Contexts | customer header, dark owner sidebar with light backing, and compact owner-mobile are present for every candidate | pass |
| Mono/reversed | every candidate remains readable and retains its intervention geometry in black and white proofs | pass |
| Bounds/clipping | source views, proofs, scale rows, q descenders, and attached final-e terminals were visually inspected in the 1600px screenshot; no clipping observed | pass |
| Review image | Chromium headless shell revision 1228 rendered `comparison.png` at `1600 × 2500` | pass |

The Chromium process emitted managed-sandbox warnings for unavailable macOS notification/network services, but exited successfully, wrote the PNG, loaded every local SVG, and returned the measurements above. No network access was used.

## Honest risks

- **A:** safest reading and calmest rhythm, but the terminal can become nearly invisible at 18px and the construction remains closest to its Bold source.
- **B:** communicates the queue action most directly, but the Regular/ExtraBold handoff may read as semantic emphasis; the final-e notch should be watched in low-quality rasterization.
- **C:** most customized and strongest in weight, but the q foot is the highest-expression detail and may feel too assertive in very compact owner UI.
- The board proves static scale behavior only. It does not authorize CSS filters, production spacing, runtime layout, responsive lockups, or a glyph derivation.

## Review recommendation — not approval

Begin human review with **B as the product-action challenger**, compare it directly against **A as the readability/restraint benchmark**, and use **C as the ownability boundary**. This ordering is a review recommendation only: no winner is selected or approved here.

## Output hashes

SHA-256 after final browser render:

| output | SHA-256 |
| --- | --- |
| `quiet-rhythm.svg` | `48f32762130d32fa2f12caa6d2c1d570f02532493d1385ab4ce2f77acda2c3b6` |
| `measured-slots.svg` | `b37a48d647ab56d2e6ce71195dc6ab17aae53e1d8ac492c71e2f6b1f1e60e46e` |
| `open-turn.svg` | `1483bac91253a0d0c3cf30786145689d9106499bc052447b70f03b6f03d4208c` |
| `comparison.html` | `16618c87a21dcda3e626198616b7384ff8e0d7038039d64dd0e3280d7d177b8c` |
| `comparison.png` | `8a5cb4528fa3854a655489d919dff4e6391184891a1808add6df229e886cb2c6` |

`manifest.md` does not embed its own hash because doing so would be self-referential. Its exact delivered hash is reported in the handoff after this file is finalized.

## Stop gate

`REJECT_ALL_BARBER_QUEUE_WORDMARK_R1`

No vector sketch direction was selected. Runtime integration and derived app glyph work remain blocked.
