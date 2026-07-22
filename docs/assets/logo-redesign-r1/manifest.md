# Barber Queue logo redesign R1

All work in this folder is **candidate/reference** only. No candidate is approved for runtime promotion.

Human selection — 2026-07-22: **Q Path selected for refinement**. This selects the concept thesis only; the R1 geometry and every runtime replacement remain unapproved.

## Shared system

The family expresses **queue flow + precise cut** with substantial geometric paths, deliberate open space, and exact terminals. The marks are flat, source-owned SVG geometry with no wordmark, backing shape, gradient, shadow, texture, or fine decorative detail. Each canonical SVG uses `currentColor`, defaults to cocoa, and can be rendered as one-color cocoa or white. The comparison board assigns a single palette color to each candidate; no mark uses more than one color.

## Candidates

### 01 — Q Path

- **Status:** candidate/reference; preferred lead.
- **Design logic:** a nearly complete queue circuit is interrupted at one controlled diagonal gate. The separated continuation reads as both the Q tail and the next step leaving the queue.
- **Strengths:** most immediate relationship to the product name; strongest silhouette; open counter remains clear at 16px; stable in cream, cocoa, and reversed-white settings.
- **Limitations:** the separated tail is intentionally small at 16px and can read as a terminal point rather than a path segment; spacing between the ring and tail must not be tightened in later production.

### 02 — Queue Fold

- **Status:** candidate/reference.
- **Design logic:** one continuous route folds through three orderly lanes, turning waiting order into a compact operational symbol.
- **Strengths:** simple continuous construction; calm lateral motion; reliable one-color and reversed behavior; no dependent internal counter.
- **Limitations:** its compact silhouette can read as the numeral `2` before the queue-fold idea is explained. This makes it a useful route symbol but a less direct Barber Queue identifier than Q Path.

### 03 — BQ Motion

- **Status:** candidate/reference.
- **Design logic:** a reduced B silhouette shares its lower counter with a Q; the diagonal stroke crosses that counter and exits forward as a handoff.
- **Strengths:** strongest initial-based ownership; compact header presence; the revised lower counter stays open in cocoa and reversed white.
- **Limitations:** it carries more geometry than the other candidates and the Q depends on reading the diagonal inside the lower bowl. At 16px it resolves first as a B-shaped monogram, with the Q becoming clearer at 40px and above.

## Browser QA

- Opened `comparison.html` in Chrome and captured the full browser-rendered page at a 1600px board viewport.
- Inspected the rendered board after correcting the local-file SVG loading method; the final board uses inline symbol copies of the exact canonical paths so all reference applications render consistently.
- Confirmed all 18 displayed mark instances render, including exact `16px`, `40px`, and `192px` boxes for every candidate.
- Inspected cream, reversed-white-on-cocoa, and simple `Barber Queue` header lockups for all three marks.
- Checked small-size legibility: Q Path's counter and interruption remain distinct; Queue Fold remains continuous; BQ Motion retains two counters, although its Q reading is secondary at 16px.
- Checked optical balance and clipping in the final 1600 × 2068px browser capture: no mark, label, size sample, or panel is clipped; all viewBoxes retain safe exterior space.
- Checked SVG parsing and single-color behavior. Canonical fills/strokes use `currentColor`, with cocoa as the standalone default and white demonstrated in the reversed panels.

## Recommendation

Advance **Q Path** for human selection. It makes the thesis legible with the least geometry, performs best at 16px, and is the most direct bridge between the product name and the operational promise. Keep Queue Fold and BQ Motion as genuine alternatives, not variants of the lead.
