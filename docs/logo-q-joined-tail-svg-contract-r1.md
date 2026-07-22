# Barber Queue — Joined Tail Q SVG Redraw Contract R1

Status: **one bounded SVG redraw candidate authorized; no runtime promotion**

Human result: **PASS**. Kiattisak approved `joined-tail-q-r1.svg` SHA-256 `023ade5d84638328cd3a8e65c80cc01bd468e3351e8b3e1e0c070f4631659de4` as canonical geometry. Derivative and runtime work remain separately gated.

## Selected source authority

- Human-selected direction: **C — Joined Tail Q**
- Raw reference: `docs/assets/logo-q-imagegen-r3/direction-c-joined-tail/raw-imagegen.png`
- Raw SHA-256: `15d724ce276219d6d0bd65d671c3507a31f47ca0ae54ec7e706bb36821569d6f`
- Selection scope: structure only, not provider pixels, shading, canvas, edge softness, or exact raster contour.

## Structure to preserve

- one standalone capital Q;
- softened rectilinear/rounded-rectangle outer bowl, not a perfect circle;
- vertically proportioned rounded-rectangle counter;
- substantial diagonal tail beginning inside the lower counter and exiting lower-right;
- one narrow cream/transparent negative slot at the right-side junction that makes the crossing order clear;
- compact, centered silhouette with low magnifier risk.

Do not change the direction into Carved Counter, Soft Turn, Q Path, a font-derived Q, or a circle-plus-handle mark.

## Allowed redraw corrections

- replace all provider shading with exact flat geometry;
- simplify curves and align weight for a deterministic vector;
- soften corners enough for Friendly Practical Modern without becoming bubbly;
- shorten or widen the tail only where 16/32px reading requires it;
- rebalance counter and outer bowl optically;
- ensure the junction slot survives target sizes without becoming a crack or disappearing.

These are technical/optical corrections, not authorization to redesign the selected structure.

## Candidate deliverables

Under `docs/assets/logo-q-joined-tail-svg-r1/` only:

- `joined-tail-q-r1.svg` — canonical one-color `currentColor`, path-only SVG;
- `comparison.html` — selected raw plus SVG source, monochrome/reversed, light/dark/checker, exact sizes, and product-context previews;
- `comparison.png` — browser-rendered 1600px review board;
- `manifest.md` — source/geometry/QA/hashes/limitations.

No color variant, app icon, favicon, PWA derivative, wordmark, runtime path, package, code, test, commit, push, or deploy in this pass.

## SVG requirements

- `viewBox="0 0 120 120"` preferred unless documented otherwise;
- exact one-color geometry through `currentColor`;
- visible geometry uses paths only; no live text, raster embed, filter, gradient, mask dependent on browser-specific behavior, or external asset;
- one coherent mark with explicit even-odd negative counter/slot geometry or another deterministic path-only construction;
- no detached alpha residue or element outside bounds;
- metadata/title/description mark status `selected-source/svg-redraw-candidate` and gate.

## Browser QA

The comparison board must load the external SVG and show:

- full selected raw reference uncropped beside the flat redraw;
- source large view on warm cream;
- one-color cocoa, black monochrome, and reversed-white proof;
- checker proof for real transparency;
- exact 16, 24, 32, 40, 44, 180, 192, and 512px boxes;
- customer header, owner mobile, owner dark sidebar with light backing;
- Apple/PWA and central-80% maskable simulations clearly labelled as previews only.

Measure exact sample boxes, no overflow/clipping, and all image loads. Human visual review must judge Q recognition, selected-source fidelity, low magnifier risk, friendly-versus-corporate balance, tail compactness, slot survival, and 16px readability.

Stop at `HUMAN_REVIEW_BARBER_QUEUE_JOINED_TAIL_Q_SVG_R1`. Technical PASS cannot self-approve runtime promotion.
