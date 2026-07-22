# Barber Queue — Q Path refinement R2

Status: **selected-concept/refinement-candidate**. Human review is required. Nothing in this folder is approved for runtime promotion.

Human decision — 2026-07-22: **PASS Q Path R2**. The R2 geometry is the approved logo source authority for preparing a runtime replacement plan. PASS does not itself authorize replacing app assets, committing, pushing, or deploying.

## Provenance and scope

- Selected authority: `docs/assets/logo-redesign-r1/q-path.svg`.
- Refinement authority: `docs/logo-redesign-q-path-r2-contract.md`.
- This pass preserves the selected Q Path thesis and does not introduce or compare another concept.
- The R1 open circular route is retained exactly. The only geometry change replaces the detached square with a longer route segment aligned to the same 45° forward direction.
- No runtime assets, application code, package files, R1 files, or deployed surfaces were changed.

## Delivered files

| filename | role | format | geometry relationship | status |
| --- | --- | --- | --- | --- |
| `q-path-r2.svg` | Canonical one-color mark | SVG, `viewBox="0 0 120 120"` | Shared R2 geometry using `currentColor`; no backing or wordmark | selected-concept/refinement-candidate |
| `q-path-r2-color.svg` | Cocoa/apricot application | SVG, `viewBox="0 0 120 120"` | Same R2 paths; cocoa route and apricot exit; no gradient | selected-concept/refinement-candidate |
| `q-path-r2-app-icon.svg` | Standard Apple/PWA source application | SVG, `viewBox="0 0 512 512"` | Same R2 paths at 360px nominal placement on full-bleed warm cream | selected-concept/refinement-candidate |
| `q-path-r2-maskable.svg` | Maskable PWA application | SVG, `viewBox="0 0 512 512"` | Same R2 paths at 312px nominal placement on full-bleed warm cream | selected-concept/refinement-candidate |
| `refinement.html` | Browser review board | HTML, fixed 1600px review viewport | Inline reference geometry plus the delivered icon files | selected-concept/refinement-candidate |
| `refinement.png` | Inspected browser capture | PNG | Exact full-page browser render of `refinement.html` | selected-concept/refinement-candidate |
| `manifest.md` | Construction, QA, limitations, and promotion record | Markdown | Documentation only | selected-concept/refinement-candidate |

## Construction logic

- Route: the R1 path `M85 75A40 40 0 1 0 75 85` remains unchanged at an 18-unit stroke.
- Exit: `M91 91L112 112` replaces the detached R1 square. It uses the same 18-unit stroke, a 45° centerline, and butt terminals.
- Cut: the exit begins at `(91, 91)`, leaving a visible diagonal interruption from the open circuit. The cut remains geometric in the monochrome version; color is never required to explain it.
- Counter: the existing open counter and broad circular route are preserved.
- Bounds: the canonical content stays within the `0 0 120 120` viewBox. The exit's stroked maximum is approximately `118.36`, retaining exterior clearance.
- App placement: the standard icon maps the shared 120-unit geometry into a 360px nominal square at `(76, 76)`.
- Maskable placement: the maskable icon maps it into a 312px nominal square at `(100, 100)`. Its complete stroked geometry remains inside the central 80% safe circle (409.6px diameter), with additional clearance at the diagonal exit.

## QA record

- Browser-rendered board: loaded from the local file in Chrome through Chrome DevTools at a 1600 × 900 CSS-pixel viewport, DPR 1, then captured as a full 1600 × 3649px page. The direct installed-Chrome headless process was blocked by the workspace process sandbox, so the contract's Chrome DevTools screenshot fallback was used. The exact inspected inline PNG was persisted as `refinement.png`.
- R1 → R2: confirmed at large size. The circuit is unchanged; the exit is visibly longer, aligned at 45°, and reads as a forward bar instead of the R1 point-like square.
- 16px gap survival: confirmed in a dedicated browser crop at DPR 1. The light cut remains visible between the circuit and exit, the open counter stays clear, and no tiny disconnected residue appears.
- Exact sizes: browser measurement returned exact 16 × 16, 32 × 32, 40 × 40, 44 × 44, 180 × 180, 192 × 192, and 512 × 512 CSS-pixel boxes.
- Light/dark/monochrome: cocoa on cream, reversed white on cocoa, two-color, and black monochrome all preserve the same Q/cut/continuation reading. Color is not required for meaning.
- Product contexts: the favicon/tab simulation, 44px cream header lockup, and 40px dark owner-sidebar lockup are legible and optically balanced.
- Apple/PWA: the 180px and 192px standard-icon simulations remain centered with generous warm-cream clearance and no rounded-mask clipping.
- Maskable: the full-bleed 512px source was inspected under a circular central-80% overlay. The nearest modeled tail corners retain approximately 12.17px of clearance inside the safe-circle boundary.
- Bounds and clipping: browser inspection found no horizontal overflow or clipped board elements. The canonical tail's axis-aligned stroked maximum is approximately `118.36` in the 120-unit viewBox, leaving exterior clearance; the route also remains inside the viewBox.
- Validation: all four SVGs pass `xmllint --noout`; all external board images loaded completely; Chrome reported no console warnings or errors; the folder contains exactly the seven contracted files.

## Honest limitations

- The mark intentionally reads as an abstract Q first. In isolated use, especially without the Barber Queue name, a circle plus diagonal can still suggest a magnifier or a generic Q to some viewers.
- The open circuit, explicit cut, and equal-weight forward route reduce that risk but cannot eliminate it without adding concept-extraneous detail.
- At 16px the forward segment necessarily compresses to only a few device pixels. Final approval should include human inspection on representative low-density and high-density displays, not only the captured browser environment.
- This pass validates reference SVG applications, not final raster exports, OS-generated icon masks, device-specific color management, or production integration.

## Recommendation

Advance this R2 geometry to Kiattisak's human review as the stronger expression of the selected Q Path concept: it fixes the punctuation-like R1 exit while preserving the open queue circuit, deliberate cut, and compact one-color recognition. Do not promote or derive runtime assets from this refinement candidate yet.

## Runtime candidate R1

Runtime execution is mechanically and browser-QA complete and is waiting at `HUMAN_REVIEW_Q_PATH_R2_RUNTIME_ASSETS_R1`.

- metadata/UI 512 PNG: `f083e8153dd7b85724400f6e58149d8a4358c1e1b17eca0e6e3ed1e340464800`
- Apple 180 PNG: `a43e54f4479425c35c8e1c0a33684d6ce053a630b0dfccd8cdbb8c004d8cf9b3`
- cross-theme favicon ICO: `8cce89b9ce62206e990fae1fdbc95112f5446e09b1954146b42b8c52d6cade1e`
- PWA 192 PNG: `9c1356daa5de0bac32f7079aa7d3f08b65d2064ff52e282845207031b5bdf7e8`
- maskable 512 PNG: `1a3f0e571d2637df4daf10b672434673a86435227df4729b7c52d414efc4bab5`
- audit receipt: `audit/logo-runtime-r1/README.md`
- contact sheet SHA: `1bfc30d9e91296bf14fe6bfdd8d647d13138d02366b83bc5d02cffc760dedb9a`

The first browser run caught a stale 40px Next Image derivative on the owner mobile header. Final UI and manifest paths use byte-identical versioned `q-path-r2-512.png`, and the final production screenshot shows Q Path R2. Transparent standard icons require a light/cream backing on cocoa surfaces; the actual owner sidebar supplies that backing. Runtime promotion, commit, push, and deployment remain unapproved until separate human decisions.

Human direction change — 2026-07-22: Kiattisak chose to stop the Q Path runtime candidate and reopen logo exploration with real Image Gen. The scoped runtime candidate was rolled back byte-for-byte before commit/push/deploy. Q Path R1/R2, this manifest, and `audit/logo-runtime-r1/` are historical design/QA evidence only; they are not current runtime or current concept authority.
